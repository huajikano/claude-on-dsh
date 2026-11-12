import assert from 'node:assert/strict'
import test from 'node:test'
import { latestForkSessions } from '../../lib/sessions.js'

const row = (sessionId, parentSessionId, updatedAt, extra = {}) => ({
  sessionId, cwd: 'D:\\artra', updatedAt,
  ...(parentSessionId ? { parentSessionId } : {}),
  ...extra,
})
const ids = (items) => latestForkSessions(items).map((item) => item.sessionId)

test('a continuation chain exposes only its leaf even when an ancestor was updated later', () => {
  const result = latestForkSessions([
    row('root', null, 100), row('last', 'middle', 3), row('middle', 'root', 2),
  ])
  assert.equal(result.length, 1)
  assert.equal(result[0].sessionId, 'last')
  assert.deepEqual(result[0].forkSessionIds, ['last', 'middle', 'root'])
})

test('same title and workspace do not merge unrelated conversations', () => {
  const rows = [row('one', null, 2, { title: 'same' }), row('two', null, 1, { title: 'same' })]
  assert.deepEqual(ids(rows), ['one', 'two'])
})

test('a fork family with branches chooses the most recently active leaf deterministically', () => {
  const rows = [row('root', null, 100), row('left', 'root', 5), row('right', 'root', 6), row('old', 'left', 4)]
  assert.deepEqual(ids(rows), ['right'])
  assert.deepEqual(ids(rows.toReversed()), ['right'])
  assert.deepEqual(ids([row('root', null, 0), row('b', 'root', 5), row('a', 'root', 5)]), ['a'])
})

test('subagents are excluded and do not supersede their parent or bridge conversations', () => {
  const result = latestForkSessions([
    row('root', null, 1), row('child', 'root', 10, { origin: 'subagent' }),
    row('other', 'child', 2),
  ])
  assert.deepEqual(result.map((item) => item.sessionId), ['other', 'root'])
  assert.deepEqual(result.find((item) => item.sessionId === 'root').forkSessionIds, ['root'])
})

test('blank forks never supersede usable conversations but may connect later continuations', () => {
  assert.deepEqual(ids([row('root', null, 1), row('blank', 'root', 2, { blank: true })]), ['root'])
  assert.deepEqual(ids([
    row('root', null, 1), row('blank', 'root', 2, { blank: true }), row('latest', 'blank', 3),
  ]), ['latest'])
  assert.deepEqual(ids([row('blank', null, 1, { blank: true })]), [])
})

test('missing ancestors preserve continuations and connect siblings without mixing workspaces', () => {
  assert.deepEqual(ids([row('one', 'missing', 1), row('two', 'missing', 2)]), ['two'])
  assert.deepEqual(ids([row('one', 'missing', 1), row('two', 'missing', 2, { cwd: 'D:\\elsewhere' })]), ['two', 'one'])
  assert.deepEqual(ids([row('root', null, 1), row('other', 'root', 2, { cwd: 'D:\\elsewhere' })]), ['other', 'root'])
})

test('cycles and self references fail soft with stable targets rather than dropping sessions', () => {
  assert.deepEqual(ids([row('one', 'two', 1), row('two', 'one', 2)]), ['two'])
  assert.deepEqual(ids([row('one', 'one', 1)]), ['one'])
})
