import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../../index.js'

/**
 * Drive the real /presets and /dispatch routes with an isolated Host. The
 * registry is injected through `ctx.get('agentPresets')`, exactly as DSH
 * exposes it, and `create` records what the Controller was asked for.
 */
async function harness({ presets } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'claude-preset-'))
  const project = path.join(root, 'demo')
  const { mkdir } = await import('node:fs/promises')
  await mkdir(project, { recursive: true })
  const previousHome = process.env.DSH_HOME
  process.env.DSH_HOME = path.join(root, 'home')
  const routes = new Map()
  const created = []
  const prompts = []
  const ctx = {
    get: (name) => (name === 'agentPresets' && presets !== undefined
      ? { list: async () => presets }
      : undefined),
    effect(callback) { const dispose = callback(); return typeof dispose === 'function' ? dispose : () => {} },
    on() { return () => {} },
    logger: { info() {}, warn() {}, error() {} },
    connection: { fetch: { register(route) { for (const method of route.methods) routes.set(`${method} ${route.path}`, route.fetch); return () => {} } } },
    workspaceRegistry: { async create() { return { id: 'workspace-demo', title: 'demo' } } },
    sessionController: {
      async create(request) { created.push(request); return { sessionId: 'session-new' } },
      async inspect() { return { meta: { cwd: project }, events: [] } },
      async prompt(request) { prompts.push(request); return { accepted: true } },
      async resolveAgent() { return { agent: { id: 'session-new' } } },
      async list() { return { items: [] } },
    },
    sessions: { get() { return { id: 'session-new' } } },
    agents: { get() { return { id: 'session-new' } } },
    permissionPresets: { set() {}, current() { return 'danger-full-access' } },
    approval: { setPolicy() {} },
    userQuestions: { async ask() { throw new Error('unexpected question') } },
  }
  apply(ctx, { acceptance: { legacyGate: false, gatePolicy: 'off' } })
  const call = async (method, endpoint, body) => {
    const response = await routes.get(`${method} /api/claude-on-dsh${endpoint.split('?')[0]}`)(
      new Request(`http://127.0.0.1/api/claude-on-dsh${endpoint}`, {
        method,
        ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
      }),
    )
    return { status: response.status, body: await response.json() }
  }
  return {
    project, created, prompts, call,
    async close() {
      if (previousHome === undefined) delete process.env.DSH_HOME
      else process.env.DSH_HOME = previousHome
      await rm(root, { recursive: true, force: true })
    },
  }
}

const brief = () => ({ projectDir: null, title: 'demo', brief: '实现列表页', engine: 'cli' })

test('the preset list is exposed with the default first and broken presets hidden', async () => {
  const h = await harness({ presets: [
    { id: 'ptc', name: 'PTC', description: 'tool loop' },
    { id: 'standard', name: '标准', isDefault: true },
    { id: 'broken-one', name: 'Broken', broken: 'activation failed' },
  ] })
  try {
    const listed = await h.call('GET', '/presets')
    assert.equal(listed.status, 200)
    assert.deepEqual(listed.body.items.map((item) => item.id), ['standard', 'ptc'])
    assert.equal(listed.body.items[0].isDefault, true)
  } finally {
    await h.close()
  }
})

test('dispatching passes the chosen preset to the Session Controller', async () => {
  const h = await harness({ presets: [
    { id: 'standard', name: '标准', isDefault: true },
    { id: 'ptc', name: 'PTC' },
  ] })
  try {
    const sent = await h.call('POST', '/dispatch', { ...brief(), projectDir: h.project, agentPreset: 'ptc' })
    assert.equal(sent.status, 200)
    assert.equal(h.created.length, 1)
    assert.equal(h.created[0].workspaceId, 'workspace-demo')
    assert.equal(h.created[0].agentPreset, 'ptc')
    assert.equal(sent.body.agentPreset, 'ptc')
    assert.equal(h.prompts.length, 1)
  } finally {
    await h.close()
  }
})

test('omitting the preset keeps DSH default behaviour', async () => {
  const h = await harness({ presets: [{ id: 'standard', name: '标准', isDefault: true }] })
  try {
    const sent = await h.call('POST', '/dispatch', { ...brief(), projectDir: h.project })
    assert.equal(sent.status, 200)
    assert.equal('agentPreset' in h.created[0], false, 'no preset key is sent when none was chosen')
  } finally {
    await h.close()
  }
})

test('an unknown preset is rejected instead of silently falling back', async () => {
  const h = await harness({ presets: [{ id: 'standard', name: '标准', isDefault: true }] })
  try {
    const sent = await h.call('POST', '/dispatch', { ...brief(), projectDir: h.project, agentPreset: 'ghost' })
    assert.equal(sent.status, 400)
    assert.match(sent.body.error.message, /会话模式不存在/)
    assert.match(sent.body.error.hint, /标准/)
    assert.equal(h.created.length, 0, 'nothing is created for an invalid choice')
  } finally {
    await h.close()
  }
})

test('a host without a preset registry simply offers none', async () => {
  const h = await harness({ presets: undefined })
  try {
    const listed = await h.call('GET', '/presets')
    assert.equal(listed.status, 200)
    assert.deepEqual(listed.body.items, [])
    const sent = await h.call('POST', '/dispatch', { ...brief(), projectDir: h.project, agentPreset: 'ptc' })
    assert.equal(sent.status, 200)
    assert.equal('agentPreset' in h.created[0], false)
  } finally {
    await h.close()
  }
})
