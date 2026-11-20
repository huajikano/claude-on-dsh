import { randomUUID } from 'node:crypto'
import { redact } from './acceptance/contract.js'

const ACTIVE = new Set(['preparing', 'running', 'awaiting-desktop'])
const counterFor = {
  continued: 'continued', complete: 'completed', wait: 'waited', failed: 'failed', uncertain: 'failed',
  cancelled: 'cancelled', interrupted: 'cancelled', stale: 'stale', paused: 'paused',
}
const blank = () => ({ executions: 0, decisions: 0, continued: 0, completed: 0, waited: 0, failed: 0, cancelled: 0, stale: 0, paused: 0, legacyChecks: 0 })
const string = (value, max = 4000) => redact(String(value ?? '')).slice(0, max)
const count = (value) => Number.isSafeInteger(value) && value > 0 ? value : 0
const clean = (value) => Object.fromEntries(Object.keys(blank()).map((key) => [key, count(value?.[key])]))

/** Keep cumulative counters separately from the bounded, newest-first audit view. */
export function createSupervisionHistory({ entries = [], totals, sessionTotals, sessions = [], now = Date.now, keep = 1000 } = {}) {
  const rows = Array.isArray(entries) ? entries.filter((row) => row && typeof row.id === 'string').map((row) => ({ ...row })) : []
  const byId = new Map(rows.map((row) => [row.id, row]))
  const perSession = new Map(Array.isArray(sessionTotals)
    ? sessionTotals.filter((row) => typeof row?.sessionId === 'string').map(({ sessionId, ...value }) => [sessionId, clean(value)]) : [])
  const global = clean(totals)
  const startedAt = totals?.startedAt || now()
  const session = (id) => {
    if (!perSession.has(id)) perSession.set(id, blank())
    return perSession.get(id)
  }
  function add(id, key) {
    global[key] += 1
    session(id)[key] += 1
  }
  if (!Array.isArray(sessionTotals)) {
    const hadTotals = Boolean(totals)
    for (const record of sessions) {
      // Old state tracked successful Claude replies but not attempts or failures.
      // Preserve that number without manufacturing an execution history for it.
      const legacy = hadTotals ? Math.max(0, count(record.checks) - count(record.executions)) : count(record.checks)
      if (legacy) session(record.sessionId).legacyChecks = legacy
      if (!hadTotals) global.legacyChecks += legacy
    }
    for (const row of rows) {
      if (row.type !== 'review') continue
      row.executed ??= row.engine !== 'desktop' || Boolean(row.decision)
      const stats = session(row.sessionId)
      for (const key of [row.executed && 'executions', row.decision && 'decisions', counterFor[row.status]].filter(Boolean)) {
        stats[key] += 1
        if (!hadTotals) global[key] += 1
      }
      // The development version counted unexecuted desktop tasks at creation.
      if (hadTotals && row.executed === false) global.executions = Math.max(0, global.executions - 1)
    }
  }
  function trim() {
    let excess = rows.reduce((size, row) => size + Number(!ACTIVE.has(row.status)), 0) - keep
    if (excess <= 0) return
    for (let index = 0; excess > 0 && index < rows.length;) {
      if (ACTIVE.has(rows[index].status)) { index += 1; continue }
      byId.delete(rows[index].id)
      rows.splice(index, 1)
      excess -= 1
    }
  }
  function begin({ id = randomUUID(), sessionId, objective, workspace, turnKey, engine, trigger }) {
    if (byId.has(id)) return id
    const row = { id, type: 'review', sessionId, objective: string(objective, 600), workspace: string(workspace, 1200),
      turnKey, engine, trigger, status: 'preparing', executed: false, startedAt: now() }
    rows.push(row)
    byId.set(id, row)
    return id
  }
  function startExecution(id) {
    const row = byId.get(id)
    if (!row || !ACTIVE.has(row.status) || row.executed) return
    row.executed = true
    row.executionAt = now()
    row.status = 'running'
    add(row.sessionId, 'executions')
  }
  function pending(id) {
    const row = byId.get(id)
    if (!row || !ACTIVE.has(row.status)) return
    row.status = 'awaiting-desktop'
    row.preparedAt = now()
  }
  function recordDecision(id, decision) {
    const row = byId.get(id)
    if (!row || !ACTIVE.has(row.status) || row.decision) return
    startExecution(id)
    add(row.sessionId, 'decisions')
    row.decision = decision.decision
    row.reason = string(decision.reason)
    row.message = string(decision.message, 6000)
    row.evidence = (decision.evidence || []).slice(0, 12).map((value) => string(value, 1200))
  }
  function finish(id, status, { decision, error, note, requestId, action } = {}) {
    const row = byId.get(id)
    if (!row || !ACTIVE.has(row.status)) return false
    if (decision) recordDecision(id, decision)
    row.status = status
    row.finishedAt = now()
    row.durationMs = Math.max(0, row.finishedAt - row.startedAt)
    if (error) row.error = string(error)
    if (note) row.note = string(note)
    if (requestId) row.requestId = requestId
    if (action) row.action = action
    if (counterFor[status]) add(row.sessionId, counterFor[status])
    trim()
    return true
  }
  function control(sessionId, action, note) {
    const at = now(), row = { id: randomUUID(), type: 'control', sessionId, action, status: 'control', note: string(note), startedAt: at, finishedAt: at }
    rows.push(row)
    byId.set(row.id, row)
    trim()
  }
  function recover(id, uncertain) {
    return finish(id, uncertain ? 'uncertain' : 'interrupted', {
      note: uncertain ? 'Host 重启时无法确认动作是否已发送；未重放。' : '检查在 Host 重启时中断。',
    })
  }
  function page({ sessionId = '', status = '', before = '', offset = 0, limit = 30 } = {}) {
    const matches = (row) => (!sessionId || row.sessionId === sessionId) && (!status || row.status === status || (status === 'failed' && row.status === 'uncertain'))
    const filtered = rows.filter(matches).reverse()
    const size = Math.min(100, Math.max(1, count(Number(limit)) || 30))
    const cursor = before ? filtered.findIndex((row) => row.id === before) : -1
    const start = cursor >= 0 ? cursor + 1 : count(Number(offset))
    const items = filtered.slice(start, start + size).map((row) => ({ ...row }))
    const hasMore = start + size < filtered.length
    return { items, total: filtered.length, offset: start, limit: size, hasMore, nextCursor: hasMore ? items.at(-1)?.id || '' : '' }
  }
  trim()
  return { begin, startExecution, recordDecision, pending, finish, recover, control, page,
    totals: () => ({ ...global, startedAt, retainedRecords: rows.length,
      running: rows.filter((row) => row.status === 'running').length,
      pendingDesktop: rows.filter((row) => row.status === 'awaiting-desktop').length }),
    forSession: (id) => ({ ...(perSession.get(id) || blank()) }),
    serialize: () => ({ history: rows.slice(), totals: { ...global, startedAt },
      sessionTotals: [...perSession].map(([sessionId, stats]) => ({ sessionId, ...stats })) }),
  }
}
