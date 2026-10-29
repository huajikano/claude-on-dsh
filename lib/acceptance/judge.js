/**
 * Claude adjudication: build a bounded evidence packet, require a structured
 * verdict, validate it, retry on invalid output, then degrade to the machine
 * checkers (overall uncertain) instead of inventing a pass.
 */
import { clip, CONCLUSIONS } from './contract.js'

export const JUDGE_SCHEMA = {
  type: 'object',
  properties: {
    overall: { enum: ['pass', 'fail', 'uncertain'] },
    summary: { type: 'string' },
    checks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          conclusion: { enum: ['pass', 'fail', 'uncertain'] },
          evidenceIds: { type: 'array', items: { type: 'string' } },
          note: { type: 'string' },
        },
        required: ['id', 'conclusion', 'evidenceIds', 'note'],
        additionalProperties: false,
      },
    },
    rework: { type: 'array', items: { type: 'string' } },
    missing: { type: 'array', items: { type: 'string' } },
  },
  required: ['overall', 'summary', 'checks', 'rework', 'missing'],
  additionalProperties: false,
}

export const JUDGE_SYSTEM = [
  '你是独立验收员，不参与实现，也不采信执行代理的自我汇报。',
  '只依据给定的任务、证据表、机器检查结论做判断；每条 pass/fail 必须引用至少一个证据 id。',
  '证据不足时判 uncertain，禁止猜测。',
  '输出简体中文，严格符合给定 JSON Schema。',
].join('\n')

export function buildJudgePrompt({ facts, checks, evidence, maxChars = 24_000, opinion = '' }) {
  const evidenceById = new Map(evidence.map((item) => [item.id, item]))
  const packet = {
    task: facts.task.summary,
    opinion,
    workspace: facts.workspace,
    changedFiles: facts.changedFiles.slice(0, 30).map((file) => ({ path: file.path, status: file.status, source: file.source })),
    commands: facts.commands
      .filter((command) => command.kind === 'verification')
      .slice(-8)
      .map((command) => ({
        command: clip(command.command, 200),
        isError: command.isError,
        summary: clip(command.summary || command.outputTail || command.output, 700),
      })),
    machineChecks: checks.map((check) => ({
      id: check.id,
      name: check.name,
      machineConclusion: check.conclusion,
      evidenceIds: check.evidence.map((item) => item.id),
      note: check.note,
    })),
    evidence: evidence.slice(0, 50).map((item) => ({
      id: item.id,
      type: item.type,
      locator: item.locator,
      path: item.path,
      command: item.command,
      excerpt: clip(item.excerpt, 320),
    })),
    missing: facts.missing,
  }
  let serialized = JSON.stringify(packet, null, 2)
  if (serialized.length > maxChars) {
    packet.evidence = packet.evidence.slice(0, 24)
    packet.commands = packet.commands.slice(-4)
    serialized = JSON.stringify(packet, null, 2)
  }
  if (serialized.length > maxChars) serialized = serialized.slice(0, maxChars)
  return [
    '请验收下面这次 DSH 会话。任务、证据和机器检查都来自会话日志与 workspace 的 git 状态。',
    opinion ? `用户验收意见（必须优先对照）：${clip(opinion, 2000)}` : '用户未提供额外验收意见。',
    '',
    '要求：',
    '1. 逐项复核 machineChecks，返回相同 id；结论只能是 pass / fail / uncertain。',
    '2. 每条 pass/fail 的 evidenceIds 必须非空，且只能引用 evidence 表中存在的 id。',
    '3. overall 与 checks 必须一致：有 fail 项不能 overall=pass；全部 pass 才能 overall=pass；证据不足用 uncertain。',
    '4. rework 给出失败项的返工建议（没有就空数组）；missing 列出取不到的判据。',
    '5. 不要输出 JSON 以外的文字。',
    '',
    '输入：',
    serialized,
  ].join('\n')
}

export function validateJudgeOutput(data, checks, evidence) {
  const errors = []
  if (!data || typeof data !== 'object') return ['judge output is not an object']
  if (!CONCLUSIONS.includes(data.overall)) errors.push(`overall invalid: ${data.overall}`)
  if (typeof data.summary !== 'string') errors.push('summary must be a string')
  if (!Array.isArray(data.checks)) errors.push('checks must be an array')
  if (!Array.isArray(data.rework)) errors.push('rework must be an array')
  if (!Array.isArray(data.missing)) errors.push('missing must be an array')
  const evidenceIds = new Set(evidence.map((item) => item.id))
  const machineIds = new Set(checks.map((check) => check.id))
  const seen = new Set()
  let cited = 0
  const conclusions = []
  if (Array.isArray(data.checks)) {
    for (const check of data.checks) {
      if (!check || typeof check !== 'object') {
        errors.push('judge check must be an object')
        continue
      }
      if (!machineIds.has(check.id)) errors.push(`judge check unknown id: ${check.id}`)
      else if (seen.has(check.id)) errors.push(`judge check duplicate id: ${check.id}`)
      else seen.add(check.id)
      if (!CONCLUSIONS.includes(check.conclusion)) errors.push(`judge check ${check.id} conclusion invalid`)
      conclusions.push(check.conclusion)
      if (typeof check.note !== 'string') errors.push(`judge check ${check.id} note must be a string`)
      if (!Array.isArray(check.evidenceIds)) {
        errors.push(`judge check ${check.id} evidenceIds must be an array`)
        continue
      }
      for (const id of check.evidenceIds) {
        if (!evidenceIds.has(id)) errors.push(`judge check ${check.id} cites unknown evidence ${id}`)
        else cited += 1
      }
      if ((check.conclusion === 'pass' || check.conclusion === 'fail') && check.evidenceIds.length === 0) {
        errors.push(`judge check ${check.id} is ${check.conclusion} without evidence`)
      }
    }
  }
  for (const id of machineIds) if (!seen.has(id)) errors.push(`judge output missing check ${id}`)
  if (conclusions.includes('fail') && data.overall === 'pass') errors.push('overall pass contradicts a failed check')
  if (data.overall === 'fail' && !conclusions.includes('fail')) errors.push('overall fail requires a failed check')
  if (data.overall === 'pass' && cited === 0) errors.push('overall pass requires cited evidence')
  return errors
}

export function machineOverall(checks) {
  if (checks.some((check) => check.conclusion === 'fail')) return 'fail'
  if (checks.every((check) => check.conclusion === 'pass')) return 'pass'
  return 'uncertain'
}

export function degradeVerdict(checks, error) {
  const degradedChecks = checks.map((check) => ({
    id: check.id,
    conclusion: check.id === 'goal-response' ? 'uncertain' : check.conclusion,
    evidenceIds: check.evidence.map((item) => item.id),
    note: `${check.note} [Claude 判定不可用，保留机器结论]`,
  }))
  return {
    overall: 'uncertain',
    summary: `Claude 判定不可用，报告降级：${error}`,
    checks: degradedChecks,
    rework: [],
    missing: ['judge-unavailable'],
  }
}

/**
 * Run the judge with bounded retries and a hard timeout.
 * @returns {{ status: 'completed'|'degraded'|'timeout'|'error'|'skipped', data: object, attempts: number, durationMs: number, error: string, meta: object }}
 */
export async function judgeAcceptance({ facts, checks, evidence, runJudge, options = {} }) {
  const started = Date.now()
  const attemptsAllowed = Math.max(0, Number(options.judgeRetries ?? 2)) + 1
  const timeoutMs = Math.max(10_000, Number(options.judgeTimeoutMs ?? 180_000))
  const maxChars = Math.max(4_000, Number(options.judgeInputMaxChars ?? 24_000))
  const skip = options.judge === false || options.skipJudge === true
  if (skip) {
    return {
      status: 'skipped',
      data: degradeVerdict(checks, 'judge disabled'),
      attempts: 0,
      durationMs: 0,
      error: '',
      meta: {},
    }
  }
  let lastError = ''
  for (let attempt = 1; attempt <= attemptsAllowed; attempt += 1) {
    let timer
    try {
      const prompt = buildJudgePrompt({ facts, checks, evidence, maxChars, opinion: options.opinion })
      const run = await Promise.race([
        runJudge({ prompt, schema: JUDGE_SCHEMA, systemPrompt: JUDGE_SYSTEM, cwd: facts.workspace, timeoutMs }),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(Object.assign(new Error('judge timeout'), { code: 'JUDGE_TIMEOUT' })), timeoutMs + 5_000)
        }),
      ])
      clearTimeout(timer)
      const data = run && run.data ? run.data : run
      const errors = validateJudgeOutput(data, checks, evidence)
      if (errors.length === 0) {
        return {
          status: 'completed',
          data,
          attempts: attempt,
          durationMs: Date.now() - started,
          error: '',
          meta: (run && run.meta) || {},
        }
      }
      lastError = errors.join('; ')
    } catch (error) {
      clearTimeout(timer)
      lastError = error && error.message ? error.message : String(error)
      if (error && error.code === 'JUDGE_TIMEOUT') {
        return {
          status: 'timeout',
          data: degradeVerdict(checks, 'judge timeout'),
          attempts: attempt,
          durationMs: Date.now() - started,
          error: lastError,
          meta: {},
        }
      }
    }
  }
  return {
    status: 'degraded',
    data: degradeVerdict(checks, lastError || 'invalid judge output'),
    attempts: attemptsAllowed,
    durationMs: Date.now() - started,
    error: lastError,
    meta: {},
  }
}
