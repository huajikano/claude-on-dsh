import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { redact } from './acceptance/contract.js'
import { createSupervisionHistory } from './supervision-history.js'
import {
  fingerprint, primarySession, supervisionMessage, supervisionSettings, turnSnapshot, validateSupervisionDecision,
} from './supervision-policy.js'

const held = (row) => ['paused', 'attention', 'complete', 'excluded'].includes(row.phase)
const phaseInFlight = (row) => ['reviewing', 'awaiting-desktop', 'sending'].includes(row.phase)
const messageOf = (error) => redact(String(error?.message || error)).slice(0, 4000)

export function attachSupervision({
  ctx, file, getSettings, inspect, review, send, resumeGoal, completeGoal,
  isBusy = () => false, overBudget = async () => false, logger = () => {}, settleMs = 500, now = Date.now,
}) {
  const records = new Map(), timers = new Map(), cancellations = new Map()
  const workBySession = new Map()
  let writes = Promise.resolve(), disposed = false, diskError = ''
  let saved = {}
  const log = (message) => logger(`[claude-on-dsh:supervisor] ${message}`)
  try {
    const state = JSON.parse(readFileSync(file, 'utf8'))
    if (state.version !== 1 || !Array.isArray(state.sessions)) throw new Error('unsupported supervision state')
    saved = state
    for (const row of saved.sessions) if (typeof row?.sessionId === 'string') records.set(row.sessionId, row)
  } catch (error) { if (error.code !== 'ENOENT') diskError = messageOf(error) }
  const audit = createSupervisionHistory({ entries: saved.history, totals: saved.totals, sessionTotals: saved.sessionTotals, sessions: [...records.values()], now })
  const settings = () => supervisionSettings(getSettings() || {})
  let appliedSettings = settings()
  const changed = (row) => { row.updatedAt = now() }
  function ensure(id) {
    if (!records.has(id)) records.set(id, { sessionId: id, phase: 'watching', objective: '', checks: 0,
      continuations: 0, failures: 0, noProgress: 0, lastTurnKey: '', updatedAt: now() })
    return records.get(id)
  }
  function persist() {
    if (diskError) return Promise.reject(new Error(diskError))
    const state = { version: 1, sessions: [...records.values()], ...audit.serialize() }
    const body = JSON.stringify(state, (_key, value) => typeof value === 'string' ? redact(value) : value, 2) + '\n'
    const write = writes.then(async () => {
      if (diskError) throw new Error(diskError)
      await mkdir(path.dirname(file), { recursive: true })
      const tmp = `${file}.${process.pid}.${randomUUID()}.tmp`
      try { await writeFile(tmp, body, { encoding: 'utf8', mode: 0o600 }); await rename(tmp, file) }
      catch (error) { await rm(tmp, { force: true }).catch(() => {}); throw error }
    })
    writes = write.catch((error) => { diskError = `监工状态无法保存：${messageOf(error)}`; log(diskError) })
    return write
  }
  function enqueue(id, run) {
    const previous = workBySession.get(id) || Promise.resolve()
    const next = previous.then(run)
    const settled = next.catch((error) => log(messageOf(error)))
    workBySession.set(id, settled)
    settled.finally(() => {
      if (workBySession.get(id) === settled) workBySession.delete(id)
    }).catch(() => {})
    return next
  }
  function clearScheduled(id) { clearTimeout(timers.get(id)); timers.delete(id) }
  function schedule(id, delay = settleMs, trigger = 'turn-end') {
    if (disposed || diskError || !settings().enabled || held(ensure(id))) return
    clearScheduled(id)
    const timer = setTimeout(() => {
      timers.delete(id)
      enqueue(id, () => check(id, trigger))
    }, Math.min(2_147_483_647, Math.max(0, delay)))
    timer.unref?.()
    timers.set(id, timer)
  }
  const active = (row, epoch) => !disposed && !diskError && settings().enabled && !held(row) &&
    (row.epoch || 0) === epoch && !isBusy(row.sessionId)
  function invalidate(row, status, note) {
    row.epoch = (row.epoch || 0) + 1
    const cancel = cancellations.get(row.sessionId)
    cancellations.delete(row.sessionId)
    try { cancel?.() } catch {}
    if (row.phase === 'sending' && row.action?.state === 'admitting') return
    audit.finish(row.activeAuditId, status, { note })
    if (row.phase === 'sending' && row.action) {
      row.action.state = 'cancelled'
      row.lastTurnKey = ''
    }
    row.pending = null
    if (!held(row)) row.phase = 'watching'
    row.note = note
    changed(row)
  }
  async function capture(row) {
    const data = await inspect(row.sessionId)
    if (!primarySession(ctx.agents?.get?.(row.sessionId), data.meta)) return null
    return turnSnapshot(row.sessionId, data, row)
  }
  async function fresh(row, snapshot, epoch) {
    if (!active(row, epoch)) return false
    const latest = await capture(row)
    return latest && !latest.explicitStop && !latest.subsequentUser && latest.turnKey === snapshot.turnKey &&
      latest.externalKey === snapshot.externalKey && latest.objectiveKey === snapshot.objectiveKey && active(row, epoch)
  }
  const sameEpoch = (row, epoch) => (row.epoch || 0) === epoch
  async function recordStale(row, epoch, auditId, decision, note) {
    if (!sameEpoch(row, epoch) || disposed) return
    row.pending = null
    if (row.phase === 'sending') { row.action.state = 'cancelled'; row.lastTurnKey = '' }
    if (!held(row)) row.phase = 'watching'
    row.note = note
    changed(row)
    audit.finish(auditId, 'stale', { decision, note })
    await persist()
  }
  async function sendDecision(row, decision, requestId) {
    const result = await send(row.sessionId, supervisionMessage(decision), requestId)
    if (result?.accepted === false) throw Object.assign(new Error('Host 未接收监工消息。'), { notAccepted: true })
  }
  async function finishReview(row, snap, decision, epoch, auditId) {
    audit.recordDecision(auditId, decision)
    if (!(await fresh(row, snap, epoch))) {
      return recordStale(row, epoch, auditId, decision, '会话、用户要求或目标已变化，旧判断未发送。')
    }
    row.decision = decision
    row.checks = (row.checks || 0) + 1
    row.pending = null
    row.error = ''
    row.failures = 0
    row.nextCheckAt = 0
    row.lastTurnKey = snap.turnKey
    changed(row)
    const limits = settings()
    if (decision.decision === 'continue' && (row.continuations >= limits.maxRounds || row.noProgress >= limits.maxNoProgress)) {
      row.phase = 'paused'
      row.note = '已达到自动续跑或无进展上限。'
      audit.finish(auditId, 'paused', { decision, note: row.note })
      return persist()
    }
    if (decision.decision === 'wait') {
      row.phase = 'watching'
      row.note = '本轮不干预'
      audit.finish(auditId, 'wait', { decision, note: row.note })
      return persist()
    }
    const requestId = `claude-monitor-${fingerprint([row.sessionId, snap.turnKey, decision.decision]).slice(0, 40)}`
    row.action = { requestId, turnKey: snap.turnKey, kind: decision.decision, state: 'prepared', at: now() }
    row.phase = 'sending'
    await persist()
    if (!(await fresh(row, snap, epoch))) return recordStale(row, epoch, auditId, decision, '发送前会话或目标已变化。')
    row.action.state = 'admitting'
    let status = 'continued', action = 'prompt'
    try {
      if (decision.decision === 'complete') {
        if (snap.nativeGoal) await completeGoal?.(row.sessionId, snap.nativeGoal)
        // Completing the native goal changes its revision. Respect the user's
        // epoch/stop state, without comparing against the former goal revision.
        if (!active(row, epoch)) throw new Error('目标处理后会话状态已变化，未发送通知')
        await sendDecision(row, decision, requestId)
        status = 'complete'
        row.note = '已发送一次验收合格通知，停止本会话监工。'
      } else {
        const resumed = snap.nativeGoal && await resumeGoal?.(row.sessionId, snap.nativeGoal)
        if (resumed === 'already-active') {
          status = 'wait'
          action = 'native-goal-active'
          row.note = '原生目标已激活，由现有目标继续推进。未额外发送消息。'
        } else if (resumed) {
          action = 'resume-goal'
          row.note = '已恢复原生目标，未重复发送续跑消息。'
        } else {
          if (!(await fresh(row, snap, epoch))) return recordStale(row, epoch, auditId, decision, '发送前会话或目标已变化。')
          await sendDecision(row, decision, requestId)
          row.note = '已向原会话发送下一步。'
        }
      }
      row.action.state = status === 'wait' ? 'skipped' : 'sent'
      if (status === 'continued') row.continuations = (row.continuations || 0) + 1
      if (status !== 'wait') row.lastActionAt = now()
      if (row.phase === 'sending') row.phase = status === 'complete' ? 'complete' : 'watching'
      audit.finish(auditId, status, { decision, requestId, note: row.note, action })
    } catch (error) {
      const rejected = error.notAccepted === true
      row.action.state = rejected ? 'rejected' : 'uncertain'
      row.phase = 'attention'
      row.error = `${rejected ? '动作未被接收' : '动作结果不确定'}，未自动重试：${messageOf(error)}`
      audit.finish(auditId, rejected ? 'failed' : 'uncertain', { decision, requestId, error: row.error })
    }
    changed(row)
    await persist()
  }
  async function check(id, trigger) {
    const row = ensure(id)
    let epoch = row.epoch || 0
    if (disposed || diskError || !settings().enabled || held(row) || (row.epoch || 0) !== epoch || ['reviewing', 'sending'].includes(row.phase)) return
    if (isBusy(row.sessionId)) {
      row.wasRunning = true
      row.busyRetryCount = Math.min(8, (row.busyRetryCount || 0) + 1)
      row.note = '会话仍在运行，等待结束后检查。'
      changed(row)
      await persist()
      const delay = Math.min(8_000, Math.max(settleMs, 1_000) * (2 ** Math.min(row.busyRetryCount - 1, 3)))
      schedule(id, delay, 'busy-retry')
      return
    }
    row.busyRetryCount = 0
    // A disconnected session used to return here and wait for an api-session/added
    // event to clear the flag. A Host that already knows the row may never emit
    // that again, so the row stayed dead for good. Probe instead, with backoff.
    if (row.disconnected === true) {
      row.disconnectProbe = Math.min(20, (row.disconnectProbe || 0) + 1)
      try {
        const probe = await capture(row)
        if (!probe?.workspace) throw new Error('会话仍不可读')
        row.disconnected = false
        row.disconnectProbe = 0
        row.error = ''
        changed(row)
        await persist()
      } catch (error) {
        row.error = `会话断开，正在重连：${messageOf(error)}`
        changed(row)
        await persist()
        if (row.disconnectProbe >= 12) {
          row.phase = 'attention'
          row.note = '会话长时间不可用，已停止自动重试，请手动恢复。'
          changed(row)
          await persist()
        } else {
          schedule(id, Math.min(60_000, 2_000 * (2 ** Math.min(row.disconnectProbe - 1, 5))), 'disconnect-probe')
        }
        return
      }
    }
    if (!active(row, epoch)) return
    let auditId
    try {
      const snap = await capture(row)
      // These used to be a silent `return`: the row kept claiming it was
      // waiting for the next turn while every trigger was thrown away.
      if (!snap) throw new Error('会话不可读（Agent 已释放或不是主会话）')
      if (!snap.workspace) throw new Error('会话缺少工作目录，无法核对项目')
      if (!active(row, epoch)) return
      if (!snap.goal) {
        row.note = '会话还没有可判断的目标，等待后续内容。'
        row.error = ''
        changed(row)
        await persist()
        return
      }
      row.disconnected = false
      row.wasRunning = false
      if (row.phase === 'awaiting-desktop') {
        const pending = row.pending?.snapshot
        if (!snap.explicitStop && !snap.subsequentUser && pending && snap.turnKey === pending.turnKey &&
            snap.externalKey === pending.externalKey && snap.objectiveKey === pending.objectiveKey) return
        invalidate(row, 'stale', '会话或目标已变化，原桌面任务已失效。')
        await persist()
        epoch += 1
        if (!active(row, epoch)) return
      }
      if (snap.explicitStop) {
        row.phase = 'paused'; row.note = '用户要求停止或暂停。'; changed(row)
        audit.control(id, 'user-stop', row.note)
        await persist(); return
      }
      if (snap.subsequentUser || snap.turnKey === row.lastTurnKey) return
      const cfg = settings()
      if (row.retryTurnKey !== snap.turnKey) { row.failures = 0; row.nextCheckAt = 0; row.retryTurnKey = snap.turnKey }
      const rateLimited = /rate.limit|quota|限流|配额/i.test(snap.stopReason)
      const elapsedUntil = Math.max(row.nextCheckAt || 0,
        (row.lastActionAt || 0) + (rateLimited ? Math.max(cfg.cooldownMs, cfg.retryBaseMs) : cfg.cooldownMs))
      if (elapsedUntil > now()) { schedule(id, elapsedUntil - now(), trigger); return }
      // The supervision engine is `cli` or `desktop`, and `cli` means "run
      // through runClaudeFor", which itself picks the Agent SDK or the CLI and
      // charges the same daily ledger. So gating on `cli` covers both engines;
      // `desktop` is skipped because it never bills through this ledger.
      const blockedByBudget = cfg.engine === 'cli' && await overBudget()
      if (!active(row, epoch) || settings().engine !== cfg.engine) return
      if (blockedByBudget) {
        row.phase = 'paused'; row.note = '已达到 Claude 日预算。'; changed(row)
        audit.control(id, 'budget', row.note)
        await persist(); return
      }
      if (row.progressTurnKey !== snap.turnKey) {
        row.noProgress = row.progressKey && row.progressKey === snap.progressKey ? (row.noProgress || 0) + 1 : 0
        row.progressKey = snap.progressKey
        row.progressTurnKey = snap.turnKey
      }
      row.objective ||= snap.goal
      row.workspace = snap.workspace
      row.phase = 'reviewing'
      row.reviewEngine = cfg.engine
      row.error = ''
      // Persist only the binding, not the unbounded transcript. Desktop needs the
      // rendered, redacted prompt after restart, not the original raw events.
      const binding = { turnKey: snap.turnKey, externalKey: snap.externalKey, objectiveKey: snap.objectiveKey, nativeGoal: snap.nativeGoal }
      auditId = audit.begin({ sessionId: id, objective: snap.goal, workspace: snap.workspace, turnKey: snap.turnKey, engine: cfg.engine, trigger })
      row.activeAuditId = auditId
      row.pending = { id: auditId, turnKey: snap.turnKey, snapshot: binding, createdAt: now(), epoch }
      changed(row)
      if (cfg.engine === 'cli') audit.startExecution(auditId)
      await persist()
      if (!active(row, epoch)) return recordStale(row, epoch, auditId, null, '检查启动前会话已变化。')
      let result
      try {
        result = await review(snap, { engine: cfg.engine, requestId: auditId, onCancel: (cancel) => {
          if (!active(row, epoch)) cancel()
          else cancellations.set(id, cancel)
        } })
      } finally { cancellations.delete(id) }
      if (!active(row, epoch)) return recordStale(row, epoch, auditId, null, '检查期间会话已变化。')
      if (cfg.engine === 'desktop') {
        if (!result?.pendingDesktop || !result.prompt) throw new Error('未生成桌面待审任务')
        row.phase = 'awaiting-desktop'
        row.pending.prompt = redact(result.prompt)
        row.note = '等待桌面 Claude 回传判断。'
        changed(row)
        audit.pending(auditId)
        await persist()
        return
      }
      await finishReview(row, snap, validateSupervisionDecision(result), epoch, auditId)
    } catch (error) {
      if (disposed || diskError || !sameEpoch(row, epoch)) return
      row.error = messageOf(error)
      row.pending = null
      row.failures = (row.failures || 0) + 1
      if (!auditId) auditId = audit.begin({ sessionId: id, objective: row.objective, workspace: row.workspace, engine: settings().engine, trigger })
      audit.finish(auditId, 'failed', { error: row.error })
      const cfg = settings()
      if (row.phase === 'sending') {
        row.action.state = 'uncertain'; row.phase = 'attention'
      } else if (row.failures > cfg.maxRetries) {
        row.phase = 'paused'; row.note = '检查失败，已达到重试上限，未发送续跑消息。'
      } else {
        row.phase = 'retrying'; row.nextCheckAt = now() + cfg.retryBaseMs * (2 ** (row.failures - 1))
        row.note = '检查失败，等待退避重试。'
        schedule(id, row.nextCheckAt - now(), 'retry')
      }
      changed(row)
      await persist()
    }
  }

  function publicRecord({ activeAuditId, pending, ...row }) {
    return { ...row, stats: audit.forSession(row.sessionId), pending: row.phase === 'awaiting-desktop' && pending
      ? { id: pending.id, createdAt: pending.createdAt, prompt: pending.prompt } : null }
  }
  async function bind(id, info = {}) {
    if (!id) return
    const row = ensure(id)
    if (!row.objective && info.objective) row.objective = redact(String(info.objective)).slice(0, 16_000)
    if (info.workspace) row.workspace = info.workspace
    if (info.engine) row.sourceEngine = info.engine
    changed(row)
    await persist()
  }
  /**
   * Take over a session the operator picked by hand.
   *
   * Rows are otherwise created by passive signals, which meant a conversation
   * that had never been dispatched by this plugin could only be monitored if it
   * happened to emit a status event after the plugin loaded. Adopting is the
   * explicit form: it creates the row, seeds the objective from the transcript
   * when none was given, and asks for an immediate check.
   */
  async function adopt(id, info = {}) {
    if (!id) throw new Error('缺少要接管的会话 id')
    const row = ensure(id)
    const wasExcluded = row.phase === 'excluded'
    const wasSettled = ['complete', 'attention'].includes(row.phase)
    if (info.objective) row.objective = redact(String(info.objective)).slice(0, 16_000)
    if (info.workspace) row.workspace = info.workspace
    if (info.engine) row.sourceEngine = info.engine
    row.phase = 'watching'
    row.error = ''
    row.note = '已由面板接管，等待检查。'
    // A settled or excluded row must be allowed to look at the current turn
    // again; a live row keeps its lastTurnKey so the same turn is not resent.
    if (wasExcluded || wasSettled) row.lastTurnKey = ''
    Object.assign(row, { failures: 0, nextCheckAt: 0, noProgress: 0, continuations: 0 })
    changed(row)
    await persist()
    schedule(id, settleMs, 'adopted')
    return publicRecord(row)
  }
  async function exclude(id) {
    const row = ensure(id)
    invalidate(row, 'cancelled', '插件内部会话不参与全局监工。')
    row.phase = 'excluded'
    clearScheduled(id)
    await persist()
  }
  async function control(id, action) {
    const row = records.get(id)
    if (!row || row.phase === 'excluded') throw new Error('监工会话不存在')
    if (!['pause', 'resume'].includes(action)) throw new Error('无效监工操作')
    if (row.phase === 'sending' && row.action?.state === 'admitting') throw new Error('动作已经提交，处理完成后再操作')
    clearScheduled(id)
    const note = action === 'pause' ? '用户暂停监工。' : '用户恢复监工。'
    invalidate(row, 'cancelled', note)
    row.phase = action === 'pause' ? 'paused' : 'watching'
    if (action === 'resume') Object.assign(row, { error: '', failures: 0, nextCheckAt: 0, noProgress: 0, continuations: 0 })
    audit.control(id, action, note)
    await persist()
    if (action === 'resume') schedule(id, settleMs, 'manual-resume')
    return publicRecord(row)
  }
  function submitDesktop(id, requestId, value) {
    return enqueue(id, async () => {
      const row = records.get(id)
      if (disposed || diskError || !settings().enabled || settings().engine !== 'desktop' || !row ||
          row.phase !== 'awaiting-desktop' || row.pending?.id !== requestId) throw new Error('待审任务已失效或处理完毕')
      const decision = validateSupervisionDecision(value)
      const { snapshot, epoch } = row.pending
      const auditId = row.activeAuditId || requestId
      try { await finishReview(row, snapshot, decision, epoch || 0, auditId) }
      catch (error) {
        if (!disposed && !diskError && sameEpoch(row, epoch || 0)) {
          row.phase = 'attention'; row.pending = null; row.error = messageOf(error); changed(row)
          audit.finish(auditId, 'failed', { decision, error: row.error })
          await persist()
        }
        throw error
      }
      return publicRecord(row)
    })
  }
  async function refresh({ recover = false } = {}) {
    if (disposed || diskError) return
    const cfg = settings(), old = appliedSettings
    const enteredSleepMode = cfg.sleepMode === true && (old.sleepMode !== true || recover)
    appliedSettings = cfg
    for (const row of records.values()) {
      const id = row.sessionId
      if (!cfg.enabled) {
        clearScheduled(id)
        if (phaseInFlight(row) || row.phase === 'retrying') invalidate(row, 'cancelled', '全局监工已关闭。')
        row.wasRunning = false
        continue
      }
      if (phaseInFlight(row) && row.reviewEngine && row.reviewEngine !== cfg.engine && row.phase !== 'sending') {
        invalidate(row, 'cancelled', '监工引擎已切换。')
        schedule(id, settleMs, 'engine-change')
      } else if (recover && (row.phase === 'reviewing' || row.wasRunning)) {
        if (row.phase === 'reviewing') { row.pending = null; row.phase = 'watching' }
        if (row.wasRunning) row.stopReason = 'host-restarted-interruption'
        schedule(id, settleMs, 'host-recovery')
      } else if (enteredSleepMode && !held(row)) {
        // On explicit sleep handoff, inspect known unfinished rows immediately
        // instead of waiting for a future turn event. `lastTurnKey` and the
        // normal freshness checks still prevent duplicate continuation.
        schedule(id, settleMs, 'sleep-mode-enabled')
      } else if (row.phase === 'retrying' && (recover || old.enabled !== cfg.enabled)) {
        schedule(id, (row.nextCheckAt || 0) - now(), 'retry')
      }
    }
    if (records.size) await persist()
  }

  for (const row of records.values()) {
    const id = row.activeAuditId || row.pending?.id
    if (row.phase === 'sending') {
      audit.recover(id, true)
      row.phase = 'attention'; row.pending = null
      row.error = 'Host 重启时无法确认动作是否已发送，请核对会话。未自动重放。'
    } else if (row.phase === 'reviewing') {
      audit.recover(id, false)
    } else if (row.phase === 'awaiting-desktop') {
      if (!row.pending?.id || !row.pending.snapshot || !row.pending.prompt) {
        audit.recover(id, false)
        row.phase = 'reviewing'; row.pending = null
      } else {
        row.activeAuditId = audit.begin({ id: row.pending.id, sessionId: row.sessionId, objective: row.objective,
          workspace: row.workspace, turnKey: row.pending.turnKey, engine: 'desktop', trigger: 'restored-desktop' })
        audit.pending(row.activeAuditId)
      }
    }
  }
  const report = (error) => log(messageOf(error))
  const knownPrimary = (id) => {
    const row = records.get(id)
    if (!row || !settings().enabled || disposed || diskError || row.phase === 'excluded') return null
    const agent = ctx.agents?.get?.(id)
    return agent && !primarySession(agent) ? null : row
  }
  const trackablePrimary = (id) => {
    const existing = knownPrimary(id)
    if (existing) return existing
    const agent = ctx.agents?.get?.(id)
    if (!agent || !primarySession(agent) || !settings().enabled || disposed || diskError) return null
    return ensure(id)
  }
  const persistSignal = (row) => persist().catch(report)
  function markFailure(id, reason, detail = '') {
    const row = trackablePrimary(id)
    if (!row || ['paused', 'attention', 'complete'].includes(row.phase)) return
    const detailText = detail ? messageOf(detail?.message || detail?.error?.message || detail) : ''
    const note = detailText ? `会话失败（${reason}）：${detailText}` : `会话失败（${reason}），等待重试。`
    if (row.phase === 'sending' && row.action?.state === 'admitting') {
      row.action.state = 'uncertain'
      row.phase = 'attention'
      row.error = note
      row.note = '会话失败，动作结果不确定，请人工核对。'
      changed(row)
      persistSignal(row)
      return
    }
    if (phaseInFlight(row)) invalidate(row, 'failed', note)
    row.wasRunning = false
    row.stopReason = detailText ? `${reason}: ${detailText}` : reason
    row.error = note
    row.note = note
    changed(row)
    schedule(id, settleMs, `session-${reason}`)
    persistSignal(row)
  }
  function markDisconnected(id, reason = 'session-disconnected') {
    const row = knownPrimary(id)
    if (!row) return
    clearScheduled(id)
    row.disconnected = true
    row.wasRunning = false
    row.stopReason = reason
    if (row.phase === 'sending' && row.action?.state === 'admitting') {
      row.action.state = 'uncertain'
      row.phase = 'attention'
      row.error = '会话已断开，动作结果不确定，请人工核对。'
      row.note = '会话已断开，动作结果不确定，请人工核对。'
    } else if (phaseInFlight(row)) {
      invalidate(row, 'stale', '会话已断开，当前监工检查失效，等待重连。')
      row.phase = 'retrying'
      row.note = '会话已断开，等待重连。'
    } else if (!held(row)) {
      row.phase = 'retrying'
      row.note = '会话已断开，等待重连。'
    }
    changed(row)
    persistSignal(row)
  }
  function markReconnected(id, running = false) {
    const row = knownPrimary(id)
    if (!row) return
    const wasDisconnected = row.disconnected === true
    row.disconnected = false
    if (running) {
      row.wasRunning = true
      clearScheduled(id)
      if (wasDisconnected && row.phase === 'retrying') {
        row.failures = 0
        row.nextCheckAt = 0
        row.phase = 'watching'
        row.error = ''
        row.note = '会话已重连，等待本轮结束。'
      }
    } else {
      row.wasRunning = false
      if (wasDisconnected && row.phase === 'retrying') {
        row.failures = 0
        row.nextCheckAt = 0
        row.phase = 'watching'
        row.error = ''
        row.note = '会话已重连，等待检查。'
      }
      if (!held(row) && !(row.phase === 'sending' && row.action?.state === 'admitting')) {
        schedule(id, settleMs, 'session-reconnected')
      }
    }
    changed(row)
    persistSignal(row)
  }
  const eligible = (agent) => agent?.id && primarySession(agent) && settings().enabled && !disposed && !diskError
  const off = [
    ctx.on('agent/status', ({ agent, status, prevStatus }) => {
      if (!eligible(agent) || records.get(agent.id)?.phase === 'excluded') return
      const row = ensure(agent.id)
      if (status === 'running') {
        if (row.wasRunning) return
        const wasDisconnected = row.disconnected === true
        row.wasRunning = true
        row.disconnected = false
        clearScheduled(agent.id)
        if (row.phase !== 'sending' && phaseInFlight(row)) invalidate(row, 'stale', '会话已开始新一轮，旧检查失效。')
        if (wasDisconnected && row.phase === 'retrying') {
          row.phase = 'watching'
          row.failures = 0
          row.nextCheckAt = 0
          row.error = ''
          row.note = '会话已重连，等待本轮结束。'
        }
        persist().catch(report)
      } else if (['idle', 'stopped', 'error', 'failed', 'cancelled'].includes(status) && (row.wasRunning || prevStatus === 'running' || status !== 'idle')) {
        const wasDisconnected = row.disconnected === true
        row.wasRunning = false
        row.disconnected = false
        row.stopReason = status
        if (wasDisconnected && row.phase === 'retrying') {
          row.phase = 'watching'
          row.failures = 0
          row.nextCheckAt = 0
          row.error = ''
          row.note = '会话已重连，等待检查。'
        }
        schedule(agent.id, settleMs, `agent-${status}`)
      }
    }, { global: true }),
    ctx.on('agent/error', ({ agent, error }) => {
      if (!eligible(agent)) return
      markFailure(agent.id, 'agent-error', error)
    }, { global: true }),
    ctx.on('api-session/status', (sessionId, running) => {
      const row = knownPrimary(sessionId)
      if (!row) return
      if (running) {
        row.wasRunning = true
        row.disconnected = false
        clearScheduled(sessionId)
      } else {
        row.wasRunning = false
        row.stopReason = 'idle'
        if (!held(row)) schedule(sessionId, settleMs, 'api-session-idle')
      }
      changed(row)
      persistSignal(row)
    }, { global: true }),
    ctx.on('api-session/error', (sessionId, message) => {
      markFailure(sessionId, 'api-session-error', message)
    }, { global: true }),
    ctx.on('api-session/added', (summary) => {
      if (!summary?.sessionId || summary.origin === 'subagent' || summary.parentSessionId) return
      if (summary.agentAvailable === false) markDisconnected(summary.sessionId, 'agent-unavailable')
      else markReconnected(summary.sessionId, summary.running === true)
    }, { global: true }),
    ctx.on('api-session/removed', (sessionId) => {
      markDisconnected(sessionId, 'session-removed')
    }, { global: true }),
    ctx.on('session/disposed', (session) => {
      if (!session?.id || ['subagent', 'internal'].includes(session.header?.origin)) return
      markDisconnected(session.id, 'session-disposed')
    }, { global: true }),
    ctx.on('agent/disposed', ({ agent }) => {
      if (!eligible(agent)) return
      const row = ensure(agent.id)
      row.stopReason = 'interrupted-disposed'
      row.wasRunning = false
      schedule(agent.id, settleMs, 'agent-disposed')
    }, { global: true }),
    ctx.on('session/event', (session, event) => {
      if (!session?.id || ['subagent', 'internal'].includes(session.header?.origin)) return
      if (event?.type === 'turn/end') schedule(session.id)
    }, { global: true }),
  ]
  function dispose() {
    disposed = true
    for (const fn of off) fn?.()
    for (const id of timers.keys()) clearScheduled(id)
    for (const cancel of cancellations.values()) { try { cancel() } catch {} }
    cancellations.clear()
  }
  ctx.effect(() => dispose, 'claude-on-dsh: global supervisor')
  refresh({ recover: true }).catch(report)
  return {
    bind, adopt, exclude, control, submitDesktop, refresh, dispose,
    history: (query) => audit.page(query),
    pending: (id) => records.get(id)?.phase === 'awaiting-desktop' ? records.get(id).pending : null,
    list: () => ({ enabled: settings().enabled, sleepMode: settings().sleepMode, engine: settings().engine, error: diskError, stats: audit.totals(),
      items: [...records.values()].filter((row) => row.phase !== 'excluded').sort((a, b) => b.updatedAt - a.updatedAt).map(publicRecord) }),
    check: (id) => enqueue(id, () => check(id, 'manual')),
    flush: async () => { await Promise.all([...workBySession.values()]); await writes },
  }
}
