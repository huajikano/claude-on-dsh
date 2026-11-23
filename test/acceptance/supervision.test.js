import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { attachSupervision } from '../../lib/supervision.js'
import { buildSupervisionPrompt, migrateWorkflowSettings, ownMessage, supervisionMessage, turnSnapshot, validateSupervisionDecision, SUPERVISOR_MARKER } from '../../lib/supervision-policy.js'

const decision = (kind = 'continue') => ({ decision: kind, reason: 'src/app.js 与目标比较', message: '继续补齐剩余目标', evidence: ['src/app.js:1-20'], goalSatisfied: kind === 'complete' })
const events = (turn = 1, reason = 'completed', final = '尚未完成，需要继续') => [
  { type: 'user/message', seq: 1, data: { content: '完成项目：实现登录并验证手机端' } },
  { type: 'tool/result', seq: turn * 4, data: { result: `changed-${turn}` } },
  { type: 'assistant/message', seq: turn * 4 + 1, data: { content: final } },
  { type: 'turn/end', seq: turn * 4 + 2, data: { turn, reason: { kind: reason } } },
]
async function harness(fn, opts = {}) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'cod-supervision-'))
  const file = path.join(dir, 'state.json')
  const listeners = new Map()
  const records = { sends: [], resumes: [], reviews: [], current: events(), busy: false, meta: { cwd: dir } }
  let settings = { enabled: true, cooldownMs: 0, retryBaseMs: 1000, maxRetries: 0, ...opts.settings }
  if (opts.initial) await writeFile(file, JSON.stringify({ version: 1, sessions: opts.initial }))
  const ctx = {
    on(type, cb, options) { records.registrations ||= []; records.registrations.push({ type, options }); if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(cb); return () => listeners.get(type).delete(cb) },
    effect() {}, agents: { get: () => opts.agent || { id: 's1' } },
  }
  const create = () => attachSupervision({
    ctx, file, getSettings: () => settings, settleMs: 1,
    inspect: async () => {
      if (records.inspectError) throw new Error(records.inspectError)
      return { meta: records.meta, events: records.current, goal: records.goal }
    },
    isBusy: () => records.busy,
    overBudget: async () => Boolean(opts.overBudget),
    review: async (snapshot, request) => { records.reviews.push({ snapshot, request }); return opts.review ? opts.review(snapshot, records, request) : decision() },
    send: async (id, message, requestId) => { records.sends.push({ id, message, requestId }); if (opts.sendError) throw new Error('admission timeout') },
    resumeGoal: async () => { records.resumes.push(true); return opts.resumeGoal === true },
  })
  const monitor = create()
  try { await fn({ monitor, records, file, create, ctx, listeners, setSettings: (value) => { settings = { ...settings, ...value } } }) }
  finally { monitor.dispose(); await monitor.flush(); await rm(dir, { recursive: true, force: true }) }
}

test('a continuation message is just the next step, and still recognised as ours', () => {
  const bare = supervisionMessage({ decision: 'continue', reason: '目标未完成', message: '', evidence: [] })
  assert.equal(bare, `${SUPERVISOR_MARKER} 继续`, 'no reason paragraph, just 继续')
  assert.equal(ownMessage({ content: [{ type: 'text', text: bare }] }), true,
    'the marker keeps it from being mistaken for a user message')
  const specific = supervisionMessage({ decision: 'continue', reason: 'x', message: '补齐手机端布局', evidence: [] })
  assert.equal(specific, `${SUPERVISOR_MARKER} 补齐手机端布局`)
  assert.equal(ownMessage({ content: [{ type: 'text', text: '继续' }] }), false,
    'a bare 继续 typed by the user is still a user message')
})

test('old defaults migrate to disabled acceptance and global monitoring', () => {
  const cfg = migrateWorkflowSettings({ autoPrompt: true, manualAcceptance: true, autoAcceptance: true })
  assert.equal(cfg.autoPrompt, false); assert.equal(cfg.manualAcceptance, false); assert.equal(cfg.autoAcceptance, false)
  assert.equal(cfg.supervision.enabled, true)
  assert.equal(migrateWorkflowSettings({ workflowVersion: 2, autoPrompt: true }).autoPrompt, true)
  assert.equal(migrateWorkflowSettings({ workflowVersion: 2, manualAcceptance: true }).manualAcceptance, true)
  assert.equal(migrateWorkflowSettings({}, { manualAcceptance: true }).manualAcceptance, true)
})
test('an own continue message cannot replace the original goal', () => {
  const list = [...events(), { type: 'user/message', seq: 8, data: { content: `${SUPERVISOR_MARKER}\n继续` } }]
  const snapshot = turnSnapshot('s1', { meta: {}, events: list })
  assert.match(snapshot.goal, /实现登录/); assert.equal(snapshot.subsequentUser, false)
})
test('missing evidence cannot produce the completed action', () => {
  assert.equal(validateSupervisionDecision({ ...decision('complete'), evidence: [] }).decision, 'wait')
  assert.throws(() => validateSupervisionDecision({ decision: 'pass' }))
})
test('prompt separates claimed completion from evidence-backed completion', () => {
  const prompt = buildSupervisionPrompt({ goal: '实现登录', finalText: '全部完成' })
  assert.match(prompt, /decision=wait/); assert.match(prompt, /goalSatisfied=true/)
})
test('a root conversation not created by the plugin is monitored', async () => {
  await harness(async ({ monitor, records }) => {
    await monitor.check('s1')
    assert.equal(records.reviews.length, 1); assert.equal(records.sends.length, 1)
    assert.match(records.sends[0].message, /继续补齐/)
  })
})
test('same terminal turn is processed and sent only once', async () => {
  await harness(async ({ monitor, records }) => {
    await Promise.all([monitor.check('s1'), monitor.check('s1'), monitor.check('s1')])
    assert.equal(records.reviews.length, 1); assert.equal(records.sends.length, 1)
  })
})
test('success notifies once, persists completion and disarms future turns', async () => {
  await harness(async ({ monitor, records, create }) => {
    await monitor.check('s1')
    assert.match(records.sends[0].message, /验收合格/)
    records.current = events(2)
    await monitor.check('s1'); assert.equal(records.sends.length, 1)
    monitor.dispose(); const restored = create()
    await restored.check('s1'); assert.equal(records.sends.length, 1)
    restored.dispose(); await restored.flush()
  }, { review: () => decision('complete') })
})
test('claimed completion with wait does not send continue', async () => {
  await harness(async ({ monitor, records }) => {
    records.current = events(1, 'completed', '项目已全部完成')
    await monitor.check('s1')
    assert.equal(records.reviews[0].snapshot.claimedComplete, true)
    assert.equal(records.sends.length, 0)
  }, { review: () => decision('wait') })
})
test('interruption is sent to Claude before continuation', async () => {
  await harness(async ({ monitor, records }) => {
    records.current = events(1, 'token_limit')
    await monitor.check('s1')
    assert.equal(records.reviews[0].snapshot.interrupted, true)
    assert.equal(records.sends.length, 1)
  })
})
test('paused native goal is resumed without a duplicate continue', async () => {
  await harness(async ({ monitor, records }) => {
    records.goal = { id: 'g1', revision: 1, objective: '实现登录', phase: 'paused' }
    await monitor.check('s1')
    assert.equal(records.resumes.length, 1); assert.equal(records.sends.length, 0)
  }, { resumeGoal: true })
})
test('explicit user stop prevents a Claude query or continuation', async () => {
  await harness(async ({ monitor, records }) => {
    records.current[0].data.content = '不要再继续，暂停监工'
    await monitor.check('s1')
    assert.equal(records.reviews.length, 0); assert.equal(records.sends.length, 0)
    assert.equal(monitor.list().items[0].phase, 'paused')
  })
})
test('user instruction arriving during inspection invalidates the old decision', async () => {
  await harness(async ({ monitor, records }) => {
    await monitor.check('s1'); assert.equal(records.sends.length, 0)
  }, { review: (_snapshot, records) => {
    records.current.push({ type: 'user/message', seq: 99, data: { content: '改为只做报告' } }); return decision()
  } })
})
test('a concurrent native goal revision invalidates a desktop or CLI decision', async () => {
  await harness(async ({ monitor, records }) => {
    records.goal = { id: 'g1', revision: 1, objective: '登录', phase: 'paused' }
    await monitor.check('s1'); assert.equal(records.sends.length, 0)
  }, { review: (_snapshot, records) => { records.goal.revision += 1; return decision() } })
})
test('busy sessions and child agents are not reviewed', async () => {
  await harness(async ({ monitor, records }) => {
    records.busy = true; await monitor.check('s1'); assert.equal(records.reviews.length, 0)
  })
  await harness(async ({ monitor, records }) => { await monitor.check('s1'); assert.equal(records.reviews.length, 0) }, { agent: { id: 's1', parentId: 'parent' } })
})
test('internal planning session exclusion is respected', async () => {
  await harness(async ({ monitor, records }) => { monitor.exclude('s1'); await monitor.check('s1'); assert.equal(records.reviews.length, 0) })
})
test('review failures are never translated into continue', async () => {
  await harness(async ({ monitor, records }) => {
    await monitor.check('s1'); assert.equal(records.sends.length, 0)
    assert.equal(monitor.list().items[0].phase, 'paused')
  }, { review: () => { throw new Error('402 insufficient balance') } })
})
test('uncertain admission is held instead of resubmitted after restart', async () => {
  await harness(async ({ monitor, records, create }) => {
    await monitor.check('s1'); assert.equal(monitor.list().items[0].phase, 'attention')
    monitor.dispose(); const restored = create(); await restored.check('s1')
    assert.equal(records.sends.length, 1); restored.dispose(); await restored.flush()
  }, { sendError: true })
})
test('persisted sending state is held after crash', async () => {
  await harness(async ({ monitor, records }) => { await monitor.check('s1'); assert.equal(records.sends.length, 0); assert.equal(monitor.list().items[0].phase, 'attention') }, {
    initial: [{ sessionId: 's1', phase: 'sending' }],
  })
})
test('no-progress loop pauses after bounded continuation attempts', async () => {
  await harness(async ({ monitor, records }) => {
    await monitor.check('s1')
    records.current.at(-1).seq += 1; await monitor.check('s1')
    records.current.at(-1).seq += 1; await monitor.check('s1')
    assert.equal(records.sends.length, 2); assert.equal(monitor.list().items[0].phase, 'paused')
  }, { settings: { maxNoProgress: 2 } })
})
test('desktop mode waits for an actual response and never silently falls back', async () => {
  await harness(async ({ monitor, records }) => {
    await monitor.check('s1')
    const row = monitor.list().items[0]
    assert.equal(row.phase, 'awaiting-desktop'); assert.equal(records.sends.length, 0)
    await assert.rejects(() => monitor.submitDesktop('s1', 'stale-request', decision()))
    await monitor.submitDesktop('s1', row.pending.id, decision('complete'))
    assert.equal(records.sends.length, 1); assert.equal(monitor.list().items[0].phase, 'complete')
    await assert.rejects(() => monitor.submitDesktop('s1', row.pending.id, decision()))
  }, { review: () => ({ pendingDesktop: true, prompt: '待审项目提示词' }), settings: { engine: 'desktop' } })
})
test('desktop response from an older turn cannot continue a newer one', async () => {
  await harness(async ({ monitor, records }) => {
    await monitor.check('s1'); const pending = monitor.list().items[0].pending
    records.current = events(2)
    await monitor.submitDesktop('s1', pending.id, decision())
    assert.equal(records.sends.length, 0)
  }, { review: () => ({ pendingDesktop: true, prompt: 'review' }), settings: { engine: 'desktop' } })
})
test('turn is durably reserved before admitting a message', async () => {
  await harness(async ({ monitor, file }) => {
    await monitor.check('s1')
    const saved = JSON.parse(await readFile(file, 'utf8'))
    assert.equal(saved.sessions[0].action.state, 'sent')
    assert.equal(saved.sessions[0].lastTurnKey.length > 0, true)
  })
})
test('budget exhaustion pauses monitoring without generating any message', async () => {
  await harness(async ({ monitor, records }) => { await monitor.check('s1'); assert.equal(records.sends.length, 0); assert.equal(records.reviews.length, 0) }, { overBudget: true })
})

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
test('idle and disposal signals coalesce without an explicit arm call', async () => {
  await harness(async ({ monitor, records, listeners }) => {
    for (const listener of listeners.get('agent/status')) listener({ agent: { id: 's1' }, status: 'running' })
    for (const listener of listeners.get('agent/status')) listener({ agent: { id: 's1' }, status: 'idle' })
    for (const listener of listeners.get('agent/disposed')) listener({ agent: { id: 's1' } })
    await delay(30); await monitor.flush()
    assert.equal(records.reviews.length, 1); assert.equal(records.sends.length, 1)
  })
})

test('terminal trigger is retried if Host still reports the session busy', async () => {
  await harness(async ({ monitor, records, listeners }) => {
    records.busy = true
    for (const listener of listeners.get('agent/status')) listener({ agent: { id: 's1' }, status: 'running' })
    for (const listener of listeners.get('agent/status')) listener({ agent: { id: 's1' }, status: 'idle' })
    setTimeout(() => { records.busy = false }, 30)
    await delay(1100)
    await monitor.flush()
    assert.equal(records.reviews.length, 1)
    assert.equal(records.sends.length, 1)
  })
})

test('agent error signal schedules a review even without a new turn-end event', async () => {
  await harness(async ({ monitor, records, listeners }) => {
    for (const listener of listeners.get('agent/error')) listener({ agent: { id: 's1' }, turn: 1, step: 2, error: new Error('transport disconnected') })
    await delay(30); await monitor.flush()
    assert.equal(records.reviews.length, 1)
    assert.equal(records.sends.length, 1)
  })
})

test('api-session errors retain nested error details and schedule monitoring', async () => {
  await harness(async ({ monitor, records, listeners }) => {
    await monitor.bind('s1', { objective: '实现目标', workspace: 'D:/project' })
    for (const listener of listeners.get('api-session/error')) listener('s1', { message: 'session transport failed' })
    const row = monitor.list().items[0]
    assert.match(row.error, /session transport failed/)
    await delay(30); await monitor.flush()
    assert.equal(records.reviews.length, 1)
  })
})

test('a disconnected session is probed and recovers on its own when readable again', async () => {
  await harness(async ({ monitor, records, listeners }) => {
    await monitor.bind('s1', { objective: '实现目标', workspace: 'D:/project' })
    records.inspectError = 'session store unavailable'
    for (const listener of listeners.get('api-session/removed')) listener('s1')
    await monitor.flush()
    assert.equal(monitor.list().items[0].disconnected, true)
    assert.equal(monitor.list().items[0].phase, 'retrying')

    // Still unreadable: stays disconnected, records why, and retries later
    // instead of waiting forever for an api-session/added that may never come.
    await monitor.check('s1')
    await monitor.flush()
    let row = monitor.list().items[0]
    assert.equal(row.disconnected, true)
    assert.match(row.error, /正在重连/)
    assert.equal(records.reviews.length, 0)

    // Readable again: the probe reconnects without needing an external event.
    delete records.inspectError
    await monitor.check('s1')
    await monitor.flush()
    row = monitor.list().items[0]
    assert.equal(row.disconnected, false)
    assert.equal(records.reviews.length, 1)
    assert.equal(records.sends.length, 1)
  })
})

test('session re-addition also clears the disconnected state', async () => {
  await harness(async ({ monitor, records, listeners }) => {
    await monitor.bind('s1', { objective: '实现目标', workspace: 'D:/project' })
    for (const listener of listeners.get('api-session/removed')) listener('s1')
    await monitor.flush()
    assert.equal(monitor.list().items[0].disconnected, true)

    for (const listener of listeners.get('api-session/added')) listener({ sessionId: 's1', agentAvailable: true, running: false, blank: false, updatedAt: Date.now() })
    await delay(30); await monitor.flush()
    assert.equal(monitor.list().items[0].disconnected, false)
    assert.equal(records.reviews.length, 1)
  })
})

test('an unreadable snapshot is reported instead of silently dropped', async () => {
  await harness(async ({ monitor, records }) => {
    records.meta = {}                                  // no cwd → no workspace
    await monitor.check('s1')
    await monitor.flush()
    const row = monitor.list().items[0]
    assert.match(row.error, /工作目录/, 'the reason is recorded, not swallowed')
    assert.equal(row.phase, 'retrying', 'and it retries instead of pretending to wait')
    assert.equal(records.reviews.length, 0)
  }, { settings: { maxRetries: 3 } })
})

test('a session with no goal yet is noted without burning retries', async () => {
  await harness(async ({ monitor, records }) => {
    records.current = [{ type: 'assistant/message', seq: 1, data: { content: '你好' } }]
    await monitor.check('s1')
    await monitor.flush()
    const row = monitor.list().items[0]
    assert.match(row.note, /还没有可判断的目标/)
    assert.equal(row.failures || 0, 0)
    assert.equal(records.reviews.length, 0)
  })
})

test('a running Agent clears disconnected state without starting a check mid-turn', async () => {
  await harness(async ({ monitor, records, listeners }) => {
    await monitor.bind('s1', { objective: '实现目标', workspace: 'D:/project' })
    for (const listener of listeners.get('api-session/removed')) listener('s1')
    await monitor.flush()
    for (const listener of listeners.get('agent/status')) listener({ agent: { id: 's1' }, status: 'running' })
    await monitor.flush()
    assert.equal(monitor.list().items[0].disconnected, false)
    assert.equal(monitor.list().items[0].phase, 'watching')
    assert.equal(records.reviews.length, 0)
  })
})

test('global disable prevents passive signals and manual checks', async () => {
  await harness(async ({ monitor, records, listeners }) => {
    for (const listener of listeners.get('agent/status')) listener({ agent: { id: 's1' }, status: 'idle' })
    await delay(10); await monitor.check('s1')
    assert.equal(records.reviews.length, 0); assert.equal(records.sends.length, 0)
  }, { settings: { enabled: false } })
})
test('disabled during a slow Claude query cancels the query and never sends', async () => {
  let release, entered, cancelled = false
  const started = new Promise((resolve) => { entered = resolve })
  const gate = new Promise((resolve) => { release = resolve })
  await harness(async ({ monitor, records, setSettings }) => {
    const running = monitor.check('s1'); await started
    setSettings({ enabled: false }); await monitor.refresh(); release(); await running
    assert.equal(cancelled, true); assert.equal(records.sends.length, 0)
  }, { review: async (_snapshot, _records, request) => { request.onCancel(() => { cancelled = true }); entered(); await gate; return decision() } })
})

test('disposal without a new turn/end examines new tail activity', () => {
  const list = [...events(), { type: 'user/message', seq: 8, data: { content: '继续补齐手机端' } },
    { type: 'tool/result', seq: 9, data: { result: 'new activity before crash' } }]
  const snapshot = turnSnapshot('s1', { meta: {}, events: list }, { stopReason: 'interrupted-disposed' })
  assert.equal(snapshot.interrupted, true); assert.equal(snapshot.subsequentUser, false)
  assert.notEqual(snapshot.turnKey, turnSnapshot('s1', { meta: {}, events: events() }).turnKey)
})
test('negative completion text is not a completed claim', () => {
  const snapshot = turnSnapshot('s1', { meta: {}, events: events(1, 'completed', '项目未完成，尚未验证手机端') })
  assert.equal(snapshot.claimedComplete, false)
})
test('state on disk redacts token-shaped output', async () => {
  await harness(async ({ monitor, records, file }) => {
    records.current[1].data.result = 'sk-123456789012345678901234'
    await monitor.check('s1')
    const raw = await readFile(file, 'utf8')
    assert.equal(raw.includes('sk-123456789012345678901234'), false)
  }, { review: () => ({ pendingDesktop: true, prompt: 'review' }) })
})

test('a forked main session remains eligible but a subagent origin does not', async () => {
  await harness(async ({ monitor, records }) => { records.meta.parentSessionId = 'original'; records.meta.isSeeded = true; await monitor.check('s1'); assert.equal(records.reviews.length, 1) })
  await harness(async ({ monitor, records }) => { records.meta.origin = 'subagent'; await monitor.check('s1'); assert.equal(records.reviews.length, 0) })
})
test('native limit details are preserved for backoff and judgment', () => {
  const list = events(1, 'error'); list.at(-1).data.reason.error = { code: 'RATE_LIMIT', message: 'quota exceeded' }
  assert.match(turnSnapshot('s1', { meta: {}, events: list }).stopReason, /RATE_LIMIT/)
})

test('turn counters and transient tool message ids do not count as project progress', () => {
  const one = events(1), two = events(2)
  for (const [turn, list] of [[1, one], [2, two]]) list[1].data = { turn, step: turn, message: { id: 'transient-' + turn, toolCallId: 'call-' + turn, content: [{ type: 'text', text: 'unchanged output' }] } }
  const a = turnSnapshot('s1', { meta: {}, events: one }), b = turnSnapshot('s1', { meta: {}, events: two })
  assert.notEqual(a.turnKey, b.turnKey); assert.equal(a.progressKey, b.progressKey)
})
