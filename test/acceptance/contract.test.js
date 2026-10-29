import assert from 'node:assert/strict'
import test from 'node:test'
import { redact, validateReport } from '../../lib/acceptance/contract.js'
import { sampleReport } from './fixtures.js'

test('accepts a complete report with evidence', () => {
  assert.deepEqual(validateReport(sampleReport()), { ok: true, errors: [] })
})

test('rejects pass/fail checks without evidence', () => {
  const report = sampleReport()
  report.checks[0].evidence = []
  const result = validateReport(report)
  assert.equal(result.ok, false)
  assert.match(result.errors.join('; '), /without evidence/)
})

test('rejects overall pass when a check failed', () => {
  const report = sampleReport()
  report.checks.push({
    id: 'verification',
    name: 'verification',
    conclusion: 'fail',
    evidence: [{ id: 'ev-2', type: 'command', command: 'node --test', locator: 'tool/call#2', excerpt: 'FAIL' }],
    note: 'failed',
  })
  const result = validateReport(report)
  assert.equal(result.ok, false)
  assert.match(result.errors.join('; '), /overall fail requires|overall pass contradicts/)
})

test('allows the same evidence object across checks but rejects conflicting reuse', () => {
  const report = sampleReport()
  report.checks.push({
    id: 'verification',
    name: 'verification',
    conclusion: 'pass',
    evidence: [{ ...report.checks[0].evidence[0] }],
    note: 'same item',
  })
  assert.equal(validateReport(report).ok, true)
  const conflicting = sampleReport()
  conflicting.checks.push({
    id: 'scope',
    name: 'scope',
    conclusion: 'pass',
    evidence: [{ ...conflicting.checks[0].evidence[0], excerpt: 'different' }],
    note: 'conflict',
  })
  const result = validateReport(conflicting)
  assert.equal(result.ok, false)
  assert.match(result.errors.join('; '), /conflicting evidence id/)
})

test('rejects an overall pass with zero evidence', () => {
  const report = sampleReport()
  report.checks[0].conclusion = 'uncertain'
  report.checks[0].evidence = []
  const result = validateReport(report)
  assert.equal(result.ok, false)
  assert.match(result.errors.join('; '), /overall pass requires evidence/)
})

test('redacts token-shaped strings', () => {
  const redacted = redact('token ghp_abcdefghijklmnopqrstuvwxyz0123456789 and Bearer abc.def')
  assert.doesNotMatch(redacted, /ghp_/)
  assert.match(redacted, /\[REDACTED\]/)
})
