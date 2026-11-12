import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { attachReviewPrompt } from '../../lib/acceptance/review.js'

const sessionId = 'session-review-newapi'

const events = () => [
  { type: 'user/message', seq: 1, time: 1, data: { content: [{ type: 'text', text: '做一个页面' }], source: { kind: 'user' }, role: 'user', id: 'u1' } },
  { type: 'assistant/message', seq: 2, time: 2, data: { content: [{ type: 'text', text: '完成' }], message: { id: 'm1', content: [] } } },
]

/** A Host built by newer DSH: `sessionController.inspect` does not exist. */
function harness({ cwd, listEvents = events() }) {
  const handlers = new Map()
  const prompts = []
  const ctx = {
    on(event, handler) { handlers.set(event, handler); return () => handlers.delete(event) },
    effect(callback) { const dispose = callback(); return typeof dispose === 'function' ? dispose : () => {} },
    agents: { get: () => ({ id: sessionId }) },
    sessions: {
      get: (id) => id === sessionId
        ? { header: { id, cwd, createdAt: 1, isSeeded: false }, snapshotEvents: () => listEvents }
        : undefined,
    },
    permissionPresets: { set() {} },
    userQuestions: { async ask() { throw new Error('claude mode must not ask') } },
    sessionController: {
      async prompt(request) { prompts.push(request); return { accepted: true } },
      async resolveAgent() {},
      async list() { return { items: [{ sessionId, cwd, updatedAt: 1 }] } },
      async events() { return { cursor: 0, hasMore: false, records: listEvents.map((e) => ({ type: 'event', event: e })) } },
    },
  }
  const service = attachReviewPrompt({
    ctx,
    getSettings: () => ({ autoPrompt: true, defaultAction: 'claude' }),
    isOverBudget: async () => false,
    runReview: async ({ events: seen, workspace }) => {
      assert.equal(workspace, cwd)
      assert.ok(Array.isArray(seen) && seen.length > 0, 'review must receive the session events')
      return { verdict: 'pass', opinion: '测试通过，改动与目标一致。', evidence: ['npm test -> 0'] }
    },
    logger: () => {},
  })
  return { service, handlers, prompts }
}

async function idle(h) {
  h.handlers.get('agent/status')({ agent: { id: sessionId }, status: 'running' })
  h.handlers.get('agent/status')({ agent: { id: sessionId }, status: 'idle' })
  await new Promise((resolve) => setTimeout(resolve, 600))
}

test('automatic review works when the Host only exposes the newer session API', async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cod-review-newapi-'))
  try {
    const h = harness({ cwd })
    h.service.arm(sessionId)
    await idle(h)
    assert.equal(h.prompts.length, 1, 'exactly one prompt is queued back to the session')
    const text = h.prompts[0].content[0].text
    assert.match(text, /^\[Claude 验收意见\] pass/)
    assert.doesNotMatch(text, /验收失败/)
    assert.doesNotMatch(text, /is not a function/)
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true })
  }
})

test('a removed project directory sends nothing instead of blaming the session API', async () => {
  const cwd = path.join(os.tmpdir(), `cod-review-missing-${Date.now()}`)
  const h = harness({ cwd })
  h.service.arm(sessionId)
  await idle(h)
  assert.equal(h.prompts.length, 0)
})
