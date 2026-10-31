import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'

/**
 * After a dispatched DSH turn goes idle, either hand the review to Claude
 * directly (configured default) or ask the user inside the original DSH
 * conversation. The question is a Host userQuestions.ask card, so it renders
 * in that Session rather than in the plugin panel.
 */
export function attachReviewPrompt({ ctx, getSettings, isOverBudget, runReview, logger = () => {} }) {
  const trackers = new Map()
  const running = new Set()

  function log(line) {
    try {
      logger(`[claude-on-dsh:review] ${line}`)
    } catch {}
  }

  function answerOf(answer) {
    const item = answer && Array.isArray(answer.answers) ? answer.answers[0] : undefined
    const selected = item && Array.isArray(item.selected) ? item.selected : []
    const custom = item && typeof item.custom === 'string' ? item.custom.trim() : ''
    return { selected, custom }
  }

  async function ask(sessionId, questions, timeoutMs = 120_000) {
    const agent = ctx.agents.get(sessionId)
    if (!agent) {
      log(`no live agent for ${sessionId}`)
      return null
    }
    try {
      return await ctx.userQuestions.ask({
        agent,
        questions,
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (error) {
      log(`ask failed for ${sessionId}: ${error.message}`)
      return null
    }
  }

  async function askChoice(sessionId) {
    const answer = await ask(sessionId, [
      {
        id: 'review-choice',
        header: '验收方式',
        question: 'DSH 本轮已完成，接下来怎么验收？',
        options: [
          {
            label: 'Claude 验收意见',
            description: 'Claude 阅读项目与测试记录后，把意见发回 DSH',
          },
          {
            label: '自定义内容',
            description: '你写验收要求，Claude 按此审查',
          },
          { label: '跳过', description: '不做验收' },
        ],
      },
    ])
    const { selected, custom } = answerOf(answer)
    const first = selected[0] || ''
    if (!first) {
      return custom ? { mode: 'claude', custom } : null
    }
    if (first.includes('Claude')) return { mode: 'claude', custom: '' }
    if (first.includes('自定义')) {
      const customAnswer = await ask(sessionId, [
        {
          id: 'review-custom',
          header: '自定义验收要求',
          question: '请输入验收要求（Claude 会按此审查，并把意见发回 DSH）',
        },
      ])
      const typed = answerOf(customAnswer)
      const text = typed.custom || typed.selected[0] || ''
      if (!text.trim()) return null
      return { mode: 'claude', custom: text.trim() }
    }
    return { mode: 'skip' }
  }

  async function review(sessionId, custom = '') {
    if (running.has(sessionId)) return
    running.add(sessionId)
    try {
      const inspected = await ctx.sessionController.inspect(
        sessionId,
        AbortSignal.timeout(60_000),
      )
      const workspace = inspected.meta && inspected.meta.cwd
      if (!workspace || !existsSync(workspace)) {
        log(`no workspace for ${sessionId}`)
        return
      }
      const result = await runReview({
        sessionId,
        meta: inspected.meta,
        events: inspected.events,
        workspace,
        custom,
      })
      const opinion = result && result.opinion ? String(result.opinion).trim() : ''
      if (!opinion) {
        log(`empty opinion for ${sessionId}`)
        return
      }
      const verdict = result.verdict || 'uncertain'
      const evidence = Array.isArray(result.evidence)
        ? result.evidence.filter(Boolean).slice(0, 8)
        : []
      const message = [
        `[Claude 验收意见] ${verdict}`,
        opinion,
        evidence.length ? `关键证据：\n${evidence.map((item) => `- ${item}`).join('\n')}` : '',
      ]
        .filter(Boolean)
        .join('\n\n')
      let live = ctx.sessions.get(sessionId)
      if (!live) {
        try {
          await ctx.sessionController.resolveAgent(sessionId)
          live = ctx.sessions.get(sessionId)
        } catch {}
      }
      if (live) {
        try {
          ctx.permissionPresets.set(live, 'danger-full-access')
        } catch {}
      }
      await ctx.sessionController.prompt(
        {
          sessionId,
          requestId: randomUUID(),
          mode: 'queue',
          content: [{ type: 'text', text: message }],
          clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        AbortSignal.timeout(60_000),
      )
      log(`opinion sent to ${sessionId}: ${verdict}`)
    } catch (error) {
      log(`review failed for ${sessionId}: ${error.message}`)
    } finally {
      running.delete(sessionId)
    }
  }

  async function trigger(sessionId) {
    const settings = getSettings() || {}
    if (!settings.autoPrompt) {
      log('auto prompt is off')
      return
    }
    if (settings.defaultAction === 'claude') {
      if (typeof isOverBudget === 'function' && (await isOverBudget())) {
        log('daily Claude budget reached; automatic review skipped')
        return
      }
      await review(sessionId)
      return
    }
    const choice = await askChoice(sessionId)
    if (!choice || choice.mode === 'skip') {
      log(`skipped ${sessionId}`)
      return
    }
    await review(sessionId, choice.custom || '')
  }

  function arm(sessionId, info = {}) {
    if (!sessionId) return
    trackers.set(sessionId, { seenRunning: false, started: false, info })
    log(`armed ${sessionId}`)
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
      trigger(payload.agent.id).catch((error) => log(`trigger failed: ${error.message}`))
    }, 300)
  })

  const offDisposed = ctx.on('agent/disposed', (payload) => {
    const tracker = payload && payload.agent ? trackers.get(payload.agent.id) : undefined
    if (!tracker || tracker.started) return
    tracker.started = true
    trackers.delete(payload.agent.id)
  })

  ctx.effect(
    () => () => {
      offStatus()
      offDisposed()
    },
    'claude-on-dsh: review prompt',
  )

  return { arm, disarm, trigger }
}
