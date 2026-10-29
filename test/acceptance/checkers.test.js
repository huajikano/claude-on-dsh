import assert from 'node:assert/strict'
import test from 'node:test'
import { buildFacts, extractCommands, extractFileOps, extractTask } from '../../lib/acceptance/facts.js'
import { goalChecker, runCheckers, scopeChecker, verificationChecker } from '../../lib/acceptance/checkers.js'
import { createEvidenceBag } from '../../lib/acceptance/checkers.js'
import { sampleEvents, sampleFacts, workspace } from './fixtures.js'

test('extractTask ignores non-user sources and reads the first real task', () => {
  const events = [
    { type: 'user/message', seq: 1, data: { source: { kind: 'user-approval' }, content: [{ type: 'text', text: 'approval' }] } },
    ...sampleEvents(),
  ]
  const task = extractTask(events)
  assert.equal(task.sourceSeq, 1)
  assert.match(task.summary, /登录/)
})

test('extractCommands joins calls with results and classifies verification', () => {
  const commands = extractCommands(sampleEvents())
  assert.equal(commands.length, 1)
  assert.equal(commands[0].command, 'node --test')
  assert.equal(commands[0].kind, 'verification')
  assert.equal(commands[0].isError, false)
})

test('extractFileOps keeps write/edit paths', () => {
  const ops = extractFileOps(sampleEvents())
  assert.deepEqual(ops.map((op) => op.path), ['src/login.js'])
})

test('buildFacts normalizes task, commands, file ops, and missing facts', () => {
  const facts = buildFacts({ sessionId: 'session-test', meta: { cwd: workspace }, events: sampleEvents(), workspace })
  assert.equal(facts.task.sourceSeq, 1)
  assert.equal(facts.commands.length, 1)
  assert.equal(facts.changedFiles.length, 1)
  assert.equal(facts.end.status, 'completed')
  assert.ok(facts.missing.includes('git-state-unavailable'))
})

test('goal checker covers pass, fail, and uncertain', () => {
  const pass = goalChecker.run(sampleFacts(), {}, createEvidenceBag())
  assert.equal(pass.conclusion, 'pass')
  const fail = goalChecker.run(
    sampleFacts({
      task: { summary: '做一个音乐播放器', sourceSeq: 1, text: '做一个音乐播放器' },
      assistant: { text: '修复登录', sourceSeq: 6 },
      changedFiles: [{ path: 'src/login.js', status: 'M', source: 'git' }],
    }),
    {},
    createEvidenceBag(),
  )
  assert.equal(fail.conclusion, 'fail')
  const uncertain = goalChecker.run(
    sampleFacts({ task: { summary: '', sourceSeq: null, text: '' }, changedFiles: [], assistant: { text: '', sourceSeq: null } }),
    {},
    createEvidenceBag(),
  )
  assert.equal(uncertain.conclusion, 'uncertain')
})

test('verification checker covers pass, fail, and uncertain', () => {
  const bag = createEvidenceBag()
  assert.equal(verificationChecker.run(sampleFacts(), {}, bag).conclusion, 'pass')
  const failed = sampleFacts({
    commands: [{ ...sampleFacts().commands[0], isError: true }],
  })
  assert.equal(verificationChecker.run(failed, {}, createEvidenceBag()).conclusion, 'fail')
  const empty = sampleFacts({
    commands: [{ ...sampleFacts().commands[0], output: '', outputLength: 0 }],
  })
  assert.equal(verificationChecker.run(empty, {}, createEvidenceBag()).conclusion, 'uncertain')
  assert.equal(verificationChecker.run(sampleFacts({ commands: [] }), {}, createEvidenceBag()).conclusion, 'uncertain')
  const superseded = sampleFacts({
    commands: [
      { ...sampleFacts().commands[0], resultSeq: 3, isError: true, output: 'FAIL early' },
      {
        ...sampleFacts().commands[0],
        command: 'node --test "test/acceptance/*.test.js"',
        resultSeq: 99,
        summary: 'ℹ pass 21\nℹ fail 0',
      },
    ],
  })
  assert.equal(verificationChecker.run(superseded, {}, createEvidenceBag()).conclusion, 'pass')
})

test('scope checker covers pass, fail, and uncertain', () => {
  assert.equal(scopeChecker.run(sampleFacts(), { allowedPaths: [] }, createEvidenceBag()).conclusion, 'pass')
  const outside = sampleFacts({
    changedFiles: [{ path: 'D:\\other\\file.js', status: 'M', source: 'tool' }],
  })
  assert.equal(scopeChecker.run(outside, { allowedPaths: [] }, createEvidenceBag()).conclusion, 'fail')
  const clean = sampleFacts({ changedFiles: [] })
  assert.equal(scopeChecker.run(clean, {}, createEvidenceBag()).conclusion, 'pass')
  const noGit = sampleFacts({ changedFiles: [], git: { available: false, files: [], statusOutput: '', error: 'no git' } })
  assert.equal(scopeChecker.run(noGit, {}, createEvidenceBag()).conclusion, 'uncertain')
})

test('runCheckers returns three checks with unique evidence ids', () => {
  const { checks, evidence } = runCheckers(sampleFacts(), { allowedPaths: [] })
  assert.deepEqual(checks.map((check) => check.id), ['goal-response', 'verification', 'scope'])
  const ids = evidence.map((item) => item.id)
  assert.equal(new Set(ids).size, ids.length)
})
