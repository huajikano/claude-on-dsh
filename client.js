window.__ModuleLoader__.load({
  id: 'claude-on-dsh',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useMemo, useRef, useState } = React

    /** Dictionary namespace owned by this plugin. */
    const NS = 'claude-on-dsh'
    /** The id shared by the sidebar entry and the main panel it opens. */
    const PANEL_ID = 'claude-on-dsh'
    const API = '/api/claude-on-dsh'

    /* ------------------------------------------------------------------ */
    /* copy                                                                */
    /* ------------------------------------------------------------------ */

    const DICT = {
      zh: {
        nav: 'Claude on DSH',
        title: 'Claude on DSH',
        subtitle: 'Claude 负责首问与规划，DSH 接手执行整案。',
        stepSetup: '项目设定',
        stepAsk: 'Claude 首问',
        stepHandoff: '交给 DSH',
        engine: '指挥引擎',
        engineCli: 'Claude Code CLI',
        engineCliHint: '自动提问与规划',
        engineDesktop: '桌面版 · 人工接管',
        engineDesktopHint: '你与 Claude 对话',
        projectDir: '项目目录',
        projectDirHint: '必须是已存在的文件夹，DSH 会话在这里运行',
        projectDirPlaceholder: 'D:\\XiangMu\\我的新项目',
        browse: '选择',
        projectName: '项目名称',
        projectNamePlaceholder: '留空则使用目录名',
        goal: '项目目标',
        goalPlaceholder: '例如：做一个极简的番茄钟网页，支持任务清单与本地存储，手机端可用。',
        permissionMode: 'CLI 权限模式',
        modePlan: 'plan · 只读规划',
        modeAsk: 'dontAsk · 不提问',
        modeEdits: 'acceptEdits · 允许改文件',
        startBrief: '让 Claude 提出首问',
        starting: 'Claude 正在思考',
        cancel: '取消',
        reset: '重新开始',
        statusCli: 'Claude Code',
        statusDesktop: '桌面版',
        statusProxy: 'CC Switch 代理',
        statusCcSwitch: 'CC Switch',
        understand: 'Claude 的理解',
        openingQuestion: 'Claude 的首问',
        planOutline: '初步计划',
        acceptanceCriteria: '验收标准',
        risks: '风险',
        answer: '你的回答',
        answerPlaceholder: '回答上面这个问题，或直接点选候选答案。',
        refine: '生成交接书',
        refining: 'Claude 正在定稿',
        handoff: '发给 DSH 的任务书',
        handoffHint: '可以直接修改；DSH 会把它作为会话的第一条任务。',
        dispatch: '派发给 DSH 执行',
        dispatching: '正在创建 DSH 会话',
        permissionLabel: '会话权限',
        fullAccess: '完全权限（danger-full-access）',
        permissionFallback: '完全权限切换失败，已退回仅关闭审批',
        acceptance: 'Claude 验收',
        acceptanceHint: '显示本次任务的验收进度、结论与证据；自动触发需要开启 legacyGate，手动验收随时可用。',
        acceptanceState: '状态',
        acceptanceRun: '立即验收',
        acceptanceSkip: '跳过验收',
        acceptanceRefresh: '刷新',
        reviewTitle: 'Claude 直接验收（终端可见）',
        reviewHint: '在项目目录打开一个 Claude Code 终端，由 Claude 直接检查改动、运行测试并写报告；不会经过 DSH 的隐藏验收，也不会自动派发。',
        reviewFocus: '验收重点 / 任务背景',
        reviewSession: '验收对象（该目录的派发记录）',
        reviewSessionAuto: '自动：该目录最近一次派发',
        reviewOpen: '打开终端让 Claude 验收',
        reviewOpened: '已打开 Claude 验收终端',
        reviewPath: '报告将写入',
        acceptanceShow: '显示验收',
        autoAcceptanceToggle: '自动验收（legacyGate）',
        dshAccept: '交给 DSH 验收',
        acceptanceCostWarn: '验收会消耗额度；只有点「开始验收」才会执行。',
        acceptanceModeClaude: 'Claude 直接验收',
        acceptanceModeDsh: '交给 DSH 验收',
        acceptanceOpinion: '验收意见（可选）',
        acceptanceOpinionPlaceholder: '例如：重点检查移动端、不要改样式；只看本次改动。',
        acceptanceStart: '开始验收',
        acceptanceCancel: '取消',
        acceptanceDone: '验收完成',
        firstQuestion: '首问',
        chooseSession: '选择会话',
        firstQuestionHint: 'Claude 会读取该对话与项目，然后把首问发回这个对话；点「发送首问」才会消耗额度。',
        firstQuestionRequirement: '新要求',
        firstQuestionPlaceholder: '例如：在现有流程上增加并行分支，保持旧数据不丢。',
        firstQuestionSend: '发送首问',
        firstQuestionRequired: '请填写新要求',
        firstQuestionDone: '首问已发回该对话',
        firstQuestionOther: '选择其他对话（可选）',
        firstQuestionGenerate: '生成首问',
        firstQuestionAnswer: '你的回答',
        firstQuestionAnswerPlaceholder: '回答 Claude 的首问，或点选上面的候选答案。',
        firstQuestionAnswerRequired: '请先回答 Claude 的首问',
        firstQuestionSendToDsh: '发送给 DSH',
        firstQuestionBusy: '正在读取对话并生成首问…',
        existingPick: '选择一个已有对话…',
        dshAcceptOpened: '已把验收任务发回原 DSH 会话',
        reviewPickSession: '请先选择验收对象（该项目的首问会话）',
        acceptanceNoSession: '还没有可验收的会话。',
        acceptanceArmed: '已就绪，等待任务 turn 结束',
        acceptanceAsk: '等待你在会话中选择「验收」',
        acceptanceRunning: 'Claude 验收中…',
        acceptanceCompleted: 'Claude 验收完成',
        acceptanceSkipped: '已跳过验收',
        acceptanceFailed: '验收失败',
        acceptanceIdle: '尚未验收',
        acceptanceOff: '自动验收已关闭',
        acceptanceEvidence: '证据',
        acceptanceMissing: '缺失判据',
        acceptanceRework: '返工建议',
        acceptanceReport: '报告路径',
        acceptanceRecent: '最近验收',
        gatePolicy: '策略',
        dispatched: '已派发，DSH 开始执行',
        openSession: '打开会话',
        newProject: '再开一个项目',
        emptyTitle: '从一个目标开始',
        emptyBody: '写入项目目标，Claude 会先提出一个决定方案走向的问题；你回答后，它会生成完整交接书，再由 DSH 执行。',
        desktopTitle: '桌面版人工接管',
        desktopBody: '生成指令并复制到剪贴板，Claude 桌面版会用 CC Switch 的配置启动。把 Claude 的回复粘贴回来，即可继续派发。',
        openDesktop: '生成指令并打开桌面版',
        desktopPrompt: '发给桌面版的指令',
        desktopReply: 'Claude 桌面版的回复',
        desktopReplyPlaceholder: '把桌面版里 Claude 的完整回复粘贴到这里',
        desktopContinue: '用这段回复生成交接书',
        copy: '复制',
        copied: '已复制到剪贴板',
        copyFailed: '无法写入剪贴板，请手动复制指令框内容。',
        openCcSwitch: '打开 CC Switch',
        switchToCli: '改用 CLI 自动生成',
        switchToDesktop: '改用桌面版',
        errorTitle: '出错了',
        retry: '重试',
        history: '派发记录',
        historyEmpty: '还没有派发记录。',
        cost: '花费',
        duration: '耗时',
        turns: '轮次',
        requiredGoal: '请先填写项目目标。',
        requiredDir: '请先选择项目目录。',
        requiredAnswer: '请先回答首问。',
        requiredPrompt: '交接书不能为空。',
        cancelled: '已取消',
        loading: '正在读取本机环境…',
        detectionFailed: '无法读取本机环境',
        cliMissing: '未找到可用的 Claude Code CLI',
        desktopMissing: '未找到 Claude 桌面版',
        proxyHint: '代理未连接：先打开 CC Switch，再重试。',
        openFailed: '打开失败',
        archive: '归档会话',
        archived: '会话已归档',
        chars: '字',
        advanced: '高级',
        draft: '交接草稿',
        answerHint: '回答会直接影响计划与验收标准。',
        desktopNoReply: '请先粘贴桌面版的回复。',
        historyOpen: '打开',
        noHistorySession: '无会话',
      },
      en: {
        nav: 'Claude on DSH',
        title: 'Claude on DSH',
        subtitle: 'Claude asks the opening question and plans; DSH executes the whole project.',
        stepSetup: 'Project',
        stepAsk: 'Claude asks',
        stepHandoff: 'Hand off to DSH',
        engine: 'Commander engine',
        engineCli: 'Claude Code CLI',
        engineCliHint: 'Automated question and plan',
        engineDesktop: 'Desktop · manual',
        engineDesktopHint: 'You talk to Claude',
        projectDir: 'Project folder',
        projectDirHint: 'Must already exist; the DSH session runs here',
        projectDirPlaceholder: 'D:\\Projects\\my-new-project',
        browse: 'Browse',
        projectName: 'Project name',
        projectNamePlaceholder: 'Empty uses the folder name',
        goal: 'Project goal',
        goalPlaceholder: 'e.g. a minimal pomodoro web app with task list and local storage, usable on mobile.',
        permissionMode: 'CLI permission mode',
        modePlan: 'plan · read-only planning',
        modeAsk: 'dontAsk · never prompt',
        modeEdits: 'acceptEdits · allow edits',
        startBrief: 'Ask Claude for the opening question',
        starting: 'Claude is thinking',
        cancel: 'Cancel',
        reset: 'Start over',
        statusCli: 'Claude Code',
        statusDesktop: 'Desktop',
        statusProxy: 'CC Switch proxy',
        statusCcSwitch: 'CC Switch',
        understand: "Claude's understanding",
        openingQuestion: "Claude's opening question",
        planOutline: 'Draft plan',
        acceptanceCriteria: 'Acceptance criteria',
        risks: 'Risks',
        answer: 'Your answer',
        answerPlaceholder: 'Answer the question, or pick one of the options.',
        refine: 'Generate handoff',
        refining: 'Claude is finalizing',
        handoff: 'Task brief for DSH',
        handoffHint: 'Editable; DSH receives it as the first task of the session.',
        dispatch: 'Dispatch to DSH',
        dispatching: 'Creating the DSH session',
        permissionLabel: 'Session permission',
        fullAccess: 'Full access (danger-full-access)',
        permissionFallback: 'Could not switch to full access; approvals were disabled only',
        acceptance: 'Claude acceptance',
        acceptanceHint: 'Shows this task\'s acceptance progress, verdict, and evidence. Automatic runs need legacyGate; manual runs are always available.',
        acceptanceState: 'State',
        acceptanceRun: 'Run acceptance',
        acceptanceSkip: 'Skip acceptance',
        acceptanceRefresh: 'Refresh',
        reviewTitle: 'Direct Claude review (visible terminal)',
        reviewHint: 'Open a Claude Code terminal in the project; Claude inspects changes, runs tests, and writes a report. No hidden DSH acceptance and no dispatch.',
        reviewFocus: 'Review focus / task context',
        reviewSession: 'Session to review (dispatch for this folder)',
        reviewSessionAuto: 'Auto: latest dispatch in this folder',
        reviewOpen: 'Open terminal and let Claude review',
        reviewOpened: 'Claude review terminal opened',
        reviewPath: 'Report will be written to',
        acceptanceShow: 'Show acceptance',
        autoAcceptanceToggle: 'Auto acceptance (legacyGate)',
        dshAccept: 'Hand off to DSH for acceptance',
        acceptanceCostWarn: 'Acceptance spends credits; it starts only when you click Start.',
        acceptanceModeClaude: 'Claude reviews directly',
        acceptanceModeDsh: 'Hand off to DSH',
        acceptanceOpinion: 'Acceptance notes (optional)',
        acceptanceOpinionPlaceholder: 'e.g. focus on mobile, do not change styles, only this change.',
        acceptanceStart: 'Start acceptance',
        acceptanceCancel: 'Cancel',
        acceptanceDone: 'Acceptance complete',
        firstQuestion: 'First question',
        chooseSession: 'Choose conversation',
        firstQuestionHint: 'Claude reads this conversation and project, then posts its first question back here. Credits are spent only when you send.',
        firstQuestionRequirement: 'New requirement',
        firstQuestionPlaceholder: 'e.g. add parallel branches to the existing flow without losing old data.',
        firstQuestionSend: 'Send first question',
        firstQuestionRequired: 'Enter a requirement',
        firstQuestionDone: 'First question sent to the conversation',
        firstQuestionOther: 'Choose another conversation (optional)',
        firstQuestionGenerate: 'Generate first question',
        firstQuestionAnswer: 'Your answer',
        firstQuestionAnswerPlaceholder: 'Answer Claude’s question, or pick a choice above.',
        firstQuestionAnswerRequired: 'Answer the first question first',
        firstQuestionSendToDsh: 'Send to DSH',
        firstQuestionBusy: 'Reading the conversation and drafting the first question…',
        existingPick: 'Choose an existing conversation…',
        dshAcceptOpened: 'Acceptance task sent back to the original DSH session',
        reviewPickSession: 'Choose the original first-question session first',
        acceptanceNoSession: 'No dispatch to assess yet.',
        acceptanceArmed: 'Armed; waiting for the task turn to finish',
        acceptanceAsk: 'Waiting for your choice in the session',
        acceptanceRunning: 'Claude is assessing…',
        acceptanceCompleted: 'Claude acceptance completed',
        acceptanceSkipped: 'Acceptance skipped',
        acceptanceFailed: 'Acceptance failed',
        acceptanceIdle: 'Not assessed yet',
        acceptanceOff: 'Automatic acceptance is off',
        acceptanceEvidence: 'Evidence',
        acceptanceMissing: 'Missing facts',
        acceptanceRework: 'Rework',
        acceptanceReport: 'Report path',
        acceptanceRecent: 'Recent assessments',
        gatePolicy: 'Policy',
        dispatched: 'Dispatched; DSH is executing',
        openSession: 'Open session',
        newProject: 'Start another project',
        emptyTitle: 'Start from a goal',
        emptyBody: 'Describe the goal. Claude asks the one question that changes the plan, then writes the handoff that DSH executes.',
        desktopTitle: 'Desktop handoff',
        desktopBody: 'Generate the brief, copy it, and open Claude Desktop (it uses the CC Switch configuration). Paste Claude\'s reply back to continue.',
        openDesktop: 'Generate brief and open desktop',
        desktopPrompt: 'Brief for the desktop app',
        desktopReply: "Claude Desktop's reply",
        desktopReplyPlaceholder: "Paste Claude's full reply here",
        desktopContinue: 'Use this reply as the handoff',
        copy: 'Copy',
        copied: 'Copied to clipboard',
        copyFailed: 'Could not write to the clipboard; copy the brief manually.',
        openCcSwitch: 'Open CC Switch',
        switchToCli: 'Use the CLI instead',
        switchToDesktop: 'Use the desktop app',
        errorTitle: 'Something went wrong',
        retry: 'Retry',
        history: 'Dispatches',
        historyEmpty: 'No dispatches yet.',
        cost: 'cost',
        duration: 'time',
        turns: 'turns',
        requiredGoal: 'Describe the project goal first.',
        requiredDir: 'Choose the project folder first.',
        requiredAnswer: 'Answer the opening question first.',
        requiredPrompt: 'The task brief is empty.',
        cancelled: 'Cancelled',
        loading: 'Reading the local environment…',
        detectionFailed: 'Cannot read the local environment',
        cliMissing: 'No usable Claude Code CLI found',
        desktopMissing: 'Claude Desktop not found',
        proxyHint: 'Proxy is not reachable: open CC Switch, then retry.',
        openFailed: 'Failed to open',
        archive: 'Archive session',
        archived: 'Session archived',
        chars: 'chars',
        advanced: 'Advanced',
        draft: 'Handoff draft',
        answerHint: 'Your answer directly shapes the plan and acceptance criteria.',
        desktopNoReply: 'Paste the desktop reply first.',
        historyOpen: 'Open',
        noHistorySession: 'no session',
      },
    }

    /* ------------------------------------------------------------------ */
    /* transport                                                           */
    /* ------------------------------------------------------------------ */

    const DEFAULT_REQUEST_TIMEOUT_MS = 20_000

    function timeoutSignal(ms) {
      if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        return AbortSignal.timeout(ms)
      }
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), ms)
      if (timer && typeof timer.unref === 'function') timer.unref()
      return controller.signal
    }

    async function request(pathname, options = {}) {
      const { timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS, signal, ...fetchOptions } = options || {}
      const url = new URL(`${API}${pathname}`, window.location.origin)
      let response
      try {
        response = await fetch(url, {
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          signal: signal || timeoutSignal(timeoutMs),
          ...fetchOptions,
        })
      } catch (error) {
        if (error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
          const timeout = new Error(`请求超时（${Math.round(timeoutMs / 1000)} 秒）`)
          timeout.hint = 'Host 可能仍在处理；稍后刷新状态或重试。'
          throw timeout
        }
        throw error
      }
      const raw = await response.text()
      let data = null
      try {
        data = raw ? JSON.parse(raw) : null
      } catch {
        data = null
      }
      if (!response.ok) {
        const message = (data && data.error && data.error.message) || `HTTP ${response.status}`
        const error = new Error(message)
        error.hint = (data && data.error && data.error.hint) || ''
        throw error
      }
      return data
    }

    function withHeader(title, body) {
      const name = title || '新项目'
      return `# 项目交接：${name}\n\n> Claude on DSH 已完成首问与规划，以下是交给 DSH 的执行任务书。\n\n${body}`.trim()
    }

    function shortVersion(value) {
      const raw = typeof value === 'string' ? value.trim() : ''
      const match = raw.match(/\d+(?:\.\d+)+/)
      return match ? match[0] : raw.slice(0, 18)
    }

    function formatDuration(ms) {
      if (typeof ms !== 'number' || !Number.isFinite(ms) || ms <= 0) return ''
      if (ms < 1000) return `${Math.round(ms)} ms`
      const seconds = ms / 1000
      if (seconds < 60) return `${seconds.toFixed(1)} s`
      return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
    }

    function formatMoney(value) {
      if (typeof value !== 'number' || !Number.isFinite(value)) return ''
      return `$${value.toFixed(value >= 1 ? 2 : 3)}`
    }

    function timeText(ms) {
      if (typeof ms !== 'number' || !Number.isFinite(ms) || ms <= 0) return ''
      try {
        return new Date(ms).toLocaleString()
      } catch {
        return ''
      }
    }

    /* ------------------------------------------------------------------ */
    /* primitives                                                          */
    /* ------------------------------------------------------------------ */

    function Sparkle({ size = 24 }) {
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 64 64',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg',
          'aria-hidden': 'true',
        },
        h('path', {
          d: 'M32 6c1.6 9.7 6.3 14.4 16 16-9.7 1.6-14.4 6.3-16 16-1.6-9.7-6.3-14.4-16-16 9.7-1.6 14.4-6.3 16-16Z',
          fill: '#D97757',
        }),
        h('path', {
          d: 'M48.5 38c.8 4.8 3.1 7.1 7.9 7.9-4.8.8-7.1 3.1-7.9 7.9-.8-4.8-3.1-7.1-7.9-7.9 4.8-.8 7.1-3.1 7.9-7.9Z',
          fill: '#E28A67',
          opacity: '0.92',
        }),
        h('path', {
          d: 'M17.5 36c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6Z',
          fill: '#E28A67',
          opacity: '0.7',
        }),
      )
    }

    function CommanderIcon({ size = 18 }) {
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 16 16',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg',
          'aria-hidden': 'true',
        },
        h('path', {
          d: 'M8 1.4c.4 2.5 1.6 3.7 4.1 4.1-2.5.4-3.7 1.6-4.1 4.1-.4-2.5-1.6-3.7-4.1-4.1 2.5-.4 3.7-1.6 4.1-4.1Z',
          stroke: 'currentColor',
          strokeWidth: '1.2',
          strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M12.4 9.5c.2 1.3.9 2 2.2 2.2-1.3.2-2 .9-2.2 2.2-.2-1.3-.9-2-2.2-2.2 1.3-.2 2-.9 2.2-2.2Z',
          stroke: 'currentColor',
          strokeWidth: '1.05',
          strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M4.6 10.2c.15.95.65 1.45 1.6 1.6-.95.15-1.45.65-1.6 1.6-.15-.95-.65-1.45-1.6-1.6.95-.15 1.45-.65 1.6-1.6Z',
          stroke: 'currentColor',
          strokeWidth: '0.9',
          strokeLinejoin: 'round',
        }),
      )
    }

    function Chip({ on, warn, label }) {
      return h(
        'span',
        { className: 'cc-chip', title: label },
        h('span', { className: `cc-dot${on ? ' on' : warn ? ' warn' : ''}` }),
        h('span', { className: 'cc-chipLabel' }, label),
      )
    }

    function Button({ variant = 'ghost', busy = false, children, ...rest }) {
      return h(
        'button',
        { type: 'button', ...rest, className: `cc-btn ${variant}` },
        busy ? h('span', { className: 'cc-spinner' }) : null,
        h('span', null, children),
      )
    }

    function Field({ label, hint, children }) {
      return h(
        'label',
        { className: 'cc-field' },
        h('span', { className: 'cc-label' }, label),
        children,
        hint ? h('span', { className: 'cc-hint' }, hint) : null,
      )
    }

    function Section({ title, aside, children }) {
      return h(
        'section',
        { className: 'cc-section' },
        h(
          'div',
          { className: 'cc-sectionHead' },
          h('span', { className: 'cc-sectionTitle' }, title),
          aside ? h('span', { className: 'cc-sectionAside' }, aside) : null,
        ),
        children,
      )
    }

    function Notice({ notice, tt, onRetry }) {
      if (!notice) return null
      return h(
        'div',
        { className: 'cc-notice', role: 'alert' },
        h('div', { className: 'cc-noticeTitle' }, tt('errorTitle')),
        h('div', { className: 'cc-noticeBody' }, notice.message),
        notice.hint ? h('div', { className: 'cc-noticeHint' }, notice.hint) : null,
        onRetry
          ? h(
              'div',
              { className: 'cc-noticeActions' },
              h(Button, { variant: 'ghost', onClick: onRetry }, tt('retry')),
            )
          : null,
      )
    }

    function Modal({ title, onClose, children }) {
      const box = useRef(null)
      const closeRef = useRef(onClose)
      closeRef.current = onClose
      useEffect(() => {
        const previous = document.activeElement
        const onKeyDown = (event) => {
          if (event.key === 'Escape') {
            event.stopPropagation()
            closeRef.current()
          }
        }
        document.addEventListener('keydown', onKeyDown)
        try {
          box.current?.focus()
        } catch {}
        return () => {
          document.removeEventListener('keydown', onKeyDown)
          try {
            previous && typeof previous.focus === 'function' && previous.focus()
          } catch {}
        }
      }, [])
      return h(
        'div',
        { className: 'cc-modalBackdrop', onClick: () => closeRef.current() },
        h(
          'div',
          {
            className: 'cc-modal',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': title,
            tabIndex: -1,
            ref: box,
            onClick: (event) => event.stopPropagation(),
          },
          children,
        ),
      )
    }

    /* ------------------------------------------------------------------ */
    /* panel                                                               */
    /* ------------------------------------------------------------------ */

    const DEFAULT_FORM = {
      engine: 'cli',
      projectDir: '',
      projectName: '',
      goal: '',
      permissionMode: 'plan',
    }

    const STORAGE_KEY = 'claude-on-dsh:snapshot'

    function readSnapshot() {
      try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (!parsed || parsed.v !== 1) return null
        if (typeof parsed.savedAt !== 'number' || Date.now() - parsed.savedAt > 12 * 60 * 60 * 1000) return null
        return parsed
      } catch {
        return null
      }
    }

    function CommanderPanel(props) {
      const {
        panelId,
        t,
        pickDirectory,
        refreshSessions,
        openSession,
        dispatchTask,
        archiveTask,
        dispatchAcceptance,
        runClaudeAcceptance,
        askFirstQuestion,
        sendFirstQuestion,
        listSessions,
        currentSessionId,
      } = props
      const tt = useCallback(
        (key, vars) => {
          let value = typeof t === 'function' ? t(key) : key
          if (typeof value !== 'string' || value === key) {
            value = (DICT.zh && DICT.zh[key]) || key
          }
          if (vars) {
            for (const name of Object.keys(vars)) {
              value = value.split(`{${name}}`).join(String(vars[name]))
            }
          }
          return value
        },
        [t],
      )

      const [restored] = useState(readSnapshot)
      const [detect, setDetect] = useState(null)
      const [detectError, setDetectError] = useState('')
      const [form, setForm] = useState(() =>
        restored && restored.form ? { ...DEFAULT_FORM, ...restored.form } : DEFAULT_FORM,
      )
      const [job, setJob] = useState(() => (restored ? restored.job ?? null : null))
      const [brief, setBrief] = useState(() => (restored ? restored.brief ?? null : null))
      const [answer, setAnswer] = useState(() => (restored ? restored.answer ?? '' : ''))
      const [refined, setRefined] = useState(() => (restored ? restored.refined ?? null : null))
      const [promptText, setPromptText] = useState(() => (restored ? restored.promptText ?? '' : ''))
      const [desktopPrompt, setDesktopPrompt] = useState(() => (restored ? restored.desktopPrompt ?? '' : ''))
      const [desktopReply, setDesktopReply] = useState(() => (restored ? restored.desktopReply ?? '' : ''))
      const [phase, setPhase] = useState(() => (restored ? restored.phase ?? 'setup' : 'setup'))
      const [dispatch, setDispatch] = useState(() => {
        const saved = restored ? restored.dispatch : null
        if (!saved || typeof saved !== 'object') return { state: 'idle' }
        if (saved.state === 'sending') return { state: 'idle' }
        return saved
      })
      const [history, setHistory] = useState([])
      const [notice, setNotice] = useState(null)
      const [toast, setToast] = useState('')
      const [clock, setClock] = useState(0)
      const [consumedJobId, setConsumedJobId] = useState(() =>
        restored ? restored.consumedJobId ?? null : null,
      )
      const [dialog, setDialog] = useState(null)
      const [firstQuestion, setFirstQuestion] = useState(null)
      const [allSessions, setAllSessions] = useState([])

      const update = useCallback((patch) => {
        setForm((current) => ({ ...current, ...patch }))
      }, [])

      /* Keep the in-flight job and the form across a panel switch or reload. */
      useEffect(() => {
        try {
          window.sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              v: 1,
              savedAt: Date.now(),
              form,
              job,
              brief,
              answer,
              refined,
              promptText,
              desktopPrompt,
              desktopReply,
              phase,
              dispatch,
              consumedJobId,
            }),
          )
        } catch {}
      }, [form, job, brief, answer, refined, promptText, desktopPrompt, desktopReply, phase, dispatch, consumedJobId])

      /* Environment and history: read once, then refresh while active. */
      useEffect(() => {
        let stopped = false
        const load = async () => {
          try {
            const data = await request('/detect')
            if (!stopped) {
              setDetect(data)
              setDetectError('')
            }
          } catch (error) {
            if (!stopped) setDetectError(error.message)
          }
          try {
            const data = await request('/history')
            if (!stopped) setHistory(Array.isArray(data && data.items) ? data.items : [])
          } catch {}
        }
        load()
        const timer = setInterval(load, 20000)
        return () => {
          stopped = true
          clearInterval(timer)
        }
      }, [])

      /* Poll one running job. */
      useEffect(() => {
        if (!job || job.state !== 'running') return
        let stopped = false
        let timer = 0
        const tick = async () => {
          try {
            const data = await request(`/jobs?id=${encodeURIComponent(job.id)}`)
            if (stopped) return
            setJob(data.job)
            if (data.job.state === 'running') timer = setTimeout(tick, 1000)
          } catch (error) {
            if (stopped) return
            setJob((current) =>
              current ? { ...current, state: 'error', error: error.message, hint: error.hint } : current,
            )
          }
        }
        timer = setTimeout(tick, 800)
        return () => {
          stopped = true
          clearTimeout(timer)
        }
      }, [job && job.id, job && job.state])

      /* Consume a finished job exactly once. */
      useEffect(() => {
        if (!job || job.state !== 'done' || !job.result) return
        if (consumedJobId === job.id) return
        setConsumedJobId(job.id)
        if (job.kind === 'brief') {
          setBrief(job.result)
          setAnswer('')
          setRefined(null)
          setPromptText('')
          setPhase('answer')
        } else if (job.kind === 'refine') {
          const title = job.result.projectTitle || form.projectName || brief?.projectTitle || ''
          setRefined(job.result)
          setPromptText(withHeader(title, job.result.dshPrompt || ''))
          setPhase('refined')
        }
      }, [job && job.id, job && job.state, consumedJobId])

      /* A visible clock while a run is in flight. */
      useEffect(() => {
        if (!job || job.state !== 'running') return
        const timer = setInterval(() => setClock((value) => value + 1), 1000)
        return () => clearInterval(timer)
      }, [job && job.id, job && job.state])

      useEffect(() => {
        if (!toast) return
        const timer = setTimeout(() => setToast(''), 2200)
        return () => clearTimeout(timer)
      }, [toast])

      useEffect(() => {
        let stopped = false
        listSessions()
          .then((data) => {
            if (!stopped) setAllSessions(Array.isArray(data.items) ? data.items : [])
          })
          .catch(() => {})
        return () => {
          stopped = true
        }
      }, [])

      const cliReady = Boolean(detect && detect.cli && detect.cli.found && detect.cli.runnable)
      const desktopReady = Boolean(detect && detect.desktop && detect.desktop.found)
      const proxyApplicable = Boolean(detect && detect.proxy && detect.proxy.applicable)
      const proxyReady = Boolean(proxyApplicable && detect.proxy.reachable)
      const ccSwitchReady = Boolean(detect && detect.ccSwitch && detect.ccSwitch.found)
      const running = Boolean(job && job.state === 'running')
      const elapsed = job ? Math.max(0, Math.round(((job.finishedAt || Date.now()) - job.startedAt) / 1000)) : 0

      const stepIndex = phase === 'setup' ? 0 : phase === 'dispatched' ? 3 : phase === 'refined' || phase === 'desktop' ? 2 : 1

      const steps = useMemo(
        () => [
          { key: 'stepSetup' },
          { key: 'stepAsk' },
          { key: 'stepHandoff' },
        ],
        [],
      )

      function fail(message, hint) {
        setNotice({ message, hint: hint || '' })
      }

      async function startBrief() {
        if (form.goal.trim().length < 4) {
          fail(tt('requiredGoal'))
          return
        }
        setNotice(null)
        setDispatch({ state: 'idle' })
        try {
          const data = await request('/jobs', {
            method: 'POST',
            body: JSON.stringify({
              kind: 'brief',
              projectDir: form.projectDir,
              projectName: form.projectName,
              goal: form.goal,
              permissionMode: form.permissionMode,
            }),
          })
          setBrief(null)
          setRefined(null)
          setPromptText('')
          setAnswer('')
          setJob(data.job)
          setPhase('brief')
        } catch (error) {
          fail(error.message, error.hint)
        }
      }

      async function cancelJob() {
        if (!job) return
        try {
          await request('/jobs/cancel', { method: 'POST', body: JSON.stringify({ id: job.id }) })
        } catch {}
        setJob((current) => (current ? { ...current, state: 'cancelled', phase: tt('cancelled') } : current))
      }

      async function submitAnswer() {
        if (answer.trim().length === 0) {
          fail(tt('requiredAnswer'))
          return
        }
        setNotice(null)
        try {
          const data = await request('/jobs', {
            method: 'POST',
            body: JSON.stringify({
              kind: 'refine',
              projectDir: form.projectDir,
              projectName: form.projectName,
              goal: form.goal,
              permissionMode: form.permissionMode,
              brief,
              answer,
            }),
          })
          setJob(data.job)
          setPhase('answer')
        } catch (error) {
          fail(error.message, error.hint)
        }
      }

      async function dispatchToDsh() {
        if (promptText.trim().length === 0) {
          fail(tt('requiredPrompt'))
          return
        }
        if (form.projectDir.trim().length === 0) {
          fail(tt('requiredDir'))
          return
        }
        setNotice(null)
        setDispatch({ state: 'sending' })
        try {
          const data = await dispatchTask({
            projectDir: form.projectDir,
            title: form.projectName || (refined && refined.projectTitle) || (brief && brief.projectTitle) || '',
            brief: promptText,
            engine: form.engine,
            costUsd: job && job.meta ? job.meta.costUsd : undefined,
            durationMs: job && job.meta ? job.meta.durationMs : undefined,
          })
          setDispatch({
            state: 'done',
            sessionId: data.sessionId,
            title: data.workspaceTitle,
            permission: data.permission,
            permissionWarning: data.permissionWarning,
          })
          setPhase('dispatched')
          if (data.record) {
            setHistory((current) => [data.record].concat(current).slice(0, 24))
          }
          try {
            await refreshSessions(data.sessionId)
          } catch {}
        } catch (error) {
          setDispatch({ state: 'error', message: error.message, hint: error.hint })
        }
      }

      async function browse() {
        try {
          const chosen = await pickDirectory()
          if (chosen) update({ projectDir: chosen })
        } catch (error) {
          fail(error.message, tt('openFailed'))
        }
      }

      async function openDesktopFlow() {
        if (form.goal.trim().length < 4) {
          fail(tt('requiredGoal'))
          return
        }
        setNotice(null)
        try {
          const data = await request('/prompt', {
            method: 'POST',
            body: JSON.stringify({
              projectName: form.projectName,
              projectDir: form.projectDir,
              goal: form.goal,
            }),
          })
          const prompt = data && data.prompt ? data.prompt : ''
          setDesktopPrompt(prompt)
          const opened = await request('/desktop', {
            method: 'POST',
            body: JSON.stringify({ brief: prompt, launch: desktopReady }),
            timeoutMs: 40_000,
          })
          setPhase('desktop')
          if (!desktopReady) {
            fail(tt('desktopMissing'), detect && detect.desktop ? detect.desktop.path : '')
          } else if (opened && opened.copied) {
            setToast(tt('copied'))
          } else {
            fail(tt('copyFailed'))
          }
        } catch (error) {
          fail(error.message, error.hint)
        }
      }

      async function copyBrief(value, launch) {
        try {
          const data = await request('/desktop', {
            method: 'POST',
            body: JSON.stringify({ brief: value, launch: Boolean(launch) }),
            timeoutMs: 40_000,
          })
          if (data && data.copied) setToast(tt('copied'))
          else fail(tt('copyFailed'))
        } catch (error) {
          fail(error.message, error.hint)
        }
      }

      function continueFromDesktop() {
        if (desktopReply.trim().length === 0) {
          fail(tt('desktopNoReply'))
          return
        }
        const title = form.projectName || '新项目'
        setRefined({
          projectTitle: title,
          summary: '',
          plan: [],
          acceptance: [],
          risks: [],
          dshPrompt: desktopReply.trim(),
        })
        setPromptText(withHeader(title, desktopReply.trim()))
        setPhase('refined')
      }

      async function openCcSwitch() {
        try {
          await request('/cc-switch', { method: 'POST', body: '{}' })
          setToast(tt('statusCcSwitch'))
        } catch (error) {
          fail(error.message, error.hint)
        }
      }

      function openCurrentFirstQuestion() {
        let current = ''
        try {
          current =
            typeof currentSessionId === 'function' ? currentSessionId() : currentSessionId || ''
        } catch {}
        const target = current || (allSessions[0] && allSessions[0].sessionId) || ''
        const item = allSessions.find((session) => session.sessionId === target)
        openFirstQuestionDialog({
          sessionId: target,
          projectDir: item && item.cwd,
          title:
            item && item.cwd
              ? String(item.cwd).split(/[\\/]/).filter(Boolean).pop()
              : target,
        })
      }

      function openFirstQuestionDialog(entry) {
        const target = entry || { sessionId: '', projectDir: '', title: '' }
        setFirstQuestion({
          entry: target,
          requirement: '',
          busy: false,
          error: '',
          generated: null,
          answer: '',
        })
        // The picker should offer the conversations that exist now, not the
        // snapshot taken when the panel first mounted.
        listSessions()
          .then((data) => setAllSessions(Array.isArray(data && data.items) ? data.items : []))
          .catch(() => {})
      }

      function closeFirstQuestion() {
        if (firstQuestion && firstQuestion.busy) return
        setFirstQuestion(null)
      }

      function closeDialog() {
        if (dialog && dialog.busy) return
        setDialog(null)
      }

      async function sendFirstQuestionNow() {
        if (!firstQuestion) return
        if (!firstQuestion.entry.sessionId) {
          setFirstQuestion((current) =>
            current ? { ...current, error: tt('existingPick') } : current,
          )
          return
        }
        if (!firstQuestion.requirement.trim()) {
          setFirstQuestion((current) =>
            current ? { ...current, error: tt('firstQuestionRequired') } : current,
          )
          return
        }
        setFirstQuestion((current) => (current ? { ...current, busy: true, error: '' } : current))
        try {
          const data = await askFirstQuestion({
            sessionId: firstQuestion.entry.sessionId,
            requirement: firstQuestion.requirement,
          })
          setFirstQuestion((current) =>
            current
              ? { ...current, busy: false, error: '', generated: data, answer: '' }
              : current,
          )
        } catch (error) {
          setFirstQuestion((current) =>
            current ? { ...current, busy: false, error: error.message } : current,
          )
        }
      }

      async function sendFirstQuestionToDsh() {
        if (!firstQuestion || !firstQuestion.generated) return
        if (!firstQuestion.answer.trim()) {
          setFirstQuestion((current) =>
            current ? { ...current, error: tt('firstQuestionAnswerRequired') } : current,
          )
          return
        }
        setFirstQuestion((current) => (current ? { ...current, busy: true, error: '' } : current))
        try {
          const data = await sendFirstQuestion({
            sessionId: firstQuestion.entry.sessionId,
            requirement: firstQuestion.requirement,
            projectDir: firstQuestion.entry.projectDir,
            title: firstQuestion.entry.title,
            question: firstQuestion.generated.question,
            answer: firstQuestion.answer,
            brief: firstQuestion.generated.brief,
          })
          setToast(tt('firstQuestionDone'))
          setFirstQuestion(null)
          try {
            await refreshSessions(data.sessionId)
          } catch {}
          openSession(data.sessionId)
        } catch (error) {
          setFirstQuestion((current) =>
            current ? { ...current, busy: false, error: error.message } : current,
          )
        }
      }

      function openAcceptanceDialog(entry) {
        if (!entry || !entry.sessionId) return
        setDialog({ entry, mode: 'claude', opinion: '', busy: false, result: null, error: '' })
      }

      async function confirmAcceptance() {
        if (!dialog) return
        const { entry, mode, opinion } = dialog
        setDialog((current) => (current ? { ...current, busy: true, error: '' } : current))
        try {
          if (mode === 'dsh') {
            const data = await dispatchAcceptance({
              projectDir: entry.projectDir || form.projectDir,
              sessionId: entry.sessionId,
              opinion,
            })
            setToast(tt('dshAcceptOpened'))
            setDialog(null)
            try {
              await refreshSessions(data.sessionId)
            } catch {}
            openSession(data.sessionId)
          } else {
            const data = await runClaudeAcceptance({
              sessionId: entry.sessionId,
              opinion,
            })
            setDialog((current) =>
              current
                ? {
                    ...current,
                    busy: false,
                    result: {
                      overall: data.report && data.report.overall,
                      status: data.report && data.report.status,
                      reportPath: data.paths && data.paths.jsonPath,
                    },
                  }
                : current,
            )
          }
        } catch (error) {
          setDialog((current) =>
            current ? { ...current, busy: false, error: error.message } : current,
          )
        }
      }

      async function openSessionNow(sessionId) {
        if (!sessionId) return
        try {
          await refreshSessions(sessionId)
        } catch {}
        try {
          openSession(sessionId)
        } catch (error) {
          fail(error.message, tt('openFailed'))
        }
      }

      async function archiveCurrent() {
        if (!dispatch || !dispatch.sessionId) return
        try {
          await archiveTask(dispatch.sessionId)
          setToast(tt('archived'))
        } catch (error) {
          fail(error.message, error.hint)
        }
      }

      function reset() {
        setJob(null)
        setBrief(null)
        setRefined(null)
        setPromptText('')
        setAnswer('')
        setDesktopPrompt('')
        setDesktopReply('')
        setDispatch({ state: 'idle' })
        setPhase('setup')
        setNotice(null)
        setConsumedJobId(null)
      }

      /* ---------------------------------------------------------------- */
      /* render                                                           */
      /* ---------------------------------------------------------------- */

      const meta = job && job.meta ? job.meta : null
      const metaParts = []
      if (meta && meta.durationMs) metaParts.push(`${tt('duration')} ${formatDuration(meta.durationMs)}`)
      if (meta && meta.costUsd !== undefined && meta.costUsd !== null) metaParts.push(`${tt('cost')} ${formatMoney(meta.costUsd)}`)
      if (meta && meta.turns) metaParts.push(`${tt('turns')} ${meta.turns}`)

      const leftCard = h(
        'div',
        { className: 'cc-card' },
        h('div', { className: 'cc-cardTitle' }, tt('engine')),
        h(
          'div',
          { className: 'cc-seg', role: 'tablist', 'aria-label': tt('engine') },
          h(
            'button',
            {
              type: 'button',
              role: 'tab',
              'aria-selected': form.engine === 'cli',
              className: form.engine === 'cli' ? 'on' : '',
              onClick: () => update({ engine: 'cli' }),
            },
            h('span', { className: 'cc-segTitle' }, tt('engineCli')),
            h('span', { className: 'cc-segHint' }, tt('engineCliHint')),
          ),
          h(
            'button',
            {
              type: 'button',
              role: 'tab',
              'aria-selected': form.engine === 'desktop',
              className: form.engine === 'desktop' ? 'on' : '',
              onClick: () => update({ engine: 'desktop' }),
            },
            h('span', { className: 'cc-segTitle' }, tt('engineDesktop')),
            h('span', { className: 'cc-segHint' }, tt('engineDesktopHint')),
          ),
        ),
        h(
          Field,
          { label: tt('projectDir'), hint: tt('projectDirHint') },
          h(
            'div',
            { className: 'cc-row' },
            h('input', {
              className: 'cc-input',
              value: form.projectDir,
              placeholder: tt('projectDirPlaceholder'),
              spellCheck: false,
              onChange: (event) => update({ projectDir: event.target.value }),
            }),
            h(Button, { variant: 'ghost', onClick: browse }, tt('browse')),
          ),
        ),
        h(
          Field,
          { label: tt('projectName') },
          h('input', {
            className: 'cc-input',
            value: form.projectName,
            placeholder: tt('projectNamePlaceholder'),
            onChange: (event) => update({ projectName: event.target.value }),
          }),
        ),
        h(
          Field,
          { label: tt('goal') },
          h('textarea', {
            className: 'cc-textarea',
            rows: 6,
            value: form.goal,
            placeholder: tt('goalPlaceholder'),
            onChange: (event) => update({ goal: event.target.value }),
          }),
        ),
        form.engine === 'cli'
          ? h(
              Field,
              { label: tt('permissionMode') },
              h(
                'select',
                {
                  className: 'cc-input',
                  value: form.permissionMode,
                  onChange: (event) => update({ permissionMode: event.target.value }),
                },
                h('option', { value: 'plan' }, tt('modePlan')),
                h('option', { value: 'dontAsk' }, tt('modeAsk')),
                h('option', { value: 'acceptEdits' }, tt('modeEdits')),
              ),
            )
          : null,
        h(
          'div',
          { className: 'cc-actions' },
          form.engine === 'cli'
            ? h(
                Button,
                {
                  variant: 'primary',
                  busy: running && job && job.kind === 'brief',
                  disabled: running || !cliReady,
                  onClick: startBrief,
                },
                running && job && job.kind === 'brief' ? tt('starting') : tt('startBrief'),
              )
            : h(
                Button,
                { variant: 'primary', disabled: running, onClick: openDesktopFlow },
                tt('openDesktop'),
              ),
          running
            ? h(Button, { variant: 'ghost', onClick: cancelJob }, tt('cancel'))
            : null,
          phase !== 'setup'
            ? h(Button, { variant: 'ghost', onClick: reset }, tt('reset'))
            : null,
        ),
        detect && !cliReady && form.engine === 'cli'
          ? h(
              'div',
              { className: 'cc-inlineWarn' },
              h('span', null, tt('cliMissing')),
              detect && detect.cli && detect.cli.path ? h('code', null, detect.cli.path) : null,
            )
          : null,
        detect && detect.proxy && detect.proxy.applicable && !detect.proxy.reachable && form.engine === 'cli'
          ? h('div', { className: 'cc-inlineWarn' }, h('span', null, tt('proxyHint')))
          : null,
        h(
          'div',
          { className: 'cc-actions cc-actionsEnd' },
          form.engine === 'cli'
            ? h(Button, { variant: 'link', onClick: () => update({ engine: 'desktop' }) }, tt('switchToDesktop'))
            : h(Button, { variant: 'link', onClick: () => update({ engine: 'cli' }) }, tt('switchToCli')),
          h(Button, { variant: 'link', onClick: openCcSwitch }, tt('openCcSwitch')),
        ),
      )

      let rightCard
      if (phase === 'setup') {
        rightCard = h(
          'div',
          { className: 'cc-card cc-emptyCard' },
          h('span', { className: 'cc-emptyMark' }, h(Sparkle, { size: 44 })),
          h('div', { className: 'cc-emptyTitle' }, tt('emptyTitle')),
          h('div', { className: 'cc-emptyBody' }, tt('emptyBody')),
          !detect && !detectError ? h('div', { className: 'cc-hint' }, tt('loading')) : null,
          detectError ? h('div', { className: 'cc-inlineWarn' }, `${tt('detectionFailed')}：${detectError}`) : null,
        )
      } else if (phase === 'desktop') {
        rightCard = h(
          'div',
          { className: 'cc-card' },
          h('div', { className: 'cc-cardTitle' }, tt('desktopTitle')),
          h('div', { className: 'cc-hint' }, tt('desktopBody')),
          h(
            Section,
            { title: tt('desktopPrompt'), aside: h(Button, { variant: 'link', onClick: () => copyBrief(desktopPrompt, false) }, tt('copy')) },
            h('textarea', { className: 'cc-textarea', rows: 7, readOnly: true, value: desktopPrompt }),
          ),
          h(
            Section,
            { title: tt('desktopReply') },
            h('textarea', {
              className: 'cc-textarea',
              rows: 8,
              value: desktopReply,
              placeholder: tt('desktopReplyPlaceholder'),
              onChange: (event) => setDesktopReply(event.target.value),
            }),
          ),
          h(
            'div',
            { className: 'cc-actions' },
            h(Button, { variant: 'primary', onClick: continueFromDesktop }, tt('desktopContinue')),
          ),
        )
      } else if (phase === 'dispatched') {
        rightCard = h(
          'div',
          { className: 'cc-card' },
          h(
            'div',
            { className: 'cc-success' },
            h('div', { className: 'cc-successTitle' }, tt('dispatched')),
            h('div', { className: 'cc-successBody' }, dispatch.title || form.projectName || form.projectDir),
            dispatch.permission
              ? h(
                  'div',
                  { className: 'cc-successBody' },
                  `${tt('permissionLabel')}: ${
                    dispatch.permission === 'danger-full-access' ? tt('fullAccess') : dispatch.permission
                  }`,
                )
              : null,
            dispatch.permissionWarning
              ? h(
                  'div',
                  { className: 'cc-inlineWarn' },
                  `${tt('permissionFallback')}: ${dispatch.permissionWarning}`,
                )
              : null,
            h('code', { className: 'cc-code' }, dispatch.sessionId || ''),
          ),
          h(
            'div',
            { className: 'cc-actions' },
            h(Button, { variant: 'primary', onClick: () => openSessionNow(dispatch.sessionId) }, tt('openSession')),
            h(
              Button,
              {
                variant: 'ghost',
                onClick: () =>
                  openAcceptanceDialog({
                    sessionId: dispatch.sessionId,
                    projectDir: form.projectDir,
                    title: dispatch.title,
                  }),
              },
              tt('dshAccept'),
            ),
            h(Button, { variant: 'ghost', onClick: reset }, tt('newProject')),
            h(Button, { variant: 'ghost', onClick: archiveCurrent }, tt('archive')),
          ),
        )
      } else if (showingBrief()) {
        rightCard = h(
          'div',
          { className: 'cc-card' },
          job && job.kind === 'brief' && running
            ? h(
                'div',
                { className: 'cc-progress' },
                h('span', { className: 'cc-spinner cc-spinnerDark' }),
                h('span', null, job.phase || tt('starting')),
                h('span', { className: 'cc-progressTime' }, `${elapsed}s`),
              )
            : null,
          job && job.kind === 'brief' && job.state === 'error'
            ? h(Notice, { notice: { message: job.error, hint: job.hint }, tt, onRetry: startBrief })
            : null,
          brief
            ? h(
                React.Fragment,
                null,
                h(
                  Section,
                  { title: tt('understand') },
                  h('div', { className: 'cc-prose' }, brief.understanding || ''),
                ),
                h(
                  Section,
                  { title: tt('openingQuestion') },
                  h('div', { className: 'cc-question' }, brief.firstQuestion || ''),
                  Array.isArray(brief.questionOptions) && brief.questionOptions.length > 0
                    ? h(
                        'div',
                        { className: 'cc-options' },
                        brief.questionOptions.map((option, index) =>
                          h(
                            'button',
                            {
                              type: 'button',
                              key: `option-${index}`,
                              className: `cc-option${answer === option ? ' on' : ''}`,
                              onClick: () => setAnswer(option),
                            },
                            option,
                          ),
                        ),
                      )
                    : null,
                ),
                h(
                  Section,
                  { title: tt('planOutline') },
                  h(
                    'ol',
                    { className: 'cc-ol' },
                    (Array.isArray(brief.planOutline) ? brief.planOutline : []).map((step, index) => h('li', { key: `plan-${index}` }, step)),
                  ),
                ),
                brief.handoffDraft
                  ? h(
                      'details',
                      { className: 'cc-details' },
                      h('summary', null, tt('draft')),
                      h('div', { className: 'cc-prose cc-pre' }, brief.handoffDraft),
                    )
                  : null,
                h(
                  Section,
                  { title: tt('answer'), aside: tt('answerHint') },
                  h('textarea', {
                    className: 'cc-textarea',
                    rows: 4,
                    value: answer,
                    placeholder: tt('answerPlaceholder'),
                    onChange: (event) => setAnswer(event.target.value),
                  }),
                ),
                h(
                  'div',
                  { className: 'cc-actions' },
                  h(
                    Button,
                    {
                      variant: 'primary',
                      busy: running && job && job.kind === 'refine',
                      disabled: running || answer.trim().length === 0,
                      onClick: submitAnswer,
                    },
                    running && job && job.kind === 'refine' ? tt('refining') : tt('refine'),
                  ),
                ),
                job && job.kind === 'refine' && job.state === 'error'
                  ? h(Notice, { notice: { message: job.error, hint: job.hint }, tt, onRetry: submitAnswer })
                  : null,
              )
            : null,
          metaParts.length > 0
            ? h('div', { className: 'cc-meta' }, metaParts.join(' · '))
            : null,
        )
      } else {
        rightCard = h(
          'div',
          { className: 'cc-card' },
          job && job.state === 'error'
            ? h(Notice, { notice: { message: job.error, hint: job.hint }, tt, onRetry: startBrief })
            : null,
          job && job.state === 'cancelled'
            ? h('div', { className: 'cc-hint' }, tt('cancelled'))
            : null,
          job && job.state !== 'error' && job.state !== 'cancelled'
            ? h(
                'div',
                { className: 'cc-progress' },
                h('span', { className: 'cc-spinner cc-spinnerDark' }),
                h('span', null, job ? job.phase : tt('loading')),
                h('span', { className: 'cc-progressTime' }, `${elapsed}s`),
              )
            : null,
        )
      }

      function showingBrief() {
        return Boolean(brief) && phase !== 'desktop' && phase !== 'dispatched'
      }

      const refinedCard = refined && phase !== 'dispatched'
        ? h(
            'div',
            { className: 'cc-card' },
            h(
              'div',
              { className: 'cc-refinedHead' },
              h('div', { className: 'cc-cardTitle' }, refined.projectTitle || form.projectName || tt('handoff')),
              metaParts.length > 0 ? h('div', { className: 'cc-meta' }, metaParts.join(' · ')) : null,
            ),
            refined.summary ? h('div', { className: 'cc-prose' }, refined.summary) : null,
            Array.isArray(refined.plan) && refined.plan.length > 0
              ? h(
                  Section,
                  { title: tt('planOutline') },
                  h(
                    'ol',
                    { className: 'cc-ol' },
                    refined.plan.map((item, index) =>
                      h(
                        'li',
                        { key: `final-${index}` },
                        h('strong', null, (item && item.step) || ''),
                        item && item.outcome ? h('span', { className: 'cc-outcome' }, item.outcome) : null,
                      ),
                    ),
                  ),
                )
              : null,
            Array.isArray(refined.acceptance) && refined.acceptance.length > 0
              ? h(
                  Section,
                  { title: tt('acceptanceCriteria') },
                  h(
                    'ul',
                    { className: 'cc-ul' },
                    refined.acceptance.map((item, index) => h('li', { key: `acc-${index}` }, item)),
                  ),
                )
              : null,
            Array.isArray(refined.risks) && refined.risks.length > 0
              ? h(
                  Section,
                  { title: tt('risks') },
                  h(
                    'ul',
                    { className: 'cc-ul' },
                    refined.risks.map((item, index) => h('li', { key: `risk-${index}` }, item)),
                  ),
                )
              : null,
            h(
              Section,
              { title: tt('handoff'), aside: h(Button, { variant: 'link', onClick: () => copyBrief(promptText, false) }, tt('copy')) },
              h('div', { className: 'cc-hint' }, tt('handoffHint')),
              h('textarea', {
                className: 'cc-textarea cc-textareaCode',
                rows: 12,
                value: promptText,
                onChange: (event) => setPromptText(event.target.value),
              }),
            ),
            dispatch.state === 'error'
              ? h(Notice, { notice: { message: dispatch.message, hint: dispatch.hint }, tt })
              : null,
            h(
              'div',
              { className: 'cc-actions' },
              h(
                Button,
                {
                  variant: 'primary',
                  busy: dispatch.state === 'sending',
                  disabled: dispatch.state === 'sending',
                  onClick: dispatchToDsh,
                },
                dispatch.state === 'sending' ? tt('dispatching') : tt('dispatch'),
              ),
              h(Button, { variant: 'ghost', onClick: reset }, tt('newProject')),
            ),
          )
        : null

      // Phase-focused layout: the handoff card and the dispatch result own the
      // top of the panel, while the already-used setup form folds away.
      let main
      if (phase === 'dispatched') {
        main = rightCard
      } else if (phase === 'refined') {
        main = h(
          React.Fragment,
          null,
          refinedCard,
          h(
            'details',
            { className: 'cc-accDetails' },
            h('summary', null, tt('stepSetup')),
            leftCard,
          ),
        )
      } else {
        main = h('div', { className: 'cc-grid' }, leftCard, rightCard)
      }

      return h(
        'div',
        { className: 'cc-panel', 'data-panel': panelId },
        h(
          'div',
          { className: 'cc-hero' },
          h('span', { className: 'cc-mark' }, h(Sparkle, { size: 26 })),
          h(
            'div',
            { className: 'cc-heroText' },
            h('h1', { className: 'cc-heading' }, tt('title')),
            h('p', { className: 'cc-subtitle' }, tt('subtitle')),
          ),
          h(
            'div',
            { className: 'cc-chips' },
            h(Chip, {
              on: cliReady,
              label: detect && detect.cli && detect.cli.version
                ? `${tt('statusCli')} ${shortVersion(detect.cli.version)}`
                : tt('statusCli'),
            }),
            h(Chip, { on: desktopReady, label: tt('statusDesktop') }),
            proxyApplicable ? h(Chip, { on: proxyReady, warn: !proxyReady, label: tt('statusProxy') }) : null,
            h(Chip, { on: ccSwitchReady, label: tt('statusCcSwitch') }),
          ),
        ),
        h(
          'div',
          { className: 'cc-quickActions' },
          h(Button, { variant: 'ghost', onClick: openCurrentFirstQuestion }, tt('chooseSession')),
        ),
        h(
          'div',
          { className: 'cc-steps' },
          steps.map((step, index) =>
            h(
              React.Fragment,
              { key: step.key },
              index > 0 ? h('span', { className: 'cc-sep', key: `sep-${index}` }, '›') : null,
              h(
                'span',
                {
                  className: `cc-step${index < stepIndex ? ' done' : index === stepIndex ? ' active' : ''}`,
                },
                h('b', null, index < stepIndex ? '✓' : String(index + 1)),
                h('span', null, tt(step.key)),
              ),
            ),
          ),
        ),
        notice ? h(Notice, { notice, tt }) : null,
        main,
        h(
          'div',
          { className: 'cc-history' },
          h('div', { className: 'cc-sectionTitle' }, tt('history')),
          history.length === 0
            ? h('div', { className: 'cc-hint' }, tt('historyEmpty'))
            : h(
                'ul',
                { className: 'cc-historyList' },
                history.slice(0, 6).map((entry) =>
                  h(
                    'li',
                    { key: entry.id || `${entry.sessionId}-${entry.at}` },
                    h(
                      'div',
                      { className: 'cc-historyMain' },
                      h('span', { className: 'cc-historyTitle' }, entry.title || entry.projectDir || ''),
                      h('span', { className: 'cc-historyPath' }, entry.projectDir || ''),
                    ),
                    h('span', { className: 'cc-historyTime' }, timeText(entry.at)),
                    entry.sessionId
                      ? h(
                          Button,
                          { variant: 'link', onClick: () => openSessionNow(entry.sessionId) },
                          tt('historyOpen'),
                        )
                      : h('span', { className: 'cc-historyMuted' }, tt('noHistorySession')),
                    entry.sessionId
                      ? h(
                          Button,
                          {
                            variant: 'link',
                            onClick: () => openAcceptanceDialog(entry),
                          },
                          tt('dshAccept'),
                        )
                      : null,
                    entry.sessionId
                      ? h(
                          Button,
                          {
                            variant: 'link',
                            onClick: () => openFirstQuestionDialog(entry),
                          },
                          tt('firstQuestion'),
                        )
                      : null,
                  ),
                ),
              ),
        ),
        firstQuestion
          ? h(
              Modal,
              {
                title: `${tt('firstQuestion')}：${firstQuestion.entry.title || firstQuestion.entry.sessionId}`,
                onClose: closeFirstQuestion,
              },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'cc-modalClose',
                    'aria-label': 'Close',
                    onClick: closeFirstQuestion,
                  },
                  '×',
                ),
                h(
                  'div',
                  { className: 'cc-cardTitle' },
                  `${tt('firstQuestion')}：${firstQuestion.entry.title || firstQuestion.entry.sessionId}`,
                ),
                h('div', { className: 'cc-hint' }, tt('firstQuestionHint')),
                h(
                  'label',
                  { className: 'cc-field' },
                  h('span', { className: 'cc-label' }, tt('firstQuestionOther')),
                  h(
                    'select',
                    {
                      className: 'cc-select',
                      value: firstQuestion.entry.sessionId || '',
                      onChange: (event) => {
                        const selected = allSessions.find(
                          (item) => item.sessionId === event.target.value,
                        )
                        if (!selected) return
                        setFirstQuestion((current) =>
                          current
                            ? {
                                ...current,
                                entry: {
                                  sessionId: selected.sessionId,
                                  projectDir: selected.cwd,
                                  title: String(selected.cwd)
                                    .split(/[\\/]/)
                                    .filter(Boolean)
                                    .pop(),
                                },
                                generated: null,
                                answer: '',
                              }
                            : current,
                        )
                      },
                    },
                    h('option', { value: '' }, tt('existingPick')),
                    allSessions.map((item) =>
                      h(
                        'option',
                        { value: item.sessionId, key: item.sessionId },
                        `${(item.cwd || '').split(/[\\/]/).filter(Boolean).pop() || item.cwd} · ${item.sessionId.slice(-8)}`,
                      ),
                    ),
                  ),
                ),
                h(
                  'label',
                  { className: 'cc-field' },
                  h('span', { className: 'cc-label' }, tt('firstQuestionRequirement')),
                  h('textarea', {
                    className: 'cc-textarea',
                    rows: 4,
                    value: firstQuestion.requirement,
                    placeholder: tt('firstQuestionPlaceholder'),
                    onChange: (event) =>
                      setFirstQuestion((current) =>
                        current ? { ...current, requirement: event.target.value } : current,
                      ),
                  }),
                ),
                firstQuestion.generated
                  ? h(
                      React.Fragment,
                      null,
                      h('div', { className: 'cc-cardTitle' }, firstQuestion.generated.question),
                      firstQuestion.generated.understanding
                        ? h('div', { className: 'cc-hint' }, firstQuestion.generated.understanding)
                        : null,
                      Array.isArray(firstQuestion.generated.choices) &&
                      firstQuestion.generated.choices.length > 0
                        ? h(
                            'div',
                            { className: 'cc-actions' },
                            firstQuestion.generated.choices.map((choice) =>
                              h(
                                Button,
                                {
                                  key: choice,
                                  variant: 'ghost',
                                  onClick: () =>
                                    setFirstQuestion((current) =>
                                      current ? { ...current, answer: choice } : current,
                                    ),
                                },
                                choice,
                              ),
                            ),
                          )
                        : null,
                      h(
                        'label',
                        { className: 'cc-field' },
                        h('span', { className: 'cc-label' }, tt('firstQuestionAnswer')),
                        h('textarea', {
                          className: 'cc-textarea',
                          rows: 4,
                          value: firstQuestion.answer,
                          placeholder: tt('firstQuestionAnswerPlaceholder'),
                          onChange: (event) =>
                            setFirstQuestion((current) =>
                              current ? { ...current, answer: event.target.value } : current,
                            ),
                        }),
                      ),
                    )
                  : null,
                firstQuestion.error
                  ? h(
                      'div',
                      { className: 'cc-notice' },
                      h('div', { className: 'cc-noticeBody' }, firstQuestion.error),
                    )
                  : null,
                h(
                  'div',
                  { className: 'cc-actions' },
                  h(
                    Button,
                    {
                      variant: 'primary',
                      busy: firstQuestion.busy,
                      disabled: firstQuestion.busy,
                      onClick: firstQuestion.generated
                        ? sendFirstQuestionToDsh
                        : sendFirstQuestionNow,
                    },
                    firstQuestion.generated
                      ? tt('firstQuestionSendToDsh')
                      : firstQuestion.busy
                        ? tt('firstQuestionBusy')
                        : tt('firstQuestionGenerate'),
                  ),
                  h(
                    Button,
                    { variant: 'link', onClick: closeFirstQuestion },
                    tt('acceptanceCancel'),
                  ),
                ),
            )
          : null,
        dialog
          ? h(
              Modal,
              {
                title: `${tt('acceptance')}：${dialog.entry.title || dialog.entry.sessionId}`,
                onClose: closeDialog,
              },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'cc-modalClose',
                    'aria-label': 'Close',
                    onClick: closeDialog,
                  },
                  '×',
                ),
                h(
                  'div',
                  { className: 'cc-cardTitle' },
                  `${tt('acceptance')}：${dialog.entry.title || dialog.entry.sessionId}`,
                ),
                h('div', { className: 'cc-inlineWarn' }, tt('acceptanceCostWarn')),
                h(
                  'div',
                  { className: 'cc-seg' },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: dialog.mode === 'claude' ? 'on' : '',
                      onClick: () =>
                        setDialog((current) =>
                          current ? { ...current, mode: 'claude', result: null, error: '' } : current,
                        ),
                    },
                    tt('acceptanceModeClaude'),
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: dialog.mode === 'dsh' ? 'on' : '',
                      onClick: () =>
                        setDialog((current) =>
                          current ? { ...current, mode: 'dsh', result: null, error: '' } : current,
                        ),
                    },
                    tt('acceptanceModeDsh'),
                  ),
                ),
                h(
                  'label',
                  { className: 'cc-field' },
                  h('span', { className: 'cc-label' }, tt('acceptanceOpinion')),
                  h('textarea', {
                    className: 'cc-textarea',
                    rows: 4,
                    value: dialog.opinion,
                    placeholder: tt('acceptanceOpinionPlaceholder'),
                    onChange: (event) =>
                      setDialog((current) =>
                        current ? { ...current, opinion: event.target.value } : current,
                      ),
                  }),
                ),
                dialog.error
                  ? h('div', { className: 'cc-notice' }, h('div', { className: 'cc-noticeBody' }, dialog.error))
                  : null,
                dialog.result
                  ? h(
                      'div',
                      { className: 'cc-success' },
                      h(
                        'div',
                        { className: 'cc-successTitle' },
                        `${tt('acceptanceDone')}：${dialog.result.overall || 'unknown'}`,
                      ),
                      dialog.result.reportPath
                        ? h('code', { className: 'cc-code' }, dialog.result.reportPath)
                        : null,
                    )
                  : null,
                h(
                  'div',
                  { className: 'cc-actions' },
                  h(
                    Button,
                    { variant: 'primary', busy: dialog.busy, disabled: dialog.busy, onClick: confirmAcceptance },
                    dialog.busy ? tt('acceptanceRunning') : tt('acceptanceStart'),
                  ),
                  h(
                    Button,
                    { variant: 'ghost', onClick: closeDialog },
                    tt('acceptanceSkip'),
                  ),
                  h(
                    Button,
                    { variant: 'link', onClick: closeDialog },
                    tt('acceptanceCancel'),
                  ),
                ),
            )
          : null,
        toast ? h('div', { className: 'cc-toast', role: 'status' }, toast) : null,
      )
    }

    /* ------------------------------------------------------------------ */
    /* registration                                                        */
    /* ------------------------------------------------------------------ */

    function apply(ctx) {
      ctx.effect(
        () =>
          ctx.locale.register(NS, {
            zh: DICT.zh,
            en: DICT.en,
          }),
        'claude-on-dsh: dictionaries',
      )
      ctx.effect(() => injectStyles(), 'claude-on-dsh: stylesheet')

      const t = ctx.locale.bind(NS)

      const injected = () => ({
        panelId: PANEL_ID,
        pickDirectory: async () => {
          try {
            return await ctx.uiWorkspace.pickDirectory()
          } catch {
            return null
          }
        },
        refreshSessions: (sessionId) =>
          typeof ctx.sessions.refreshProjections === 'function'
            ? ctx.sessions.refreshProjections(sessionId)
            : Promise.resolve(),
        openSession: (sessionId) => ctx.uiWorkspace.openSession(sessionId),
        dispatchTask: (payload) =>
          request('/dispatch', {
            method: 'POST',
            body: JSON.stringify(payload),
            timeoutMs: 90_000,
          }),
        archiveTask: (sessionId) =>
          request('/archive', {
            method: 'POST',
            body: JSON.stringify({ sessionId }),
          }),
        dispatchAcceptance: (payload) =>
          request('/acceptance/dispatch', {
            method: 'POST',
            body: JSON.stringify(payload),
            timeoutMs: 180_000,
          }),
        runClaudeAcceptance: (payload) =>
          request('/acceptance/claude', {
            method: 'POST',
            body: JSON.stringify(payload),
            timeoutMs: 600_000,
          }),
        askFirstQuestion: (payload) =>
          request('/session/first-question', {
            method: 'POST',
            body: JSON.stringify(payload),
            timeoutMs: 150_000,
          }),
        sendFirstQuestion: (payload) =>
          request('/session/first-question/send', {
            method: 'POST',
            body: JSON.stringify(payload),
            timeoutMs: 90_000,
          }),
        listSessions: () => request('/sessions'),
        currentSessionId: () => {
          try {
            const scoped = ctx.sessions.scopeOf?.(ctx)
            if (scoped) return scoped
          } catch {}
          try {
            const match =
              window.location.hash.match(/session[\/-]([A-Za-z0-9-]+)/) ||
              window.location.pathname.match(/session[\/-]([A-Za-z0-9-]+)/)
            if (match) return match[1]
          } catch {}
          return ''
        },
      })

      ctx.slots.inject('main', () =>
        ctx.slots.register(
          {
            name: 'main',
            key: PANEL_ID,
            locale: NS,
            inject: injected,
          },
          CommanderPanel,
        ),
      )

      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          {
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 5,
            label: () => t('nav'),
            locale: NS,
          },
          CommanderIcon,
        ),
      )
    }

    /* ------------------------------------------------------------------ */
    /* stylesheet                                                          */
    /* ------------------------------------------------------------------ */

    const STYLE_ID = 'claude-on-dsh/styles'

    function injectStyles() {
      if (document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`) !== null) return () => {}
      const tag = document.createElement('style')
      tag.dataset.plugin = 'claude-on-dsh'
      tag.dataset.pluginCss = STYLE_ID
      tag.textContent = CSS
      document.head.appendChild(tag)
      return () => {
        tag.remove()
      }
    }

    const CSS = `
.cc-panel {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 18px;
  block-size: 100%;
  min-block-size: 0;
  overflow: auto;
  padding: 24px clamp(18px, 3.5vw, 40px) 64px;
  background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-primary);
  font-size: 13px;
  line-height: 1.55;
}
.cc-panel > * { inline-size: 100%; max-inline-size: 1120px; margin-inline: auto; }
.cc-hero {
  display: flex; align-items: flex-start; gap: 14px; flex-wrap: wrap;
  padding: 18px 20px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 16px;
  background: linear-gradient(
    135deg,
    color-mix(in oklab, #D97757 8%, var(--dsw-alias-bg-layer-1)),
    var(--dsw-alias-bg-layer-1) 58%
  );
}
.cc-mark {
  display: grid; place-items: center; flex: 0 0 auto;
  inline-size: 44px; block-size: 44px; border-radius: 13px;
  background: color-mix(in oklab, #D97757 14%, var(--dsw-alias-bg-layer-1));
  border: 1px solid color-mix(in oklab, #D97757 34%, transparent);
}
.cc-heroText { min-inline-size: 0; flex: 1 1 320px; }
.cc-heading { margin: 0; font-size: 21px; font-weight: 600; line-height: 1.25; letter-spacing: -0.02em; }
.cc-subtitle { margin: 4px 0 0; color: var(--dsw-alias-label-secondary); font-size: 12.5px; }
.cc-chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; margin-inline-start: auto; }
.cc-chip {
  display: inline-flex; align-items: center; gap: 6px; block-size: 24px; padding: 0 9px;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px;
  background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary);
  font-size: 11.5px; white-space: nowrap; max-inline-size: 220px;
}
.cc-chipLabel { overflow: hidden; text-overflow: ellipsis; }
.cc-dot { inline-size: 6px; block-size: 6px; border-radius: 50%; background: var(--dsw-alias-state-idle-primary); flex: 0 0 auto; }
.cc-dot.on { background: var(--dsw-alias-state-success-primary); }
.cc-dot.warn { background: var(--dsw-alias-state-warn-primary); }
.cc-steps {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
  padding: 10px 14px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1);
}
.cc-step { display: inline-flex; align-items: center; gap: 8px; color: var(--dsw-alias-label-secondary); font-size: 12px; }
.cc-step b {
  display: grid; place-items: center; inline-size: 20px; block-size: 20px; border-radius: 50%;
  font-size: 11px; font-weight: 600; border: 1px solid var(--dsw-alias-border-l2); color: inherit;
}
.cc-step.active { color: var(--dsw-alias-label-primary); font-weight: 500; }
.cc-step.active b { background: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); color: #fff; }
.cc-step.done { color: var(--dsw-alias-label-secondary); }
.cc-step.done b { background: var(--dsw-alias-state-success-primary); border-color: var(--dsw-alias-state-success-primary); color: #fff; }
.cc-sep { color: var(--dsw-alias-label-secondary); opacity: 0.45; }
.cc-grid { display: grid; grid-template-columns: minmax(300px, 0.92fr) minmax(340px, 1.12fr); gap: 16px; align-items: start; }
@media (max-width: 940px) { .cc-grid { grid-template-columns: 1fr; } }
.cc-card {
  display: flex; flex-direction: column; gap: 14px; min-inline-size: 0;
  padding: 16px 18px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 14px;
  background: var(--dsw-alias-bg-layer-1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.cc-cardTitle { font-size: 13px; font-weight: 600; }
.cc-field { display: flex; flex-direction: column; gap: 6px; min-inline-size: 0; }
.cc-label { font-size: 12px; color: var(--dsw-alias-label-secondary); }
.cc-hint { font-size: 11.5px; color: var(--dsw-alias-label-secondary); opacity: 0.85; }
.cc-input, .cc-textarea {
  box-sizing: border-box; inline-size: 100%; border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary);
  padding: 8px 10px; font: inherit; font-size: 12.5px; outline: none;
}
.cc-input:focus, .cc-textarea:focus { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; border-color: transparent; }
.cc-textarea { resize: vertical; line-height: 1.6; min-block-size: 64px; }
.cc-textareaCode { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; }
.cc-row { display: flex; align-items: center; gap: 8px; min-inline-size: 0; }
.cc-row .cc-input { flex: 1 1 auto; min-inline-size: 0; }
.cc-seg { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.cc-seg button {
  display: flex; flex-direction: column; align-items: flex-start; gap: 2px; cursor: pointer;
  padding: 8px 10px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 9px;
  background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: inherit; text-align: start;
}
.cc-seg button.on { border-color: var(--dsw-alias-brand-primary); box-shadow: inset 0 0 0 1px var(--dsw-alias-brand-primary); }
.cc-seg button:hover { background: color-mix(in oklab, var(--dsw-alias-label-primary) 4%, var(--dsw-alias-bg-base)); }
.cc-segTitle { font-size: 12.5px; font-weight: 500; }
.cc-segHint { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.cc-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.cc-actionsEnd { margin-block-start: 2px; }
.cc-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  min-block-size: 34px; padding: 0 13px; border-radius: 9px; cursor: pointer;
  font: inherit; font-size: 12.5px; font-weight: 500; border: 1px solid transparent;
}
.cc-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.cc-btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.cc-btn.primary { background: var(--dsw-alias-brand-primary); color: #fff; }
.cc-btn.primary:hover:not(:disabled) { filter: brightness(1.06); }
.cc-btn.ghost { background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-border-l2); }
.cc-btn.ghost:hover:not(:disabled) { background: color-mix(in oklab, var(--dsw-alias-label-primary) 5%, var(--dsw-alias-bg-base)); }
.cc-btn.link { min-block-size: 24px; padding: 0 2px; background: transparent; color: var(--dsw-alias-label-secondary); text-decoration: underline; text-underline-offset: 3px; }
.cc-btn.link:hover:not(:disabled) { color: var(--dsw-alias-label-primary); }
.cc-spinner {
  inline-size: 13px; block-size: 13px; border-radius: 50%; flex: 0 0 auto;
  border: 2px solid currentColor; border-top-color: transparent; animation: cc-spin 0.8s linear infinite;
}
.cc-spinnerDark { color: var(--dsw-alias-brand-primary); }
@keyframes cc-spin { to { transform: rotate(360deg); } }
.cc-section { display: flex; flex-direction: column; gap: 8px; min-inline-size: 0; }
.cc-sectionHead { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.cc-sectionTitle { font-size: 12.5px; font-weight: 600; }
.cc-sectionAside { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.cc-prose { white-space: pre-wrap; word-break: break-word; }
.cc-pre { max-block-size: 220px; overflow: auto; font-size: 12px; }
.cc-question {
  padding: 10px 12px; border-radius: 8px; border-inline-start: 3px solid #D97757;
  background: color-mix(in oklab, #D97757 8%, var(--dsw-alias-bg-base));
  font-size: 13px; font-weight: 500; white-space: pre-wrap;
}
.cc-options { display: flex; flex-wrap: wrap; gap: 6px; }
.cc-option {
  cursor: pointer; padding: 4px 10px; border-radius: 999px;
  border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-base);
  color: var(--dsw-alias-label-secondary); font: inherit; font-size: 11.5px;
}
.cc-option.on { border-color: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-primary); background: color-mix(in oklab, var(--dsw-alias-brand-primary) 10%, var(--dsw-alias-bg-base)); }
.cc-ol { margin: 0; padding-inline-start: 18px; display: flex; flex-direction: column; gap: 5px; }
.cc-ul { margin: 0; padding-inline-start: 18px; display: flex; flex-direction: column; gap: 3px; }
.cc-outcome { display: block; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.cc-details summary { cursor: pointer; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.cc-details[open] summary { margin-block-end: 6px; }
.cc-kv { display: flex; flex-wrap: wrap; gap: 6px; }
.cc-tag {
  padding: 3px 9px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-base); font-size: 11.5px; color: var(--dsw-alias-label-secondary);
}
.cc-meta { font-size: 11px; color: var(--dsw-alias-label-secondary); }
.cc-inlineWarn {
  display: flex; flex-wrap: wrap; gap: 6px; align-items: baseline;
  padding: 8px 10px; border-radius: 8px; font-size: 11.5px;
  border: 1px solid color-mix(in oklab, var(--dsw-alias-state-warn-primary) 35%, transparent);
  background: color-mix(in oklab, var(--dsw-alias-state-warn-primary) 8%, var(--dsw-alias-bg-base));
  color: var(--dsw-alias-label-secondary);
}
.cc-inlineWarn code { font-size: 11px; word-break: break-all; color: var(--dsw-alias-label-secondary); }
.cc-emptyCard { align-items: center; text-align: center; justify-content: center; min-block-size: 320px; }
.cc-emptyMark { opacity: 0.9; }
.cc-emptyTitle { font-size: 15px; font-weight: 600; }
.cc-emptyBody { max-inline-size: 420px; color: var(--dsw-alias-label-secondary); font-size: 12.5px; }
.cc-progress { display: flex; align-items: center; gap: 10px; padding: 12px; border-radius: 9px; background: var(--dsw-alias-bg-base); border: 1px solid var(--dsw-alias-border-l1); }
.cc-progressTime { margin-inline-start: auto; color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; font-size: 12px; }
.cc-notice {
  display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; border-radius: 9px;
  border: 1px solid color-mix(in oklab, var(--dsw-alias-state-error-primary) 38%, transparent);
  background: color-mix(in oklab, var(--dsw-alias-state-error-primary) 7%, var(--dsw-alias-bg-base));
}
.cc-noticeTitle { font-weight: 600; color: var(--dsw-alias-state-error-primary); font-size: 12.5px; }
.cc-noticeBody { white-space: pre-wrap; word-break: break-word; font-size: 12px; }
.cc-noticeHint { color: var(--dsw-alias-label-secondary); font-size: 11.5px; }
.cc-noticeActions { margin-block-start: 2px; }
.cc-success {
  display: flex; flex-direction: column; gap: 6px; padding: 14px; border-radius: 10px;
  border: 1px solid color-mix(in oklab, var(--dsw-alias-state-success-primary) 40%, transparent);
  background: color-mix(in oklab, var(--dsw-alias-state-success-primary) 8%, var(--dsw-alias-bg-base));
}
.cc-successTitle { font-weight: 600; color: var(--dsw-alias-state-success-primary); }
.cc-successBody { color: var(--dsw-alias-label-secondary); }
.cc-code { font-size: 11px; color: var(--dsw-alias-label-secondary); word-break: break-all; }
.cc-refinedHead { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.cc-acceptance { gap: 10px; }
.cc-accToggles { display: flex; flex-wrap: wrap; gap: 16px; padding: 2px 0 10px; }
.cc-switch { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--dsw-alias-label-secondary); cursor: pointer; }
.cc-verdictBanner {
  display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap;
  padding: 12px 14px; border-radius: 10px; border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-base);
}
.cc-verdictBanner strong { font-size: 20px; letter-spacing: 0.04em; }
.cc-verdictBanner span { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 1.5; }
.cc-verdictBanner.pass { border-color: color-mix(in oklab, var(--dsw-alias-state-success-primary) 45%, transparent); background: color-mix(in oklab, var(--dsw-alias-state-success-primary) 7%, var(--dsw-alias-bg-base)); }
.cc-verdictBanner.pass strong { color: var(--dsw-alias-state-success-primary); }
.cc-verdictBanner.fail { border-color: color-mix(in oklab, var(--dsw-alias-state-error-primary) 45%, transparent); background: color-mix(in oklab, var(--dsw-alias-state-error-primary) 7%, var(--dsw-alias-bg-base)); }
.cc-verdictBanner.fail strong { color: var(--dsw-alias-state-error-primary); }
.cc-verdictBanner.uncertain { border-color: color-mix(in oklab, var(--dsw-alias-state-warn-primary) 45%, transparent); background: color-mix(in oklab, var(--dsw-alias-state-warn-primary) 7%, var(--dsw-alias-bg-base)); }
.cc-verdictBanner.uncertain strong { color: var(--dsw-alias-state-warn-primary); }
.cc-accCheck.pass { border-inline-start: 3px solid var(--dsw-alias-state-success-primary); }
.cc-accCheck.fail { border-inline-start: 3px solid var(--dsw-alias-state-error-primary); }
.cc-accCheck.uncertain { border-inline-start: 3px solid var(--dsw-alias-state-warn-primary); }
.cc-accDetails {
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px;
  background: var(--dsw-alias-bg-layer-1); padding: 0 12px 12px;
}
.cc-accDetails > summary {
  cursor: pointer; padding: 10px 0; font-size: 12.5px; font-weight: 500;
  color: var(--dsw-alias-label-secondary);
}
.cc-accDetails[open] > summary {
  border-bottom: 1px solid var(--dsw-alias-border-l1); margin-block-end: 12px;
}
.cc-accDetails .cc-card { border-color: var(--dsw-alias-border-l1); }
.cc-review { border-inline-start: 3px solid #D97757; }
.cc-accHead { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.cc-verdict {
  display: inline-flex; align-items: center; padding: 1px 8px; border-radius: 999px;
  font-size: 10.5px; font-weight: 600; letter-spacing: 0.02em; text-transform: uppercase;
  border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-secondary);
}
.cc-verdict.pass {
  color: var(--dsw-alias-state-success-primary);
  border-color: color-mix(in oklab, var(--dsw-alias-state-success-primary) 45%, transparent);
  background: color-mix(in oklab, var(--dsw-alias-state-success-primary) 9%, transparent);
}
.cc-verdict.fail {
  color: var(--dsw-alias-state-error-primary);
  border-color: color-mix(in oklab, var(--dsw-alias-state-error-primary) 45%, transparent);
  background: color-mix(in oklab, var(--dsw-alias-state-error-primary) 9%, transparent);
}
.cc-verdict.uncertain {
  color: var(--dsw-alias-state-warn-primary);
  border-color: color-mix(in oklab, var(--dsw-alias-state-warn-primary) 45%, transparent);
  background: color-mix(in oklab, var(--dsw-alias-state-warn-primary) 9%, transparent);
}
.cc-accMeta { display: flex; gap: 10px; flex-wrap: wrap; }
.cc-accChecks { display: flex; flex-direction: column; gap: 8px; }
.cc-accCheck {
  display: flex; flex-direction: column; gap: 4px; min-inline-size: 0;
  padding: 8px 10px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px;
  background: var(--dsw-alias-bg-base);
}
.cc-accCheckName { font-size: 12.5px; font-weight: 500; }
.cc-evidence { margin-block-start: 6px; }
.cc-evidence code { font-size: 11px; color: var(--dsw-alias-label-secondary); word-break: break-all; }
.cc-evidenceExcerpt {
  margin: 4px 0 0; padding: 6px 8px; max-block-size: 140px; overflow: auto;
  white-space: pre-wrap; font-size: 11px; line-height: 1.5;
  background: var(--dsw-alias-bg-layer-1); border-radius: 6px; color: var(--dsw-alias-label-secondary);
}
.cc-accSection { display: flex; flex-direction: column; gap: 4px; }
.cc-accPath { word-break: break-all; }
.cc-accRecent { display: flex; flex-direction: column; gap: 4px; }
.cc-accRecentItem {
  display: flex; align-items: center; gap: 8px; padding: 6px 8px; cursor: pointer;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px;
  background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: inherit; text-align: start;
}
.cc-accRecentItem:hover { background: var(--dsw-alias-bg-layer-2); }
.cc-accRecentTitle { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
.cc-history { display: flex; flex-direction: column; gap: 8px; padding-block-start: 4px; }
.cc-historyList { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.cc-historyList li {
  display: flex; align-items: center; gap: 10px; min-inline-size: 0;
  padding: 7px 10px; border-radius: 8px; border: 1px solid transparent;
}
.cc-historyList li { padding: 9px 12px; border-radius: 10px; }
.cc-historyList li:hover { background: var(--dsw-alias-bg-layer-1); border-color: var(--dsw-alias-border-l1); }
.cc-historyMain { display: flex; flex-direction: column; min-inline-size: 0; flex: 1 1 auto; }
.cc-historyTitle { font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cc-historyPath { font-size: 11px; color: var(--dsw-alias-label-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cc-historyTime { font-size: 11px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
.cc-historyMuted { font-size: 11px; color: var(--dsw-alias-label-secondary); opacity: 0.7; }
.cc-modalBackdrop {
  position: fixed; inset: 0; z-index: 80; display: grid; place-items: center;
  background: transparent; padding: 24px;
}
.cc-modal {
  position: relative;
  inline-size: min(600px, 100%); max-block-size: 86vh; overflow: auto;
  display: flex; flex-direction: column; gap: 14px; padding: 22px;
  border: 1px solid var(--dsw-alias-border-l2); border-radius: 16px;
  background: var(--dsw-alias-bg-overlay); box-shadow: 0 12px 40px rgba(0, 0, 0, 0.14);
}
.cc-modal:focus { outline: none; }
.cc-modalClose {
  position: absolute; inset-block-start: 10px; inset-inline-end: 12px;
  inline-size: 28px; block-size: 28px; display: grid; place-items: center;
  border: 1px solid transparent; border-radius: 8px; background: transparent;
  color: var(--dsw-alias-label-secondary); font-size: 18px; line-height: 1; cursor: pointer;
}
.cc-modalClose:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.cc-modal .cc-cardTitle { padding-inline-end: 26px; }
.cc-quickActions { display: flex; justify-content: flex-end; margin-block: -2px 10px; }
.cc-select {
  inline-size: 100%; padding: 8px 10px; border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary);
  font-size: 12.5px;
}
.cc-existing { display: flex; flex-direction: column; gap: 10px; }
.cc-toast {
  position: fixed; inset-block-end: 26px; inset-inline: 0; margin-inline: auto; z-index: 60;
  inline-size: fit-content; padding: 7px 14px; border-radius: 999px;
  background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary);
  border: 1px solid var(--dsw-alias-border-l2); box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  font-size: 12px;
}
`

    return {
      inject: ['slots', 'locale', 'sessions', 'uiWorkspace'],
      apply,
    }
  },
})
