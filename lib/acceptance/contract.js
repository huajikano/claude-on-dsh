/**
 * AcceptanceReport contract: structural validation, redaction, and clipping.
 * The JSON Schema in report-schema.json is the documented shape; this module
 * enforces the rules a JSON Schema alone cannot: every pass/fail check needs a
 * locatable evidence item, and a report cannot claim pass while a check failed.
 */

export const SCHEMA_VERSION = '1.0'
export const CONCLUSIONS = ['pass', 'fail', 'uncertain']
export const STATUSES = ['completed', 'timeout', 'error']
export const GATE_POLICIES = ['off', 'ask', 'auto', 'manual']
export const EVIDENCE_TYPES = ['file', 'command', 'test', 'event']

const SECRET_PATTERNS = [
  /gh[pousr]_[A-Za-z0-9]{20,}/g,
  /github_pat_[A-Za-z0-9_]{20,}/g,
  /sk-[A-Za-z0-9_-]{16,}/g,
  /AKIA[0-9A-Z]{16}/g,
  /Bearer\s+[A-Za-z0-9._~+/-]+=*/gi,
  /(?:ANTHROPIC|OPENAI|DEEPSEEK|GITHUB)_[A-Z_]*(?:KEY|TOKEN)\s*[=:]\s*\S+/gi,
]

export function redact(value) {
  let text = typeof value === 'string' ? value : String(value ?? '')
  for (const pattern of SECRET_PATTERNS) text = text.replace(pattern, '[REDACTED]')
  return text
}

export function clip(value, max = 600) {
  const text = redact(value)
  return text.length > max ? `${text.slice(0, max)}…(${text.length} chars)` : text
}

export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isString(value) {
  return typeof value === 'string' && value.length > 0
}

export function validateEvidence(evidence) {
  const errors = []
  if (!isPlainObject(evidence)) return ['evidence must be an object']
  if (!isString(evidence.id)) errors.push('evidence.id must be a non-empty string')
  if (!EVIDENCE_TYPES.includes(evidence.type)) errors.push(`evidence.type invalid: ${evidence.type}`)
  if (!isString(evidence.locator)) errors.push('evidence.locator must be a non-empty string')
  if (typeof evidence.excerpt !== 'string') errors.push('evidence.excerpt must be a string')
  if (evidence.path !== undefined && typeof evidence.path !== 'string') errors.push('evidence.path must be a string')
  if (evidence.command !== undefined && typeof evidence.command !== 'string') errors.push('evidence.command must be a string')
  if (evidence.lines !== undefined) {
    if (!Array.isArray(evidence.lines) || evidence.lines.length !== 2) errors.push('evidence.lines must be [start, end]')
    else if (!evidence.lines.every((line) => Number.isInteger(line) && line >= 1)) errors.push('evidence.lines must be positive integers')
    else if (evidence.lines[0] > evidence.lines[1]) errors.push('evidence.lines start must not exceed end')
  }
  if (evidence.type === 'file' && !isString(evidence.path)) errors.push('file evidence needs path')
  if ((evidence.type === 'command' || evidence.type === 'test') && !isString(evidence.command)) {
    errors.push(`${evidence.type} evidence needs command`)
  }
  return errors
}

/**
 * Validate one AcceptanceReport.
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateReport(report) {
  const errors = []
  if (!isPlainObject(report)) return { ok: false, errors: ['report must be an object'] }
  if (report.schemaVersion !== SCHEMA_VERSION) errors.push(`schemaVersion must be ${SCHEMA_VERSION}`)
  for (const key of ['sessionId', 'workspace', 'generatedAt']) {
    if (!isString(report[key])) errors.push(`${key} must be a non-empty string`)
  }
  if (!STATUSES.includes(report.status)) errors.push(`status invalid: ${report.status}`)
  if (!GATE_POLICIES.includes(report.gatePolicy)) errors.push(`gatePolicy invalid: ${report.gatePolicy}`)
  if (!isPlainObject(report.task)) errors.push('task must be an object')
  else {
    if (typeof report.task.summary !== 'string') errors.push('task.summary must be a string')
    if (report.task.sourceSeq !== null && !Number.isInteger(report.task.sourceSeq)) errors.push('task.sourceSeq must be integer or null')
  }
  if (!Array.isArray(report.checks) || report.checks.length === 0) errors.push('checks must be a non-empty array')

  const evidenceIds = new Set()
  const seenEvidence = new Map()
  let totalEvidence = 0
  const checkConclusions = []
  if (Array.isArray(report.checks)) {
    const seen = new Set()
    for (const check of report.checks) {
      if (!isPlainObject(check)) {
        errors.push('check must be an object')
        continue
      }
      if (!isString(check.id)) errors.push('check.id must be a non-empty string')
      else if (seen.has(check.id)) errors.push(`duplicate check id: ${check.id}`)
      else seen.add(check.id)
      if (!isString(check.name)) errors.push(`check ${check.id} needs name`)
      if (!CONCLUSIONS.includes(check.conclusion)) errors.push(`check ${check.id} conclusion invalid`)
      if (typeof check.note !== 'string') errors.push(`check ${check.id} note must be a string`)
      if (!Array.isArray(check.evidence)) {
        errors.push(`check ${check.id} evidence must be an array`)
        continue
      }
      if (check.conclusion !== 'uncertain' && check.evidence.length === 0) {
        errors.push(`check ${check.id} is ${check.conclusion} without evidence`)
      }
      checkConclusions.push(check.conclusion)
      for (const item of check.evidence) {
        const itemErrors = validateEvidence(item)
        errors.push(...itemErrors.map((message) => `check ${check.id}: ${message}`))
        if (isString(item && item.id)) {
          const previous = seenEvidence.get(item.id)
          if (previous !== undefined) {
            // The same locatable item may be cited by more than one check; a
            // reused id with different content is ambiguous and rejected.
            if (JSON.stringify(previous) !== JSON.stringify(item)) {
              errors.push(`conflicting evidence id: ${item.id}`)
            }
          } else {
            seenEvidence.set(item.id, item)
            evidenceIds.add(item.id)
            totalEvidence += 1
          }
        }
      }
    }
  }

  if (!CONCLUSIONS.includes(report.overall)) errors.push(`overall invalid: ${report.overall}`)
  if (report.overall === 'pass') {
    if (checkConclusions.includes('fail')) errors.push('overall pass contradicts a failed check')
    if (totalEvidence === 0) errors.push('overall pass requires evidence')
  }
  if (report.overall === 'fail' && !checkConclusions.includes('fail')) {
    errors.push('overall fail requires at least one failed check')
  }
  if (!Array.isArray(report.rework)) errors.push('rework must be an array')
  else if (report.rework.some((item) => typeof item !== 'string')) errors.push('rework items must be strings')
  if (!Array.isArray(report.missing)) errors.push('missing must be an array')
  else if (report.missing.some((item) => typeof item !== 'string')) errors.push('missing items must be strings')

  if (!isPlainObject(report.meta)) errors.push('meta must be an object')
  else {
    if (typeof report.meta.durationMs !== 'number' || !Number.isFinite(report.meta.durationMs)) {
      errors.push('meta.durationMs must be a finite number')
    }
    if (!isPlainObject(report.meta.judge)) errors.push('meta.judge must be an object')
    else if (!['completed', 'degraded', 'timeout', 'error', 'skipped'].includes(report.meta.judge.status)) {
      errors.push(`meta.judge.status invalid: ${report.meta.judge.status}`)
    }
  }

  return { ok: errors.length === 0, errors }
}

export function assertValidReport(report) {
  const result = validateReport(report)
  if (!result.ok) {
    const error = new Error(`AcceptanceReport validation failed: ${result.errors.join('; ')}`)
    error.code = 'ACCEPTANCE_INVALID_REPORT'
    error.errors = result.errors
    throw error
  }
  return report
}
