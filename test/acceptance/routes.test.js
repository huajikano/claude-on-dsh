import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
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

test('configured model is reported by /detect', async () => {
  await withIsolatedEnv(async () => {
    const harness = createHarness(os.tmpdir())
    apply(harness.ctx, { model: 'claude-sonnet-5-5' })
    const result = await harness.invoke('GET', '/detect')
    assert.equal(result.status, 200)
    assert.equal(result.data.config.model, 'claude-sonnet-5-5')
    assert.equal(result.data.config.legacyGate, false)
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
