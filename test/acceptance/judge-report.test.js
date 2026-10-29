import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { runCheckers } from '../../lib/acceptance/checkers.js'
import { judgeAcceptance, validateJudgeOutput } from '../../lib/acceptance/judge.js'
import { renderMarkdown, writeReports } from '../../lib/acceptance/report.js'
import { sampleFacts, sampleReport, workspace } from './fixtures.js'

function validJudge(checks, evidence) {
  return {
    overall: 'pass',
    summary: '证据充分',
    checks: checks.map((check, index) => ({
      id: check.id,
      conclusion: 'pass',
      evidenceIds: [evidence[Math.min(index, evidence.length - 1)].id],
      note: 'ok',
    })),
    rework: [],
    missing: [],
  }
}

test('judge validator rejects pass without evidence and unknown ids', () => {
  const facts = sampleFacts()
  const { checks, evidence } = runCheckers(facts, { allowedPaths: [] })
  const bad = validJudge(checks, evidence)
  bad.checks[0].evidenceIds = []
  assert.match(validateJudgeOutput(bad, checks, evidence).join('; '), /without evidence/)
  const unknown = validJudge(checks, evidence)
  unknown.checks[1].evidenceIds = ['nope']
  assert.match(validateJudgeOutput(unknown, checks, evidence).join('; '), /unknown evidence/)
})

test('judge completes on a valid verdict', async () => {
  const facts = sampleFacts()
  const { checks, evidence } = runCheckers(facts, { allowedPaths: [] })
  const result = await judgeAcceptance({
    facts,
    checks,
    evidence,
    runJudge: async () => ({ data: validJudge(checks, evidence), meta: { models: ['test'] } }),
    options: { judgeRetries: 1 },
  })
  assert.equal(result.status, 'completed')
  assert.equal(result.attempts, 1)
})

test('judge retries invalid output then degrades to uncertain', async () => {
  const facts = sampleFacts()
  const { checks, evidence } = runCheckers(facts, { allowedPaths: [] })
  let calls = 0
  const result = await judgeAcceptance({
    facts,
    checks,
    evidence,
    runJudge: async () => {
      calls += 1
      const bad = validJudge(checks, evidence)
      bad.checks[0].evidenceIds = []
      return { data: bad }
    },
    options: { judgeRetries: 1 },
  })
  assert.equal(calls, 2)
  assert.equal(result.status, 'degraded')
  assert.equal(result.data.overall, 'uncertain')
  assert.equal(result.data.checks.find((check) => check.id === 'goal-response').conclusion, 'uncertain')
})

test('judge maps its own timeout to status timeout', async () => {
  const facts = sampleFacts()
  const { checks, evidence } = runCheckers(facts, { allowedPaths: [] })
  const result = await judgeAcceptance({
    facts,
    checks,
    evidence,
    runJudge: async () => {
      throw Object.assign(new Error('judge timeout'), { code: 'JUDGE_TIMEOUT' })
    },
    options: { judgeRetries: 0 },
  })
  assert.equal(result.status, 'timeout')
})

test('markdown exposes verdict and locatable evidence', () => {
  const markdown = renderMarkdown(sampleReport())
  assert.match(markdown, /\*\*PASS\*\*/)
  assert.match(markdown, /ev-1/)
  assert.match(markdown, /user\/message#1/)
})

test('writeReports writes json and md inside the workspace and rejects escapes', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'cod-acceptance-'))
  try {
    const report = sampleReport()
    const paths = await writeReports(dir, report, { reportDir: '.dsh/acceptance' })
    const json = JSON.parse(await readFile(paths.jsonPath, 'utf8'))
    assert.equal(json.sessionId, 'session-test')
    assert.match(await readFile(paths.mdPath, 'utf8'), /验收报告/)
    await assert.rejects(() => writeReports(dir, report, { reportDir: '..\\outside' }), /escapes the workspace/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('fixture workspace is absolute', () => {
  assert.match(workspace, /^[A-Za-z]:\\/)
})
