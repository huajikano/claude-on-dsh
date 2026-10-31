import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { attachReviewPrompt } from '../../lib/acceptance/review.js'

function harness({ settings, answers, review }) {
  const handlers = new Map()
  const prompts = []
  const asks = []
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'cod-review-'))
  const ctx = {
    on(event, handler) {
      handlers.set(event, handler)
      return () => handlers.delete(event)
    },
    effect(callback) {
      const dispose = callback()
      return typeof dispose === 'function' ? dispose : () => {}
    },
    agents: { get: () => ({ id: 'session-review-test' }) },
    sessions: { get: () => ({ id: 'session-review-test' }) },
    permissionPresets: { set() {} },
    userQuestions: {
      async ask(request) {
        asks.push(request)
        return answers.shift() || { answers: [{ id: 'review-choice', selected: ['跳过'] }] }
      },
    },
    sessionController: {
      async inspect() {
        return { meta: { cwd: workspace }, events: [] }
      },
      async resolveAgent() {},
      async prompt(request) {
        prompts.push(request)
        return { accepted: true }
      },
    },
  }
  let current = settings
  const service = attachReviewPrompt({
    ctx,
    getSettings: () => current,
    runReview: async () => review,
    logger: () => {},
  })
  return { service, handlers, prompts, asks, setSettings: (value) => (current = value) }
}

async function idle(harness) {
  harness.handlers.get('agent/status')({ agent: { id: 'session-review-test' }, status: 'running' })
  harness.handlers.get('agent/status')({ agent: { id: 'session-review-test' }, status: 'idle' })
  await new Promise((resolve) => setTimeout(resolve, 450))
}

test('default none asks in the session and sends the Claude opinion', async () => {
  const h = harness({
    settings: { autoPrompt: true, defaultAction: 'none' },
    answers: [{ answers: [{ id: 'review-choice', selected: ['Claude 验收意见'] }] }],
    review: { verdict: 'pass', opinion: '项目已通过测试。', evidence: ['npm test -> 0'] },
  })
  h.service.arm('session-review-test')
  await idle(h)
  assert.equal(h.asks.length, 1)
  assert.equal(h.asks[0].questions[0].options.length, 3)
  assert.equal(h.prompts.length, 1)
  assert.match(h.prompts[0].content[0].text, /\[Claude 验收意见\] pass/)
  assert.match(h.prompts[0].content[0].text, /项目已通过测试/)
})

test('default none skips without calling Claude', async () => {
  const h = harness({
    settings: { autoPrompt: true, defaultAction: 'none' },
    answers: [{ answers: [{ id: 'review-choice', selected: ['跳过'] }] }],
    review: { verdict: 'pass', opinion: 'should not run', evidence: [] },
  })
  h.service.arm('session-review-test')
  await idle(h)
  assert.equal(h.asks.length, 1)
  assert.equal(h.prompts.length, 0)
})

test('default claude runs without asking', async () => {
  const h = harness({
    settings: { autoPrompt: true, defaultAction: 'claude' },
    answers: [],
    review: { verdict: 'uncertain', opinion: '未覆盖真机。', evidence: ['浏览器模拟'] },
  })
  h.service.arm('session-review-test')
  await idle(h)
  assert.equal(h.asks.length, 0)
  assert.equal(h.prompts.length, 1)
  assert.match(h.prompts[0].content[0].text, /uncertain/)
})

test('autoPrompt off does nothing', async () => {
  const h = harness({
    settings: { autoPrompt: false, defaultAction: 'claude' },
    answers: [],
    review: { verdict: 'pass', opinion: 'should not run', evidence: [] },
  })
  h.service.arm('session-review-test')
  await idle(h)
  assert.equal(h.asks.length, 0)
  assert.equal(h.prompts.length, 0)
})
