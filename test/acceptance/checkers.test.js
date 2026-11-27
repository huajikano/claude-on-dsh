import assert from 'node:assert/strict'
import test from 'node:test'
import { verificationChecker, scopeChecker, createEvidenceBag, isAllowedPath } from '../../lib/acceptance/checkers.js'
import { extractCommands } from '../../lib/acceptance/facts.js'

function command({ category, seq, failed = false, output = 'ok', zeroTests = false }) {
  const commandText = category === 'test' ? 'npm test' : category === 'build' ? 'npm run build' : 'npm run lint'
  const text = zeroTests ? 'ℹ tests 0\nℹ pass 0\nℹ fail 0' : output
  const call = {
    type: 'tool/call', seq: seq - 1,
    data: { callId: `call-${seq}`, name: 'bash', arguments: JSON.stringify({ command: commandText }) },
  }
  const result = {
    type: 'tool/result', seq,
    data: { message: { toolCallId: `call-${seq}`, content: [{ type: 'text', text }], isError: failed } },
  }
  return [call, result]
}

function verify(events) {
  const commands = extractCommands(events)
  return verificationChecker.run({ commands }, {}, createEvidenceBag())
}

test('verification evaluates latest run per category and does not mask failure', () => {
  const events = [
    ...command({ category: 'build', seq: 2, failed: true, output: 'build failed' }),
    ...command({ category: 'test', seq: 4, output: 'tests 3, pass 3, fail 0' }),
  ]
  const result = verify(events)
  assert.equal(result.conclusion, 'fail')
  assert.match(result.note, /build/)
})

test('zero-test output is unverified rather than passing', () => {
  const result = verify(command({ category: 'test', seq: 2, zeroTests: true }))
  assert.equal(result.conclusion, 'uncertain')
  assert.match(result.note, /test/)
})

test('a later successful run supersedes a failure only in the same category', () => {
  const events = [
    ...command({ category: 'build', seq: 2, failed: true, output: 'build failed' }),
    ...command({ category: 'build', seq: 4, output: 'build complete' }),
    ...command({ category: 'test', seq: 6, output: 'tests 3, pass 3, fail 0' }),
  ]
  const result = verify(events)
  assert.equal(result.conclusion, 'pass')
  assert.equal(result.evidence.length, 2)
})

test('a path that climbs out of the workspace is not treated as inside', () => {
  const workspace = process.platform === 'win32' ? 'C:/proj/app' : '/proj/app'
  assert.equal(isAllowedPath('../outside/x.js', workspace), false)
  assert.equal(isAllowedPath('src/../../outside/x.js', workspace), false)
  assert.equal(isAllowedPath(`${workspace}/../outside/x.js`, workspace), false)
  assert.equal(isAllowedPath('src/a.js', workspace), true)
  assert.equal(isAllowedPath(`${workspace}/src/a.js`, workspace), true)
})

test('allowedPaths globs cover root files and reject dot segments', () => {
  const workspace = process.platform === 'win32' ? 'C:/proj/app' : '/proj/app'
  assert.equal(isAllowedPath('a.js', workspace, ['**/*.js']), true)
  assert.equal(isAllowedPath('src/deep/a.js', workspace, ['**/*.js']), true)
  assert.equal(isAllowedPath('a.ts', workspace, ['**/*.js']), false)
  assert.equal(isAllowedPath('src/a.js', workspace, ['src/*.js']), true)
  assert.equal(isAllowedPath('src/deep/a.js', workspace, ['src/*.js']), false)
})

test('the scope note never claims more than was checked', () => {
  const workspace = process.platform === 'win32' ? 'C:/proj/app' : '/proj/app'
  const files = Array.from({ length: 40 }, (_, index) => ({ path: `src/f${index}.js`, status: 'M', source: 'git' }))
  const result = scopeChecker.run(
    { workspace, changedFiles: files, git: { available: true, hasHead: true, files, statusOutput: '' }, fileOps: [] },
    { allowedPaths: ['**/*.js'] },
    createEvidenceBag(),
  )
  assert.equal(result.conclusion, 'pass')
  assert.match(result.note, /40/)
})
