import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { claudeTimeoutMessage, reviewBudget } from '../../index.js'

const source = readFileSync(new URL('../../index.js', import.meta.url), 'utf8')

test('acceptance keeps a twenty-minute floor instead of a five-minute cap', () => {
  // The reported failure: a review died at exactly 300 s on a slow project.
  assert.equal(reviewBudget(240_000, undefined), 1_200_000)
  assert.equal(reviewBudget(30_000, undefined), 1_200_000)
  assert.ok(reviewBudget(240_000, undefined) > 300_000)
})

test('a configured budget is respected and clamped to a usable range', () => {
  assert.equal(reviewBudget(240_000, 600_000), 600_000)
  assert.equal(reviewBudget(2_400_000, 600_000), 2_400_000, 'the row timeout still wins when larger')
  assert.equal(reviewBudget(30_000, 1_000), 120_000, 'never collapse below two minutes')
  assert.equal(reviewBudget(30_000, 99_999_999), 3_600_000, 'never exceed an hour')
})

test('the timeout message names the step and both knobs', () => {
  const review = claudeTimeoutMessage('review', 1_200_000)
  assert.match(review.message, /Claude 调用超时/)
  assert.match(review.message, /验收意见/)
  assert.match(review.hint, /20 分钟/)
  assert.match(review.hint, /timeoutMs/)
  assert.match(review.hint, /acceptance\.reviewTimeoutMs/)
  assert.match(claudeTimeoutMessage('devdoc', 600_000).message, /开发文档预审/)
  assert.match(claudeTimeoutMessage('devdoc', 600_000).hint, /10 分钟/)
})

test('no acceptance call site still uses the old five-minute cap', () => {
  assert.doesNotMatch(source, /Math\.max\(settings\.timeoutMs, 300_000\)/)
  assert.match(source, /timeoutMs: Math\.max\(settings\.timeoutMs, reviewTimeoutMs\)/)
  for (const label of ['review', 'acceptance', 'devdoc']) {
    assert.match(source, new RegExp(`label: '${label}'`))
  }
})

test('every Claude call site passes a label so a timeout is identifiable', () => {
  const labels = ['plan', 'refine', 'first-question', 'acceptance-brief', 'acceptance', 'review', 'devdoc']
  for (const label of labels) {
    // Each label must resolve to real copy, and each must be used at a call site.
    assert.match(claudeTimeoutMessage(label, 600_000).message, /Claude 调用超时（.+/)
    assert.ok(source.includes(`label: '${label}'`), `no call site labelled ${label}`)
  }
  assert.match(source, /const CLAUDE_LABELS = \{/)
})
