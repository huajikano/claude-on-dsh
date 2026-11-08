import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createJobs } from '../../lib/jobs.js'

const delay = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms))

test('jobs settle, expose progress, and cancel the active operation once', async () => {
  const jobs = createJobs()
  let resolve
  let cancelCalls = 0
  const promise = new Promise((done) => { resolve = done })
  const job = jobs.start('slow', ({ update }) => {
    update({ phase: 'Working' })
    return { promise, cancel: () => { cancelCalls += 1 } }
  })
  assert.equal(jobs.serialize(job).phase, 'Working')
  const cancelled = jobs.cancel(job.id)
  assert.equal(cancelled.ok, true)
  assert.equal(cancelCalls, 1)
  assert.equal(jobs.cancel(job.id).reason, 'not-running')
  resolve({ data: { stale: true } })
  await delay()
  assert.equal(jobs.serialize(job).state, 'cancelled')
})

test('jobs persist terminal results and mark in-flight jobs interrupted on restart', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'claude-on-dsh-jobs-'))
  const file = path.join(dir, 'jobs.json')
  try {
    const jobs = createJobs({ file })
    const job = jobs.start('complete', async () => ({ result: true }))
    await delay(10)
    await jobs.flush()
    assert.equal(jobs.serialize(job).state, 'done')

    const runningFile = path.join(dir, 'running.json')
    const running = createJobs({ file: runningFile })
    const hold = new Promise(() => {})
    running.start('interrupted', () => hold)
    await running.flush()
    const recovered = createJobs({ file: runningFile })
    assert.equal(recovered.list()[0].state, 'interrupted')

    const saved = JSON.parse(await readFile(file, 'utf8'))
    assert.equal(saved[0].state, 'done')
    assert.deepEqual(saved[0].result, { result: true })
    await recovered.flush()
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('retry creates a new job with the original payload and leaves the failed job intact', async () => {
  const jobs = createJobs()
  const failed = jobs.start('sample', async () => {
    throw Object.assign(new Error('boom'), { status: 502 })
  }, { sessionId: 'session-1', requirement: 'keep me' })
  await delay(5)
  assert.equal(jobs.serialize(failed).state, 'error')
  const result = jobs.retry(failed.id, async () => ({ data: { ok: true } }))
  assert.equal(result.ok, true)
  assert.notEqual(result.job.id, failed.id)
  assert.deepEqual(result.job.payload, { sessionId: 'session-1', requirement: 'keep me' })
  await delay(5)
  assert.equal(jobs.serialize(result.job).state, 'done')
  assert.equal(jobs.serialize(failed).state, 'error')
})

test('missing persistence files are initialized atomically', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'claude-on-dsh-jobs-'))
  const file = path.join(dir, 'state', 'jobs.json')
  try {
    const jobs = createJobs({ file })
    jobs.start('instant', async () => ({ ok: true }))
    await delay(5)
    await jobs.flush()
    assert.match(await readFile(file, 'utf8'), /"state": "done"/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
