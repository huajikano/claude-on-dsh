import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { readSession } from '../../lib/session-read.js'

const sessionId = 'session-read-1'
const cwd = 'D:\\Projects\\demo'
const event = (seq, type, data) => ({ type, seq, time: 1, data })

test('reads the live store when the Host no longer exposes inspect()', async () => {
  const ctx = {
    sessions: {
      get: (id) => {
        assert.equal(id, sessionId)
        return {
          header: { id, cwd, createdAt: 1, isSeeded: false },
          snapshotEvents: () => [event(1, 'user/message', { content: [] })],
        }
      },
    },
    sessionController: {
      async list() { throw new Error('live data is enough') },
      async events() { throw new Error('live data is enough') },
    },
  }
  const read = await readSession(ctx, sessionId, AbortSignal.timeout(5000))
  assert.equal(read.meta.cwd, cwd)
  assert.equal(read.events.length, 1)
})

test('falls back to Controller list() and events() for a cold session', async () => {
  const calls = []
  const ctx = {
    sessions: { get: () => undefined },
    sessionController: {
      async list(request, signal) {
        calls.push(['list', signal instanceof AbortSignal])
        return { items: [{ sessionId, cwd, updatedAt: 5 }] }
      },
      async events(request, signal) {
        calls.push(['events', request.address.kind, signal instanceof AbortSignal])
        return {
          cursor: 2,
          hasMore: false,
          records: [
            { type: 'event', event: event(1, 'user/message', {}) },
            { type: 'event', event: event(2, 'assistant/message', {}) },
          ],
        }
      },
    },
  }
  const read = await readSession(ctx, sessionId, AbortSignal.timeout(5000))
  assert.equal(read.meta.cwd, cwd)
  assert.deepEqual(read.events.map((item) => item.seq), [1, 2])
  assert.deepEqual(calls, [['list', true], ['events', 'session', true]])
})

test('keeps the legacy inspect() contract when the Host still has it', async () => {
  const legacy = { meta: { cwd: 'D:\\legacy' }, events: [event(1, 'user/message', {})] }
  const ctx = {
    sessions: { get() { throw new Error('must not touch the store') } },
    sessionController: {
      async inspect(id, signal) {
        assert.equal(id, sessionId)
        assert.ok(signal instanceof AbortSignal)
        return legacy
      },
    },
  }
  assert.equal(await readSession(ctx, sessionId, AbortSignal.timeout(5000)), legacy)
})

test('completes a live header that is missing cwd from the Controller summary', async () => {
  const ctx = {
    sessions: {
      get: () => ({ header: { id: sessionId }, snapshotEvents: () => [event(1, 'user/message', {})] }),
    },
    sessionController: {
      async list() { return { items: [{ sessionId, cwd, updatedAt: 9 }] } },
      async events() { throw new Error('not needed') },
    },
  }
  const read = await readSession(ctx, sessionId, AbortSignal.timeout(5000))
  assert.equal(read.meta.cwd, cwd)
})

test('reads the persisted log when neither the store nor the Controller answers', async () => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'claude-read-home-'))
  const previous = process.env.DSH_HOME
  try {
    process.env.DSH_HOME = home
    const dir = path.join(home, 'sessions', 'workspace-a', sessionId)
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, 'session.v4.jsonl'), [
      JSON.stringify({ type: 'session', version: 4, id: sessionId, createdAt: 1, cwd, isSeeded: false }),
      JSON.stringify({ type: 'user/message', seq: 1, time: 2, data: { content: [] } }),
    ].join('\n') + '\n')
    const read = await readSession(
      { sessions: { get: () => undefined }, sessionController: {} },
      sessionId,
      AbortSignal.timeout(5000),
    )
    assert.equal(read.meta.cwd, cwd)
    assert.equal(read.events.length, 1)
  } finally {
    if (previous === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = previous
    await rm(home, { recursive: true, force: true })
  }
})

test('a session that cannot be read at all fails with a clear 404', async () => {
  await assert.rejects(
    readSession({ sessions: {}, sessionController: {} }, 'session-missing', AbortSignal.timeout(2000)),
    (error) => error.status === 404 && /无法读取会话/.test(error.message),
  )
})
