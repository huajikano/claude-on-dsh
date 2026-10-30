import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { buildFacts, extractCommands, extractFileOps, extractTask, readGit } from '../../lib/acceptance/facts.js'
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

test('buildFacts normalizes task, commands, file ops, and missing facts', async () => {
  const facts = await buildFacts({ sessionId: 'session-test', meta: { cwd: workspace }, events: sampleEvents(), workspace })
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

test('scope checker keeps a clean worktree as evidenced pass', () => {
  const clean = sampleFacts({
    changedFiles: [],
    git: { available: true, hasHead: true, head: 'abc123', files: [], statusOutput: '', error: '' },
  })
  const check = scopeChecker.run(clean, {}, createEvidenceBag())
  assert.equal(check.conclusion, 'pass')
  assert.equal(check.evidence.length, 1)
  assert.match(check.evidence[0].excerpt, /clean worktree/)
})

test('readGit keeps a repository with no commits available', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'cod-unborn-'))
  try {
    execFileSync('git', ['-C', dir, 'init', '-q'])
    const git = await readGit(dir)
    assert.equal(git.available, true)
    assert.equal(git.hasHead, false)
    assert.equal(git.head, '')
    assert.equal(git.error, '')
    const facts = await buildFacts({ sessionId: 'session-unborn', meta: { cwd: dir }, events: sampleEvents(), workspace: dir })
    assert.ok(!facts.missing.includes('git-state-unavailable'))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('readGit distinguishes a clean committed worktree from an unavailable one', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'cod-clean-git-'))
  try {
    execFileSync('git', ['-C', dir, 'init', '-q'])
    execFileSync('git', ['-C', dir, '-c', 'user.email=t@example.com', '-c', 'user.name=t', 'commit', '--allow-empty', '-qm', 'init'])
    const git = await readGit(dir)
    assert.equal(git.available, true)
    assert.equal(git.hasHead, true)
    assert.equal(git.statusOutput, '')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('runCheckers returns three checks with unique evidence ids', () => {
  const { checks, evidence } = runCheckers(sampleFacts(), { allowedPaths: [] })
  assert.deepEqual(checks.map((check) => check.id), ['goal-response', 'verification', 'scope'])
  const ids = evidence.map((item) => item.id)
  assert.equal(new Set(ids).size, ids.length)
})
