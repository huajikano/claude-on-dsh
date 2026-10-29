import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { apply } from '../../index.js'

// Keep test dispatches out of the real profile history.
process.env.DSH_HOME = path.join(os.tmpdir(), 'claude-on-dsh-regression-home')

function createFakeContext() {
  const routes = new Map()
  const calls = { create: [], prompt: [], preset: [], approval: [] }
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
      async create(request) {
        assert.deepEqual(Object.keys(request), ['workspaceId'])
        assert.equal(request.workspaceId, 'ws-1')
        calls.create.push(request)
        return { sessionId: 'session-test', agentPreset: 'standard' }
      },
      async resolveAgent() {
        return { agent: { id: 'session-test' } }
      },
      async prompt(request, signal) {
        calls.prompt.push({ request, signal })
        return { accepted: true }
      },
      async inspect() {
        return { meta: { cwd: process.cwd() }, events: [] }
      },
    },
    sessions: {
      get() {
        return { id: 'session-test', header: { cwd: process.cwd() } }
      },
    },
    permissionPresets: {
      set(session, preset) {
        calls.preset.push({ sessionId: session.id, preset })
      },
      current() {
        return 'danger-full-access'
      },
    },
    approval: {
      setPolicy() {
        calls.approval.push('never')
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
  return { ctx, routes, calls }
}

test('regression: dispatch sends workspaceId only, a prompt signal, and full access', async () => {
  const { ctx, routes, calls } = createFakeContext()
  apply(ctx, { acceptance: { gatePolicy: 'off' } })
  const handler = routes.get('POST /api/claude-on-dsh/dispatch')
  assert.ok(handler)
  const response = await handler(
    new Request('http://127.0.0.1:65136/api/claude-on-dsh/dispatch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        projectDir: process.cwd(),
        title: 'Regression',
        brief: '请只回复 OK，不要调用工具。',
        engine: 'cli',
      }),
    }),
  )
  const body = await response.json()
  assert.equal(response.status, 200, JSON.stringify(body))
  assert.deepEqual(calls.create, [{ workspaceId: 'ws-1' }])
  assert.equal(calls.prompt.length, 1)
  assert.equal(calls.prompt[0].request.content[0].text, '请只回复 OK，不要调用工具。')
  assert.ok(calls.prompt[0].signal instanceof AbortSignal)
  assert.deepEqual(calls.preset, [{ sessionId: 'session-test', preset: 'danger-full-access' }])
  assert.equal(body.permission, 'danger-full-access')
  assert.equal(body.sessionId, 'session-test')
})
