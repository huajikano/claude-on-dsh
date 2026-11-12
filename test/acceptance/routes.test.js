import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import childProcess from 'node:child_process'
import { syncBuiltinESMExports } from 'node:module'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { apply, planningPermissionMode } from '../../index.js'

// Isolate detection and history from the user's real profile. With no
// claude.exe on PATH the acceptance judge degrades immediately instead of
// spawning a real model call.
const ENV_KEYS = ['DSH_HOME', 'APPDATA', 'LOCALAPPDATA', 'USERPROFILE', 'HOME', 'PATH']

async function withIsolatedEnv(run) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cod-routes-'))
  const saved = {}
  for (const key of ENV_KEYS) saved[key] = process.env[key]
  process.env.DSH_HOME = path.join(root, 'dsh')
  process.env.APPDATA = path.join(root, 'appdata')
  process.env.LOCALAPPDATA = path.join(root, 'localappdata')
  process.env.USERPROFILE = path.join(root, 'home')
  process.env.HOME = path.join(root, 'home')
  process.env.PATH = path.join(root, 'bin')
  await mkdir(path.join(root, 'home'), { recursive: true })
  await mkdir(path.join(root, 'bin'), { recursive: true })
  try {
    return await run(root)
  } finally {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key]
      else process.env[key] = saved[key]
    }
    await rm(root, { recursive: true, force: true })
  }
}

function createHarness(workspace) {
  const routes = new Map()
  const calls = { prompts: [], presets: [], approvals: [], inspections: 0 }
  const ctx = {
    effect(callback) {
      const disposer = callback()
      return typeof disposer === 'function' ? disposer : () => {}
    },
    on() {
      return () => {}
    },
    get() {
      return undefined
    },
    logger: { info() {}, warn() {} },
    connection: {
      fetch: {
        register(route) {
          for (const method of route.methods) routes.set(`${method} ${route.path}`, route.fetch)
          return () => {}
        },
      },
    },
    workspaceRegistry: {
      async create(dir, title) {
        return { id: 'ws-1', path: dir, title: title || 'workspace' }
      },
      async archiveSession() {},
    },
    sessionController: {
      async inspect() {
        calls.inspections += 1
        return { meta: { cwd: workspace }, events: [] }
      },
      async prompt(request) {
        calls.prompts.push(request)
        return { accepted: true }
      },
      async resolveAgent() {
        return { agent: { id: 'session-agent' } }
      },
    },
    sessions: {
      get(sessionId) {
        return { id: sessionId, header: { cwd: workspace } }
      },
    },
    permissionPresets: {
      set(session, preset) {
        calls.presets.push({ sessionId: session.id, preset })
      },
      current() {
        return 'danger-full-access'
      },
    },
    approval: {
      setPolicy() {
        calls.approvals.push('never')
      },
    },
    agents: {
      get() {
        return undefined
      },
    },
    userQuestions: {
      async ask() {
        throw new Error('no answerer in test')
      },
    },
  }
  async function invoke(method, pathname, body, query = '') {
    const handler = routes.get(`${method} /api/claude-on-dsh${pathname}`)
    assert.ok(handler, `missing route ${method} ${pathname}`)
    const response = await handler(
      new Request(`http://127.0.0.1/api/claude-on-dsh${pathname}${query}`, {
        method,
        headers: { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    )
    return { status: response.status, data: await response.json() }
  }
  return { ctx, calls, invoke }
}

async function waitFor(check, timeoutMs = 5_000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const value = await check()
    if (value) return value
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error(`condition not met within ${timeoutMs}ms`)
}

test('browser requests cannot escalate beyond the panel permission modes', () => {
  assert.equal(planningPermissionMode('plan', 'plan'), 'plan')
  assert.equal(planningPermissionMode('acceptEdits', 'plan'), 'acceptEdits')
  assert.equal(planningPermissionMode('bypassPermissions', 'plan'), 'plan')
  assert.equal(planningPermissionMode('auto', 'dontAsk'), 'dontAsk')
  assert.equal(planningPermissionMode('', 'acceptEdits'), 'acceptEdits')
  // An explicit operator configuration is still honored.
  assert.equal(planningPermissionMode('bypassPermissions', 'bypassPermissions'), 'bypassPermissions')
})

test('lean mode: /acceptance/run and /acceptance/skip are implemented, not stubs', async () => {
  await withIsolatedEnv(async (root) => {
    const workspace = path.join(root, 'workspace')
    await mkdir(workspace, { recursive: true })
    const harness = createHarness(workspace)
    apply(harness.ctx, { acceptance: { reportDir: '.dsh/acceptance' } })

    const run = await harness.invoke('POST', '/acceptance/run', { sessionId: 'session-lean' })
    assert.equal(run.status, 200, JSON.stringify(run.data))
    assert.equal(run.data.started, true)

    const done = await waitFor(async () => {
      const result = await harness.invoke('GET', '/acceptance', undefined, '?id=session-lean')
      const state = result.data && result.data.state
      return state && ['completed', 'failed', 'skipped'].includes(state.state) ? result.data : null
    })
    assert.equal(done.state.state, 'completed')
    assert.ok(existsSync(path.join(workspace, '.dsh', 'acceptance', 'session-lean.json')))

    const skip = await harness.invoke('POST', '/acceptance/skip', { sessionId: 'session-skip' })
    assert.equal(skip.status, 200, JSON.stringify(skip.data))
    const skipped = await harness.invoke('GET', '/acceptance', undefined, '?id=session-skip')
    assert.equal(skipped.data.state.state, 'skipped')
  })
})

test('first-question handoff forwards the requirement and records the session', async () => {
  await withIsolatedEnv(async (root) => {
    const workspace = path.join(root, 'existing-project')
    await mkdir(workspace, { recursive: true })
    const harness = createHarness(workspace)
    apply(harness.ctx, {})
    const question = '并行分支失败时是否回滚？'
    const background = `${question}我们正在给现有流程增加并行分支。`
    const result = await harness.invoke('POST', '/session/first-question/send', {
      sessionId: 'session-abc',
      requirement: '给现有流程增加并行分支',
      projectDir: workspace,
      title: 'Existing Project',
      question,
      answer: '是，必须回滚',
      brief: background,
    })
    assert.equal(result.status, 200, JSON.stringify(result.data))
    assert.equal(harness.calls.prompts.length, 1)
    const sent = harness.calls.prompts[0].content[0].text
    assert.match(sent, /新要求：给现有流程增加并行分支/)
    assert.match(sent, /首问：并行分支失败时是否回滚？/)
    assert.match(sent, /用户回答：是，必须回滚/)
    assert.match(sent, /背景：并行分支失败时是否回滚？我们正在给现有流程增加并行分支。/)
    assert.deepEqual(harness.calls.presets, [{ sessionId: 'session-abc', preset: 'danger-full-access' }])

    const history = await harness.invoke('GET', '/history')
    assert.equal(history.data.items.length, 1)
    assert.equal(history.data.items[0].sessionId, 'session-abc')
    assert.equal(history.data.items[0].projectDir, workspace)
    assert.equal(history.data.items[0].title, 'Existing Project')
    assert.equal(history.data.items[0].source, 'first-question')

    // The acceptance view resolves the workspace from that record, so a
    // first-question session is discoverable after a page reload.
    const acceptance = await harness.invoke('GET', '/acceptance', undefined, '?id=session-abc')
    assert.equal(acceptance.data.workspace, workspace)
  })
})

test('session list preserves session titles from host projections and direct summaries', async () => {
  await withIsolatedEnv(async () => {
    const harness = createHarness(os.tmpdir())
    const cwd = 'D:\\new\\new2'
    harness.ctx.sessionController.list = async (_request, signal) => {
      assert.ok(signal instanceof AbortSignal)
      return { items: [
        { sessionId: 'session-one', cwd, updatedAt: 2, projections: { values: { title: ' 项目调研与优化准备 ' } }, title: 'old title', running: true },
        { sessionId: 'session-two', cwd, updatedAt: 1, projections: { values: { title: 'CC-dsh' } } },
        { sessionId: 'session-direct', cwd, title: 'Direct title' },
        { sessionId: 'session-fallback', cwd, projections: { values: { title: ' ' } }, title: 'Fallback title' },
        { sessionId: 'session-untitled', cwd, projections: { values: { title: { unexpected: true } } } },
        { sessionId: 'session-child', cwd, origin: 'subagent' },
        { sessionId: 'session-blank', cwd, blank: true },
      ] }
    }
    apply(harness.ctx, {})
    const result = await harness.invoke('GET', '/sessions')
    assert.equal(result.status, 200)
    assert.deepEqual(result.data.items.map(({ sessionId, title }) => ({ sessionId, title })), [
      { sessionId: 'session-one', title: '项目调研与优化准备' },
      { sessionId: 'session-two', title: 'CC-dsh' },
      { sessionId: 'session-direct', title: 'Direct title' },
      { sessionId: 'session-fallback', title: 'Fallback title' },
      { sessionId: 'session-untitled', title: '' },
    ])
    assert.equal(result.data.items[0].cwd, cwd)
    assert.equal(result.data.items[0].running, true)
  })
})

test('session picker API collapses ordinary fork chains and retains independent conversations', async () => {
  await withIsolatedEnv(async () => {
    const harness = createHarness(os.tmpdir())
    const cwd = 'D:\\artra'
    harness.ctx.sessionController.list = async () => ({ items: [
      { sessionId: 'session-root', cwd, updatedAt: 100, title: 'same title' },
      { sessionId: 'session-middle', parentSessionId: 'session-root', cwd, updatedAt: 2, title: 'same title' },
      { sessionId: 'session-latest', parentSessionId: 'session-middle', cwd, updatedAt: 3, projections: { values: { title: 'Latest continuation' } } },
      { sessionId: 'session-independent', cwd, updatedAt: 4, title: 'same title' },
      { sessionId: 'session-agent', parentSessionId: 'session-latest', origin: 'subagent', cwd, updatedAt: 5 },
    ] })
    apply(harness.ctx, {})
    const result = await harness.invoke('GET', '/sessions')
    assert.equal(result.status, 200)
    assert.deepEqual(result.data.items.map((item) => item.sessionId), ['session-independent', 'session-latest'])
    assert.equal(result.data.items[1].title, 'Latest continuation')
    assert.deepEqual(result.data.items[1].forkSessionIds, ['session-latest', 'session-middle', 'session-root'])
    assert.equal(harness.calls.inspections, 0, 'listing needs summary metadata only')
  })
})

test('prompt settings persist, validate, reset and reach exported templates and DSH messages', async () => {
  await withIsolatedEnv(async (root) => {
    const workspace = path.join(root, 'workspace')
    await mkdir(workspace, { recursive: true })
    const harness = createHarness(workspace)
    apply(harness.ctx, {})
    const initial = await harness.invoke('GET', '/prompts')
    assert.equal(initial.status, 200)
    const desktopDefault = initial.data.items.find((item) => item.id === 'desktop')
    const save = (id, value) => harness.invoke('POST', '/prompts', { id, value })
    assert.equal((await save('desktop', 'CUSTOM {{goal}}')).status, 200)
    const generated = await harness.invoke('POST', '/prompt', { projectName: 'Demo', goal: 'Build a timer' })
    assert.equal(generated.data.prompt, 'CUSTOM Build a timer')
    assert.equal((await save('desktop', 'lost goal')).status, 400)
    assert.equal((await save('desktop', '{{goal}} {{bad}}')).status, 400)
    assert.equal((await save('no-such-prompt', 'x')).status, 400)
    await save('handoff', 'HANDOFF {{title}} {{body}}')
    const handoff = await harness.invoke('POST', '/prompts/handoff', { title: 'Demo', body: 'Keep {{answer}} literally' })
    assert.equal(handoff.data.content, 'HANDOFF Demo Keep {{answer}} literally')
    await save('devdocRules', 'CUSTOM DOCUMENT RULES')
    const exported = await harness.invoke('GET', '/devdoc/template', undefined, '?projectDir=' + encodeURIComponent(workspace))
    assert.match(exported.data.content, /CUSTOM DOCUMENT RULES/)
    await save('firstQuestionSend', 'CONTINUE {{requirement}} Q={{question}} A={{answer}}')
    const sent = await harness.invoke('POST', '/session/first-question/send', { sessionId: 'session-demo', projectDir: workspace, requirement: 'Need export', question: 'Format?', answer: 'CSV' })
    assert.equal(sent.status, 200)
    assert.equal(harness.calls.prompts[0].content[0].text, 'CONTINUE Need export Q=Format? A=CSV')
    const restarted = createHarness(workspace)
    apply(restarted.ctx, {})
    assert.equal((await restarted.invoke('POST', '/prompt', { goal: 'After restart' })).data.prompt, 'CUSTOM After restart')
    assert.equal((await restarted.invoke('POST', '/prompts', { id: 'desktop', reset: true })).status, 200)
    assert.equal((await restarted.invoke('GET', '/prompts')).data.items.find((item) => item.id === 'desktop').value, desktopDefault.defaultValue)
    assert.equal((await restarted.invoke('GET', '/prompts')).data.items.find((item) => item.id === 'handoff').customized, true)
  })
})

test('saved opening and refine prompts are sent to Claude and the saved handoff wraps the result', async (t) => {
  const runs = []
  t.mock.method(childProcess, 'spawn', (_file, args) => {
    const child = new EventEmitter()
    child.stdin = new PassThrough()
    child.stdout = new PassThrough()
    child.stderr = new PassThrough()
    child.kill = () => true
    let input = ''
    child.stdin.on('data', (chunk) => { input += chunk.toString() })
    child.stdin.on('finish', () => {
      runs.push({ input, args })
      const schema = JSON.parse(args[args.indexOf('--json-schema') + 1])
      const data = schema.properties.dshPrompt
        ? { projectTitle: 'Demo', summary: 'Ready', plan: [], acceptance: [], risks: [], dshPrompt: 'BUILD BODY' }
        : { projectTitle: 'Demo', understanding: 'Goal', firstQuestion: 'Question?', questionOptions: ['A'], planOutline: ['Step'], handoffDraft: 'Draft' }
      child.stdout.end(JSON.stringify({ structured_output: data, session_id: 'mock-claude', total_cost_usd: 0 }))
      child.emit('close', 0)
    })
    return child
  })
  syncBuiltinESMExports()
  try {
    await withIsolatedEnv(async (root) => {
      const workspace = path.join(root, 'workspace')
      const executable = path.join(root, 'claude.exe')
      await mkdir(workspace, { recursive: true })
      await writeFile(executable, '')
      const harness = createHarness(workspace)
      apply(harness.ctx, { claudeCliPath: executable })
      const save = async (id, value) => assert.equal((await harness.invoke('POST', '/prompts', { id, value })).status, 200)
      await save('commanderSystem', 'CUSTOM PLANNING ROLE')
      await save('brief', 'OPEN {{goal}}')
      await save('refine', 'REFINE {{goal}} ANSWER {{answer}}')
      await save('handoff', 'CUSTOM HANDOFF {{title}} {{body}}')
      async function run(kind, body) {
        const started = await harness.invoke('POST', '/jobs', { kind, projectDir: workspace, goal: 'Build a timer', ...body })
        const job = await waitFor(async () => {
          const response = await harness.invoke('GET', '/jobs', undefined, '?id=' + started.data.job.id)
          return response.data.job.state !== 'running' ? response.data.job : null
        })
        assert.equal(job.state, 'done', job.error)
        return job.result
      }
      const brief = await run('brief')
      const refined = await run('refine', { brief, answer: 'Offline' })
      assert.equal(runs.length, 2)
      assert.equal(runs[0].input, 'OPEN Build a timer')
      assert.equal(runs[1].input, 'REFINE Build a timer ANSWER Offline')
      assert.equal(runs[0].args[runs[0].args.indexOf('--append-system-prompt') + 1], 'CUSTOM PLANNING ROLE')
      assert.equal(refined.handoffPrompt, 'CUSTOM HANDOFF Demo BUILD BODY')
    })
  } finally { t.mock.restoreAll(); syncBuiltinESMExports() }
})

test('configured model is reported by /detect', async () => {
  await withIsolatedEnv(async () => {
    const harness = createHarness(os.tmpdir())
    apply(harness.ctx, { model: 'claude-sonnet-5-5' })
    const result = await harness.invoke('GET', '/detect')
    assert.equal(result.status, 200)
    assert.equal(result.data.config.model, 'claude-sonnet-5-5')
  })
})

test('a remote API endpoint is not reported as an unreachable proxy', async () => {
  await withIsolatedEnv(async (root) => {
    const claudeDir = path.join(root, 'home', '.claude')
    await mkdir(claudeDir, { recursive: true })
    await writeFile(
      path.join(claudeDir, 'settings.json'),
      JSON.stringify({ env: { ANTHROPIC_BASE_URL: 'https://api.anthropic.com' } }),
      'utf8',
    )
    const harness = createHarness(os.tmpdir())
    apply(harness.ctx, {})
    const result = await harness.invoke('GET', '/detect')
    assert.equal(result.status, 200)
    assert.equal(result.data.proxy.applicable, false)
    assert.equal(result.data.proxy.reason, 'remote')
    assert.equal(result.data.proxy.reachable, false)
  })
})
