import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { apply } from '../../index.js'
import childProcess from 'node:child_process'
import { syncBuiltinESMExports } from 'node:module'
import { EventEmitter, once } from 'node:events'
import { createInterface } from 'node:readline'
import { PassThrough } from 'node:stream'
import { DesktopSupervisionBridge, DESKTOP_MCP_NAME } from '../../lib/desktop-supervision-bridge.js'

async function setup(t, { desktop = false, saved = {}, native = null, engine = 'sdk' } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cod-monitor-routes-'))
  const envKeys = ['DSH_HOME', 'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'PATH']
  const previous = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]))
  process.env.DSH_HOME = root
  for (const key of envKeys.filter((key) => key !== 'DSH_HOME')) {
    process.env[key] = path.join(root, key.toLowerCase())
    await mkdir(process.env[key], { recursive: true })
  }
  const workspace = path.join(root, 'project'), sdk = path.join(root, 'sdk')
  await mkdir(workspace); await mkdir(sdk); await mkdir(path.join(root, 'claude-on-dsh'))
  await writeFile(path.join(root, 'claude-on-dsh', 'settings.json'), JSON.stringify(saved))
  await writeFile(path.join(sdk, 'package.json'), JSON.stringify({ type: 'module', main: 'sdk.mjs' }))
  await writeFile(path.join(sdk, 'sdk.mjs'), `export async function* query({ options }) {
    yield { type: 'result', subtype: 'success', structured_output: { decision: 'complete', reason: '目标文件已完成', message: '', evidence: ['project/result.txt:1'], goalSatisfied: true }, session_id: 'supervisor-only-query', total_cost_usd: 0 };
  }`)
  const routes = new Map(), listeners = new Map(), disposers = []
  const sent = [], permissions = [], completedGoals = []
  let goal = native
  const agent = { id: 'session-main', status: 'idle' }
  const events = [
    { type: 'user/message', seq: 1, data: { source: { kind: 'user' }, content: [{ type: 'text', text: '完成目标文件' }] } },
    { type: 'tool/result', seq: 2, data: { message: { content: [{ type: 'text', text: 'result.txt complete' }] } } },
    { type: 'assistant/message', seq: 3, data: { content: [{ type: 'text', text: '项目已完成' }] } },
    { type: 'turn/end', seq: 4, data: { turn: 1, reason: { kind: 'completed' } } },
  ]
  const ctx = {
    logger: { info() {}, warn() {} },
    on(event, fn, options) {
      if (!listeners.has(event)) listeners.set(event, [])
      const item = { fn, options }; listeners.get(event).push(item)
      return () => { const rows = listeners.get(event); const index = rows.indexOf(item); if (index >= 0) rows.splice(index, 1) }
    },
    effect(fn) { const dispose = fn(); if (typeof dispose === 'function') disposers.push(dispose); return dispose },
    get(name) { return name === 'goals' && native ? {
      get: () => ({ ...goal }),
      complete: (_agent, ref) => { completedGoals.push(ref); goal = { ...goal, phase: 'complete', revision: goal.revision + 1 } },
    } : undefined },
    connection: { fetch: { register(route) { for (const method of route.methods) routes.set(`${method} ${route.path}`, route.fetch); return () => {} } } },
    sessions: { get: () => ({ id: agent.id, header: { cwd: workspace, origin: undefined } }) },
    agents: { get: () => agent },
    permissionPresets: { set: (_session, mode) => permissions.push(mode), current: () => 'workspace-write' },
    approval: { setPolicy: () => permissions.push('approval') },
    userQuestions: { ask: async () => { throw new Error('unexpected question') } },
    workspaceRegistry: {},
    sessionController: {
      inspect: async () => ({ meta: { id: agent.id, cwd: workspace }, events }),
      prompt: async (request) => { sent.push(request); return { accepted: true } },
    },
  }
  const cli = path.join(root, 'claude.exe'); await writeFile(cli, '')
  const desktopConfigPath = path.join(root, 'desktop', 'claude_desktop_config.json')
  await mkdir(path.dirname(desktopConfigPath))
  apply(ctx, { engine, claudeCliPath: cli, sdkPath: sdk, desktopConfigPath,
    supervision: { enabled: true, engine: desktop ? 'desktop' : 'cli', cooldownMs: 0 } })
  const invoke = async (method, pathname, body) => {
    const url = new URL(pathname, 'http://localhost')
    const response = await routes.get(`${method} /api/claude-on-dsh${url.pathname}`)(new Request(url, {
      method, headers: { 'content-type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }))
    return { status: response.status, body: await response.json() }
  }
  const emitEnd = () => { for (const row of listeners.get('session/event') || []) row.fn({ id: agent.id, header: { cwd: workspace } }, events.at(-1)) }
  t.after(async () => {
    await invoke('POST', '/settings', { supervision: { enabled: false } })
    for (const dispose of disposers.reverse()) dispose()
    await new Promise((resolve) => setTimeout(resolve, 40))
    for (const key of envKeys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key] }
    await rm(root, { recursive: true, force: true })
  })
  return { invoke, emitEnd, sent, permissions, listeners, completedGoals, root }
}
async function waitFor(fn) {
  const start = Date.now()
  while (Date.now() - start < 5000) { const result = await fn(); if (result) return result; await new Promise((resolve) => setTimeout(resolve, 25)) }
  throw new Error('monitor did not settle')
}

test('routes migrate historical acceptance settings without losing the budget', async (t) => {
  const h = await setup(t, { saved: { autoAcceptance: true, autoPrompt: true, manualAcceptance: true, dailyBudgetUsd: 6 } })
  const settings = (await h.invoke('GET', '/settings')).body
  assert.equal(settings.autoAcceptance, false); assert.equal(settings.autoPrompt, false); assert.equal(settings.manualAcceptance, false)
  assert.equal(settings.dailyBudgetUsd, 6); assert.equal(settings.supervision.enabled, true)
  const changed = await h.invoke('POST', '/settings', { manualAcceptance: true, supervision: { enabled: false, engine: 'desktop' } })
  assert.equal(changed.status, 200); assert.equal(changed.body.supervision.engine, 'desktop')
  const disk = JSON.parse(await readFile(path.join(h.root, 'claude-on-dsh', 'settings.json'), 'utf8'))
  assert.equal(disk.workflowVersion, 2); assert.equal(disk.supervision.enabled, false); assert.equal(disk.manualAcceptance, true)
})
test('passive global event reaches the SDK and emits one completion notice without permission changes', async (t) => {
  const h = await setup(t)
  for (const event of ['agent/status', 'agent/disposed', 'session/event']) assert.ok(h.listeners.get(event).some((row) => row.options?.global === true))
  h.emitEnd()
  await waitFor(async () => (await h.invoke('GET', '/supervision')).body.items.some((row) => row.phase === 'complete'))
  assert.equal(h.sent.length, 1); assert.match(h.sent[0].content[0].text, /验收合格/)
  assert.equal(h.permissions.length, 0)
  h.emitEnd(); await new Promise((resolve) => setTimeout(resolve, 600)); assert.equal(h.sent.length, 1)
})
test('a completed native goal is settled before its final completion notice', async (t) => {
  const h = await setup(t, { native: { id: 'goal-1', revision: 3, phase: 'paused', objective: '完成目标文件' } })
  h.emitEnd()
  await waitFor(async () => (await h.invoke('GET', '/supervision')).body.items.some((row) => row.phase === 'complete'))
  assert.deepEqual(h.completedGoals, [{ id: 'goal-1', revision: 3 }]); assert.equal(h.sent.length, 1)
})
test('desktop route binds the request and accepts exactly one current JSON decision', async (t) => {
  const h = await setup(t, { desktop: true })
  h.emitEnd()
  const row = await waitFor(async () => (await h.invoke('GET', '/supervision')).body.items.find((item) => item.phase === 'awaiting-desktop'))
  assert.equal(h.sent.length, 0)
  assert.equal((await h.invoke('POST', '/supervision/desktop', { action: 'submit', sessionId: row.sessionId, requestId: 'old', decision: {} })).status, 409)
  const result = await h.invoke('POST', '/supervision/desktop', { action: 'submit', sessionId: row.sessionId, requestId: row.pending.id,
    decision: JSON.stringify({ decision: 'complete', reason: '文件已就绪', message: '', evidence: ['result.txt:1'], goalSatisfied: true }) })
  assert.equal(result.status, 200); assert.equal(h.sent.length, 1)
  assert.equal((await h.invoke('POST', '/supervision/desktop', { action: 'submit', sessionId: row.sessionId, requestId: row.pending.id, decision: {} })).status, 409)
})

test('direct CLI monitoring passes a strict read-only tool list and preserves its step label', async (t) => {
  const invocations = []
  t.mock.method(childProcess, 'spawn', (_file, args) => {
    invocations.push(args)
    const child = new EventEmitter(); child.stdin = new PassThrough(); child.stdout = new PassThrough(); child.stderr = new PassThrough(); child.kill = () => true
    child.stdin.on('finish', () => {
      child.stdout.end(JSON.stringify({ structured_output: { decision: 'wait', reason: '需要项目证据', message: '', evidence: [], goalSatisfied: false }, session_id: 'monitor-cli', total_cost_usd: 0 }))
      child.emit('close', 0)
    })
    return child
  })
  syncBuiltinESMExports(); t.after(() => { t.mock.restoreAll(); syncBuiltinESMExports() })
  const h = await setup(t, { engine: 'cli' }); h.emitEnd()
  await waitFor(async () => (await h.invoke('GET', '/supervision')).body.items.some((row) => row.decision?.decision === 'wait'))
  const args = invocations.find((row) => row.includes('--json-schema'))
  assert.ok(args); assert.equal(args[args.indexOf('--tools') + 1], 'Read,Glob,Grep'); assert.ok(args.includes('--strict-mcp-config'))
  assert.equal(args.includes('--resume'), false); assert.equal(h.sent.length, 0)
})

test('Desktop MCP initializes over stdio and returns one decision to the Host', { timeout: 25_000 }, async (t) => {
  const h = await setup(t, { desktop: true })
  const diagnostic = await h.invoke('GET', '/supervision/desktop/status?refresh=1')
  assert.equal(diagnostic.status, 200)
  const { configPath } = diagnostic.body
  assert.equal(configPath, path.join(h.root, 'desktop', 'claude_desktop_config.json'))
  assert.equal(diagnostic.body.bridgeReady, true)
  assert.equal(diagnostic.body.connected, false)
  assert.equal(diagnostic.body.automaticConversationStart, false)
  const existing = { mcpServers: { other: { command: 'not-started' } }, preferences: { keep: true } }
  await writeFile(configPath, JSON.stringify(existing))
  assert.equal((await h.invoke('POST', '/supervision/desktop/status', { action: 'configure', configPath: 'changed-path' })).status, 409)
  const installed = await h.invoke('POST', '/supervision/desktop/status', { action: 'configure', configPath })
  assert.equal(installed.status, 200)
  assert.equal(installed.body.mcpConfigured, true)
  assert.equal(installed.body.connected, false)
  assert.deepEqual(JSON.parse(await readFile(installed.body.backupPath, 'utf8')), existing)
  const config = JSON.parse(await readFile(configPath, 'utf8'))
  assert.deepEqual(config.preferences, existing.preferences)
  assert.deepEqual(config.mcpServers.other, existing.mcpServers.other)

  const bridge = new DesktopSupervisionBridge({ home: h.root })
  h.emitEnd()
  const ids = await waitFor(() => bridge.tasks()[0])
  const pending = (await h.invoke('GET', '/supervision')).body.stats
  assert.equal(pending.executions, 0)
  assert.equal(pending.pendingDesktop, 1)
  const entry = config.mcpServers[DESKTOP_MCP_NAME]
  const child = childProcess.spawn(entry.command, entry.args, { env: { ...process.env, ...entry.env }, windowsHide: true })
  const closed = once(child, 'close')
  closed.catch(() => {})
  const lines = createInterface({ input: child.stdout, crlfDelay: Infinity })
  const messages = lines[Symbol.asyncIterator]()
  let id = 0, stderr = ''
  child.stderr.setEncoding('utf8').on('data', (data) => { stderr += data })
  const write = (method, params, requestId) => child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method, params, id: requestId })}\n`)
  async function request(method, params) {
    const requestId = ++id
    write(method, params, requestId)
    const { value, done } = await messages.next()
    assert.equal(done, false, stderr)
    const response = JSON.parse(value)
    assert.equal(response.id, requestId)
    return response
  }
  async function tool(name, args) {
    const { result, error } = await request('tools/call', { name, arguments: args })
    assert.ok(result && !result.isError, error?.message || result?.content?.[0].text)
    return JSON.parse(result.content[0].text)
  }
  const deadline = setTimeout(() => child.kill(), 15_000)
  try {
    write('notifications/initialized')
    assert.equal((await request('tools/list')).error.code, -32002)
    const init = await request('initialize', { protocolVersion: '2025-06-18', clientInfo: { name: 'MCP integration test', version: '1' }, capabilities: {} })
    assert.equal(init.result.protocolVersion, '2025-06-18')
    assert.equal(bridge.connection().connected, false)
    write('notifications/initialized')
    assert.equal((await request('tools/list')).result.tools.length, 4)
    const status = (await h.invoke('GET', '/supervision/desktop/status')).body
    assert.equal(status.state, 'connected')
    assert.equal(status.clientInfo.name, 'MCP integration test')
    assert.deepEqual((await tool('list_pending_reviews', {})).tasks.map((item) => item.requestId), [ids.requestId])
    assert.match((await tool('get_review_task', ids)).prompt, /完成目标文件/)
    const decision = { decision: 'complete', reason: '本轮证据已满足目标', message: '', evidence: ['result.txt:1'], goalSatisfied: true }
    assert.equal((await tool('submit_review_decision', { ...ids, decision })).status, 'queued')
    await waitFor(() => bridge.receipt(ids.requestId).status === 'processed')
    assert.equal((await tool('get_review_status', { requestId: ids.requestId })).phase, 'complete')
    assert.equal((await tool('submit_review_decision', { ...ids, decision })).status, 'processed')
    assert.equal(h.sent.length, 1)
    assert.match(h.sent[0].content[0].text, /验收合格/)
    const final = (await h.invoke('GET', '/supervision')).body
    assert.equal(final.stats.executions, 1)
    assert.equal(final.stats.decisions, 1)
    assert.equal(final.stats.completed, 1)
    assert.equal(final.stats.pendingDesktop, 0)
    assert.equal(final.items[0].stats.completed, 1)
    const history = await h.invoke('GET', `/supervision/history?sessionId=${ids.sessionId}&status=complete&limit=1`)
    assert.equal(history.body.total, 1)
    assert.equal(history.body.items[0].reason, decision.reason)
  } finally {
    child.stdin.end()
    try { await closed } finally { clearTimeout(deadline); lines.close() }
  }
  assert.equal((await h.invoke('GET', '/supervision/desktop/status')).body.connected, false)
})
