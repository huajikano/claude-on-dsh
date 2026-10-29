import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { attachAcceptance } from '../../lib/acceptance/host.js'
import { sampleEvents } from './fixtures.js'

function harness({ gatePolicy, askAnswer }) {
  const listeners = new Map()
  const state = { inspect: 0, asked: 0, workspace: '' }
  const ctx = {
    effect(callback) {
      const disposer = callback()
      return typeof disposer === 'function' ? disposer : () => {}
    },
    on(event, handler) {
      listeners.set(event, handler)
      return () => {}
    },
    get() {
      return undefined
    },
    logger: { info() {}, warn() {} },
    agents: { get: () => ({ id: 'session-x', status: 'idle' }) },
    userQuestions: {
      async ask() {
        state.asked += 1
        if (askAnswer === 'throw') throw new Error('no answerer')
        return askAnswer
      },
    },
    sessionController: {
      async inspect() {
        state.inspect += 1
        return { meta: { cwd: state.workspace }, events: sampleEvents() }
      },
    },
  }
  const acceptance = attachAcceptance({
    ctx,
    config: { acceptance: { gatePolicy, judgeRetries: 0, judgeTimeoutMs: 10_000, reportDir: '.dsh/acceptance' } },
    runJudge: async () => {
      throw new Error('judge unavailable in test')
    },
    logger: () => {},
  })
  return { ctx, acceptance, listeners, state }
}

async function emitStatus(listeners, status) {
  listeners.get('agent/status')({ agent: { id: 'session-x' }, status })
  await new Promise((resolve) => setTimeout(resolve, 450))
}

test('gatePolicy off: never inspects or writes', async () => {
  const { acceptance, listeners, state } = harness({ gatePolicy: 'off' })
  const dir = await mkdtemp(path.join(os.tmpdir(), 'cod-off-'))
  state.workspace = dir
  try {
    acceptance.arm('session-x')
    await emitStatus(listeners, 'running')
    await emitStatus(listeners, 'idle')
    assert.equal(state.inspect, 0)
    assert.equal(existsSync(path.join(dir, '.dsh')), false)
  } finally {
    acceptance.dispose()
    await rm(dir, { recursive: true, force: true })
  }
})

test('gatePolicy ask: refusal writes no report and does not inspect', async () => {
  const { acceptance, listeners, state } = harness({
    gatePolicy: 'ask',
    askAnswer: { answers: [{ id: 'acceptance', selected: ['跳过'] }] },
  })
  const dir = await mkdtemp(path.join(os.tmpdir(), 'cod-ask-'))
  state.workspace = dir
  try {
    acceptance.arm('session-x')
    await emitStatus(listeners, 'running')
    await emitStatus(listeners, 'idle')
    assert.equal(state.asked, 1)
    assert.equal(state.inspect, 0)
    assert.equal(existsSync(path.join(dir, '.dsh')), false)
  } finally {
    acceptance.dispose()
    await rm(dir, { recursive: true, force: true })
  }
})

test('gatePolicy auto: runs exactly once and writes json + md', async () => {
  const { acceptance, listeners, state } = harness({ gatePolicy: 'auto' })
  const dir = await mkdtemp(path.join(os.tmpdir(), 'cod-auto-'))
  state.workspace = dir
  try {
    acceptance.arm('session-x')
    await emitStatus(listeners, 'running')
    await emitStatus(listeners, 'idle')
    await emitStatus(listeners, 'idle')
    assert.equal(state.inspect, 1)
    assert.ok(existsSync(path.join(dir, '.dsh', 'acceptance', 'session-x.json')))
    assert.ok(existsSync(path.join(dir, '.dsh', 'acceptance', 'session-x.md')))
  } finally {
    acceptance.dispose()
    await rm(dir, { recursive: true, force: true })
  }
})
