import assert from 'node:assert/strict'
import test from 'node:test'
import { createSupervisionHistory } from '../../lib/supervision-history.js'

const decision = (kind = 'wait') => ({
  decision: kind,
  reason: '有可定位的项目证据',
  message: kind === 'continue' ? '继续处理遗漏项' : '',
  evidence: ['src/app.js:1'],
  goalSatisfied: kind === 'complete',
})

const review = (history, sessionId, engine = 'cli') => history.begin({
  sessionId,
  objective: '完成项目目标',
  workspace: 'D:/project',
  turnKey: `${sessionId}:turn-1`,
  engine,
  trigger: 'test',
})

test('desktop pending is not counted as an execution', () => {
  const history = createSupervisionHistory({ now: () => 100 })
  const id = review(history, 'desktop-session', 'desktop')
  history.pending(id)
  assert.equal(history.totals().executions, 0)
  assert.equal(history.totals().decisions, 0)
  assert.equal(history.totals().pendingDesktop, 1)
})

test('one valid desktop decision increments execution and decision once', () => {
  const history = createSupervisionHistory({ now: () => 100 })
  const id = review(history, 'desktop-session', 'desktop')
  history.pending(id)
  assert.equal(history.finish(id, 'complete', { decision: decision('complete') }), true)
  assert.equal(history.finish(id, 'complete', { decision: decision('complete') }), false)
  const totals = history.totals()
  assert.equal(totals.executions, 1)
  assert.equal(totals.decisions, 1)
  assert.equal(totals.completed, 1)
})

test('lifetime totals survive bounded detail trimming', () => {
  const history = createSupervisionHistory({ now: () => 100, keep: 1 })
  const first = review(history, 'session-a')
  history.startExecution(first)
  history.finish(first, 'wait', { decision: decision() })
  const second = review(history, 'session-b')
  history.startExecution(second)
  history.finish(second, 'failed', { decision: decision() })
  const totals = history.totals()
  assert.equal(totals.executions, 2)
  assert.equal(totals.decisions, 2)
  assert.equal(totals.waited, 1)
  assert.equal(totals.failed, 1)
  assert.equal(totals.retainedRecords, 1)
  assert.equal(history.page({}).total, 1)
})

test('legacy checks become a separate total without fabricated review detail', () => {
  const history = createSupervisionHistory({
    now: () => 100,
    sessions: [{ sessionId: 'legacy-session', checks: 4, executions: 0 }],
  })
  const totals = history.totals()
  assert.equal(totals.legacyChecks, 4)
  assert.equal(totals.executions, 0)
  assert.equal(history.page({}).total, 0)
  assert.equal(history.forSession('legacy-session').legacyChecks, 4)
})
