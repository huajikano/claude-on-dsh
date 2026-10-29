/**
 * Acceptance kernel: facts -> checkers -> Claude adjudication -> report.
 * Both the Host hook and the standalone CLI call this one function.
 */
import { SCHEMA_VERSION, assertValidReport } from './contract.js'
import { buildFacts } from './facts.js'
import { runCheckers } from './checkers.js'
import { judgeAcceptance } from './judge.js'
import { writeReports } from './report.js'

function fallbackChecks(checks, note) {
  return checks.map((check) => ({
    id: check.id,
    name: check.name,
    conclusion: 'uncertain',
    evidence: check.evidence,
    note: `${check.note} ${note}`,
  }))
}

/**
 * A pass is only allowed when every check passed AND no required fact was
 * missing. Untested criteria downgrade the session to uncertain; this is the
 * difference between "evidence says pass" and "nobody checked".
 */
export function evidenceBackedOverall(overall, checks, missing) {
  if (overall !== 'pass') return overall
  if (missing.length > 0) return 'uncertain'
  if (checks.some((check) => check.conclusion === 'uncertain')) return 'uncertain'
  return 'pass'
}

function assemble({ facts, checks, evidence, judged, gatePolicy, startedAt, now }) {
  const evidenceById = new Map(evidence.map((item) => [item.id, item]))
  const judgeChecks = new Map((judged.data.checks || []).map((check) => [check.id, check]))
  const reportChecks = checks.map((check) => {
    const judgedCheck = judgeChecks.get(check.id)
    const ids = judgedCheck && judgedCheck.evidenceIds && judgedCheck.evidenceIds.length > 0
      ? judgedCheck.evidenceIds
      : check.evidence.map((item) => item.id)
    return {
      id: check.id,
      name: check.name,
      conclusion: judgedCheck ? judgedCheck.conclusion : check.conclusion,
      evidence: ids.map((id) => evidenceById.get(id)).filter(Boolean),
      note: judgedCheck && judgedCheck.note ? judgedCheck.note : check.note,
    }
  })
  const missing = [...new Set([...facts.missing, ...(judged.data.missing || [])])]
  const overall = evidenceBackedOverall(judged.data.overall, reportChecks, missing)
  const downgraded = overall !== judged.data.overall
  const summary = judged.data.summary || ''
  return {
    schemaVersion: SCHEMA_VERSION,
    sessionId: facts.sessionId,
    workspace: facts.workspace,
    generatedAt: new Date(now).toISOString(),
    status: judged.status === 'timeout' ? 'timeout' : 'completed',
    gatePolicy,
    task: { summary: facts.task.summary, sourceSeq: facts.task.sourceSeq },
    checks: reportChecks,
    overall,
    rework: Array.isArray(judged.data.rework) ? judged.data.rework : [],
    missing,
    meta: {
      summary: downgraded
        ? `${summary}${summary ? '\n\n' : ''}存在缺失判据或 uncertain 检查项，整体降级为 uncertain（不允许无证据判 pass）。`
        : summary,
      durationMs: Date.now() - startedAt,
      fetchedAt: new Date(facts.now).toISOString(),
      eventCount: facts.eventCount,
      evidenceCount: evidence.length,
      probe: 'sessionController.inspect',
      judge: {
        status: judged.status,
        attempts: judged.attempts,
        model: judged.meta && judged.meta.models && judged.meta.models.length > 0 ? judged.meta.models.join(',') : '',
        durationMs: judged.durationMs,
        error: judged.error || '',
        downgraded,
      },
      claude: judged.meta || {},
    },
  }
}

/**
 * Run the whole acceptance for one already-inspected session.
 * @returns {Promise<{report: object, paths: object|null, writeError: string}>}
 */
export async function executeAcceptance({
  sessionId,
  meta,
  events,
  workspace,
  gatePolicy = 'manual',
  runJudge,
  options = {},
  now = Date.now(),
  logger = () => {},
}) {
  const startedAt = Date.now()
  const facts = buildFacts({ sessionId, meta, events, workspace, now })
  const { checks, evidence } = runCheckers(facts, options)
  const judged = await judgeAcceptance({
    facts,
    checks,
    evidence,
    runJudge,
    options: {
      judge: options.judge,
      judgeRetries: options.judgeRetries,
      judgeTimeoutMs: options.judgeTimeoutMs,
      judgeInputMaxChars: options.judgeInputMaxChars,
      opinion: options.opinion || '',
    },
  })

  let report = assemble({ facts, checks, evidence, judged, gatePolicy, startedAt, now })
  try {
    assertValidReport(report)
  } catch (error) {
    logger(`acceptance report invalid, falling back to uncertain: ${error.message}`)
    report = {
      schemaVersion: SCHEMA_VERSION,
      sessionId: facts.sessionId,
      workspace: facts.workspace,
      generatedAt: new Date(now).toISOString(),
      status: 'error',
      gatePolicy,
      task: { summary: facts.task.summary, sourceSeq: facts.task.sourceSeq },
      checks: fallbackChecks(checks, '[报告组装失败，降级为 uncertain]'),
      overall: 'uncertain',
      rework: [],
      missing: [...new Set([...facts.missing, 'report-assembly-failed'])],
      meta: {
        summary: judged.data.summary || '',
        durationMs: Date.now() - startedAt,
        fetchedAt: new Date(facts.now).toISOString(),
        eventCount: facts.eventCount,
        evidenceCount: evidence.length,
        probe: 'sessionController.inspect',
        assemblyError: error.message,
        judge: {
          status: 'error',
          attempts: judged.attempts,
          model: '',
          durationMs: judged.durationMs,
          error: judged.error || error.message,
        },
      },
    }
    assertValidReport(report)
  }

  let paths = null
  let writeError = ''
  try {
    paths = await writeReports(facts.workspace, report, options)
  } catch (error) {
    writeError = error.message
    report.status = 'error'
    report.meta.writeError = writeError
    try {
      paths = await writeReports(facts.workspace, report, options)
    } catch {}
    logger(`acceptance write failed for ${sessionId}: ${writeError}`)
  }
  return { report, paths, writeError }
}
