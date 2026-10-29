/**
 * Host hook: arm a dispatched Session, wait for its Agent to go idle (the
 * available "run finished" signal; DSH has no session-ended event), apply
 * gatePolicy, and run the shared acceptance kernel without ever throwing into
 * the Session lifecycle.
 */
import { executeAcceptance } from './kernel.js'

export const DEFAULT_ACCEPTANCE = {
  gatePolicy: 'ask',
  timeoutMs: 180_000,
  askTimeoutMs: 120_000,
  judgeTimeoutMs: 180_000,
  judgeRetries: 2,
  judgeInputMaxChars: 24_000,
  reportDir: '.dsh/acceptance',
  allowedPaths: [],
}

function settingOf(config, key) {
  const acceptance = config && config.acceptance && typeof config.acceptance === 'object' ? config.acceptance : {}
  return acceptance[key] === undefined ? DEFAULT_ACCEPTANCE[key] : acceptance[key]
}

export function attachAcceptance({ ctx, config = {}, runJudge, logger = () => {} }) {
  const gatePolicy = ['off', 'ask', 'auto'].includes(settingOf(config, 'gatePolicy'))
    ? settingOf(config, 'gatePolicy')
    : 'ask'
  let autoEnabled = gatePolicy !== 'off'
  const timeoutMs = Number(settingOf(config, 'timeoutMs')) || DEFAULT_ACCEPTANCE.timeoutMs
  const askTimeoutMs = Number(settingOf(config, 'askTimeoutMs')) || DEFAULT_ACCEPTANCE.askTimeoutMs
  const judgeTimeoutMs = Math.max(10_000, Number(settingOf(config, 'judgeTimeoutMs')) || DEFAULT_ACCEPTANCE.judgeTimeoutMs)
  const options = {
    reportDir: settingOf(config, 'reportDir'),
    allowedPaths: Array.isArray(settingOf(config, 'allowedPaths')) ? settingOf(config, 'allowedPaths') : [],
    judgeRetries: Number(settingOf(config, 'judgeRetries')),
    judgeTimeoutMs: Math.min(judgeTimeoutMs, Math.max(10_000, timeoutMs - 5_000)),
    judgeInputMaxChars: Number(settingOf(config, 'judgeInputMaxChars')),
  }
  const trackers = new Map()
  const running = new Set()
  const statuses = new Map()
  const skipped = new Set()

  function setStatus(sessionId, patch) {
    const current = statuses.get(sessionId) || { sessionId, gatePolicy }
    const next = { ...current, ...patch }
    statuses.set(sessionId, next)
    return next
  }

  function statusOf(sessionId) {
    const status = statuses.get(sessionId)
    return status ? { ...status } : undefined
  }

  function log(line) {
    try {
      logger(`[claude-on-dsh:acceptance] ${line}`)
    } catch {}
  }

  async function askUser(sessionId) {
    const agent = ctx.agents.get(sessionId)
    if (!agent) {
      log(`ask skipped: no live agent for ${sessionId}`)
      return false
    }
    try {
      const answer = await ctx.userQuestions.ask({
        agent,
        questions: [
          {
            id: 'acceptance',
            header: '自动验收',
            question: '本次会话已结束，是否交给 Claude 做独立验收并生成报告？',
            options: [
              { label: '验收', description: '生成 json + md 验收报告' },
              { label: '跳过', description: '不生成报告' },
            ],
          },
        ],
        signal: AbortSignal.timeout(askTimeoutMs),
      })
      const item = answer && Array.isArray(answer.answers) ? answer.answers[0] : undefined
      const selected = item && Array.isArray(item.selected) ? item.selected : []
      const chosen = selected.includes('验收') || (item && typeof item.custom === 'string' && item.custom.includes('验收'))
      log(`ask result for ${sessionId}: ${chosen ? 'run' : 'skip'}`)
      return chosen
    } catch (error) {
      log(`ask failed for ${sessionId}: ${error.message}`)
      return false
    }
  }

  async function run(sessionId, policy, source) {
    if (running.has(sessionId)) return undefined
    if (!autoEnabled && policy !== 'manual') {
      setStatus(sessionId, { state: 'off', phase: '自动验收已关闭', finishedAt: Date.now() })
      return undefined
    }
    if (policy === 'manual') skipped.delete(sessionId)
    if (policy !== 'manual' && skipped.has(sessionId)) {
      setStatus(sessionId, { state: 'skipped', phase: '已跳过验收', finishedAt: Date.now() })
      return undefined
    }
    if (policy === 'off') {
      log(`off: ${sessionId} not assessed`)
      setStatus(sessionId, { state: 'off', phase: '验收已关闭', finishedAt: Date.now() })
      return undefined
    }
    running.add(sessionId)
    setStatus(sessionId, {
      state: 'running',
      phase: '取证与判定',
      startedAt: Date.now(),
      finishedAt: undefined,
      error: undefined,
      trigger: source,
    })
    try {
      if (policy === 'ask') {
        setStatus(sessionId, { state: 'asking', phase: '等待你选择是否验收' })
        const agreed = await askUser(sessionId)
        if (!agreed || skipped.has(sessionId)) {
          log(`skip: ${sessionId} (${source})`)
          setStatus(sessionId, { state: 'skipped', phase: '已跳过验收', finishedAt: Date.now() })
          return undefined
        }
      }
      const inspected = await ctx.sessionController.inspect(sessionId, AbortSignal.timeout(Math.min(60_000, timeoutMs)))
      const workspace = inspected.meta && inspected.meta.cwd
      if (!workspace) {
        log(`skip: ${sessionId} has no workspace cwd in its header`)
        setStatus(sessionId, {
          state: 'failed',
          phase: '缺少 workspace',
          error: 'session header has no cwd',
          finishedAt: Date.now(),
        })
        return undefined
      }
      setStatus(sessionId, { workspace, phase: 'Claude 正在验收' })
      log(`trigger ${sessionId} policy=${policy} source=${source}`)
      const result = await executeAcceptance({
        sessionId,
        meta: inspected.meta,
        events: inspected.events,
        workspace,
        gatePolicy: policy,
        runJudge,
        options,
        logger: log,
      })
      const report = result.report
      setStatus(sessionId, {
        state: 'completed',
        phase: 'Claude 验收完成',
        finishedAt: Date.now(),
        report,
        workspace,
        paths: result.paths,
        writeError: result.writeError || '',
      })
      injectSummary(sessionId, report, result.paths)
      log(
        `${sessionId} ${report.overall} status=${report.status} judge=${report.meta.judge.status} -> ${
          result.paths ? result.paths.dir : '(not written)'
        }`,
      )
      return result
    } catch (error) {
      log(`failed for ${sessionId}: ${error.message}`)
      setStatus(sessionId, { state: 'failed', phase: '验收失败', error: error.message, finishedAt: Date.now() })
      return undefined
    } finally {
      running.delete(sessionId)
    }
  }

  function injectSummary(sessionId, report, paths) {
    try {
      const agent = ctx.agents.get(sessionId)
      if (!agent || typeof agent.inject !== 'function') return
      const lines = [`[Claude 验收] ${report.overall.toUpperCase()}（${report.status}）`]
      for (const check of report.checks) lines.push(`- ${check.name}: ${check.conclusion}`)
      if (report.missing.length > 0) {
        lines.push(`缺失判据 ${report.missing.length} 项；结论含 uncertain 时以报告为准。`)
      }
      if (paths && paths.mdPath) lines.push(`报告: ${paths.mdPath}`)
      agent.inject({ content: [{ type: 'text', text: lines.join('\n') }], source: { kind: 'claude-on-dsh' } })
    } catch (error) {
      log(`inject summary failed: ${error.message}`)
    }
  }

  function skip(sessionId) {
    if (!sessionId) return
    skipped.add(sessionId)
    setStatus(sessionId, { state: 'skipped', phase: '已跳过验收', finishedAt: Date.now() })
    log(`skip requested: ${sessionId}`)
  }

  function arm(sessionId, info = {}) {
    if (!autoEnabled) {
      log(`off: ${sessionId} armed but automatic acceptance is disabled`)
      setStatus(sessionId, { state: 'off', phase: '自动验收已关闭' })
      return
    }
    if (!sessionId) return
    skipped.delete(sessionId)
    trackers.set(sessionId, { seenRunning: false, started: false, info })
    setStatus(sessionId, {
      state: 'armed',
      phase: '已就绪，等待任务 turn 结束',
      startedAt: Date.now(),
      finishedAt: undefined,
      error: undefined,
      workspace: info.workspace,
      trigger: info.source || 'dispatch',
    })
  }

  function disarm(sessionId) {
    trackers.delete(sessionId)
  }

  const offStatus = ctx.on('agent/status', (payload) => {
    const tracker = payload && payload.agent ? trackers.get(payload.agent.id) : undefined
    if (!tracker) return
    if (payload.status === 'running') {
      tracker.seenRunning = true
      return
    }
    if (payload.status !== 'idle' || !tracker.seenRunning || tracker.started) return
    tracker.started = true
    trackers.delete(payload.agent.id)
    setTimeout(() => {
      run(payload.agent.id, gatePolicy, 'agent-idle').catch(() => {})
    }, 150)
  })

  const offDisposed = ctx.on('agent/disposed', (payload) => {
    const tracker = payload && payload.agent ? trackers.get(payload.agent.id) : undefined
    if (!tracker || tracker.started) return
    tracker.started = true
    trackers.delete(payload.agent.id)
    setTimeout(() => {
      run(payload.agent.id, gatePolicy, 'agent-disposed').catch(() => {})
    }, 150)
  })

  let offCommand = () => {}
  const commands = ctx.get('commands')
  if (commands && typeof commands.register === 'function') {
    offCommand = commands.register({
      name: 'acceptance',
      description: 'Run the Claude on DSH acceptance gate for one session: /acceptance run <sessionId>',
      input: { hint: 'run <sessionId>' },
      handler: async (invocation) => {
        const match = /(session-[A-Za-z0-9-]+)/.exec(invocation.rawInput || '')
        if (!match) return { kind: 'error', text: '用法：/acceptance run <sessionId>' }
        const result = await run(match[1], 'manual', 'command')
        if (!result) return { kind: 'error', text: `验收未完成：${match[1]}` }
        return {
          kind: 'success',
          text: `验收完成：${result.report.overall} (${result.report.status})\n${result.paths ? result.paths.mdPath : '报告未写盘'}`,
        }
      },
    })
  }

  ctx.effect(
    () => () => {
      offStatus()
      offDisposed()
      offCommand()
    },
    'claude-on-dsh: acceptance hook',
  )

  return {
    arm,
    disarm,
    skip,
    runManual: (sessionId) => run(sessionId, 'manual', 'manual'),
    status: statusOf,
    statuses: () => [...statuses.values()].map((status) => ({ ...status })),
    gatePolicy,
    setAuto: (enabled) => {
      autoEnabled = Boolean(enabled)
    },
    dispose: () => {
      offStatus()
      offDisposed()
      offCommand()
    },
  }
}
