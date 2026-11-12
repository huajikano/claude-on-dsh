/**
 * Read one Session's header and event log from whatever surface this Host offers.
 *
 * `sessionController.inspect()` was the historical read path and newer Harness
 * builds removed it in favour of the live store (`ctx.sessions`) plus paged
 * Controller reads. Everything else in this plugin only needs `{ meta, events }`,
 * so this module picks the best available source and keeps one shape.
 */
import os from 'node:os'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { findSessionLog, readSessionLog } from './acceptance/session-log.js'

/** Upper bound for one paged read; acceptance only needs the tail of a turn. */
const EVENT_PAGE_BUDGET = 2000

function liveSession(ctx, sessionId) {
  const store = ctx && ctx.sessions
  if (!store || typeof store.get !== 'function') return undefined
  try {
    return store.get(sessionId)
  } catch {
    return undefined
  }
}

function fromLive(session) {
  if (!session) return null
  const meta = session.header && typeof session.header === 'object' ? session.header : null
  let events = null
  try {
    if (typeof session.snapshotEvents === 'function') events = session.snapshotEvents()
    else if (Array.isArray(session.events)) events = session.events
  } catch {
    events = null
  }
  return meta || events ? { meta, events } : null
}

async function fromSummary(controller, sessionId, signal) {
  if (!controller || typeof controller.list !== 'function') return null
  try {
    const value = await controller.list({}, signal)
    const items = value && Array.isArray(value.items) ? value.items : []
    const row = items.find((item) => item && item.sessionId === sessionId)
    if (!row) return null
    return { id: row.sessionId, cwd: row.cwd, isSeeded: false, createdAt: row.updatedAt }
  } catch {
    return null
  }
}

async function fromControllerEvents(controller, sessionId, signal) {
  if (!controller || typeof controller.events !== 'function') return null
  try {
    const page = await controller.events(
      { address: { kind: 'session', sessionId }, maxMessages: EVENT_PAGE_BUDGET },
      signal,
    )
    const records = page && Array.isArray(page.records) ? page.records : []
    return records.map((record) => (record && record.event ? record.event : record)).filter(Boolean)
  } catch {
    return null
  }
}

function fromSessionLog(sessionId) {
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
  try {
    if (!existsSync(path.join(home, 'sessions'))) return null
    const { meta, events } = readSessionLog(findSessionLog(home, sessionId))
    return { meta, events }
  } catch {
    return null
  }
}

/**
 * @returns {Promise<{ meta: object, events: object[] }>}
 */
export async function readSession(ctx, sessionId, signal) {
  const controller = ctx && ctx.sessionController
  // Older Hosts: keep the original contract and its error behaviour.
  if (controller && typeof controller.inspect === 'function') {
    return await controller.inspect(sessionId, signal)
  }

  const live = fromLive(liveSession(ctx, sessionId))
  let meta = live && live.meta ? live.meta : null
  let events = live && Array.isArray(live.events) ? live.events : null

  if (!meta || !meta.cwd) {
    const summary = await fromSummary(controller, sessionId, signal)
    if (summary) meta = { ...(meta || {}), ...summary, ...(meta && meta.cwd ? { cwd: meta.cwd } : {}) }
  }
  if (!events || events.length === 0) {
    events = (await fromControllerEvents(controller, sessionId, signal)) || events
  }
  if (!meta || !events || events.length === 0) {
    const disk = fromSessionLog(sessionId)
    if (disk) {
      if (!meta || !meta.cwd) meta = disk.meta
      if (!events || events.length === 0) events = disk.events
    }
  }

  if (!meta) {
    throw Object.assign(new Error(`无法读取会话 ${sessionId} 的元信息`), { status: 404 })
  }
  return { meta, events: Array.isArray(events) ? events : [] }
}
