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
        acceptanceGenerate: '生成验收内容',
        acceptanceSendDsh: '发送给 DSH',
        acceptanceDraft: '发送给 DSH 的验收内容（可编辑）',
        acceptanceDraftHint: '这是 Claude 生成的验收任务书；发送前可以直接修改。',
        acceptanceDraftPlaceholder: '将发回原 DSH 会话的验收内容',
        acceptanceDraftRequired: '验收内容不能为空',
        acceptanceCancel: '取消',
        acceptanceDone: '验收完成',
        firstQuestion: '首问',
        chooseSession: '选择会话',
        records: '记录',
        recordsEmpty: '还没有首问或派发记录。',
        recordsLoading: '正在读取记录…',
        recordsBack: '返回列表',
        recordFirst: '首问',
        recordFirstSent: '首问发送',
        recordDispatch: '派发',
        recordAcceptance: '验收',
        claudeSessions: '插件创建的 Claude 会话',
        claudeSessionsEmpty: '还没有记录到 Claude CLI 会话。',
        recordsDelete: '删除',
        recordsDeleteYes: '确认删除',
        recordsDeleteNo: '取消',
        devDoc: '开发文档',
        devDocApproved: '预审通过',
        devDocRejected: '已驳回',
        devDocNeedsInfo: '需补充',
        devDocDraft: '草稿',
        devDocFilled: '开发文档',
        devDocEmpty: '导出模板，填写后导入',
        devDocExportTemplate: '导出模板',
        devDocImport: '导入 .md',
        devDocSave: '保存草稿',
        devDocExportCurrent: '导出当前文档',
        devDocProject: '项目目录',
        devDocNeedProject: '请先在项目设定里选择项目目录。',
        devDocPlaceholder: '导出模板后，直接填写目标、功能和已有资源；其他可留空。旧模板也支持导入。',
        devDocReview: 'Claude 预审',
        devDocAiReviewNotice: '方案预审通过后，经你确认再交给 DSH；成品仍需逐项测试和界面检查。',
        devDocConfirmDelivery: '我已核对本版需求、设计方向和验收标准，确认交给 DSH',
        devDocSend: '交给 DSH',
        devDocTarget: '交付方式',
        devDocNewSession: '新建 DSH 会话',
        devDocVerdict: 'AI 预审结论',
        devDocBlockers: '阻塞项',
        devDocQuestions: '需补充材料',
        devDocApprove: '通过',
        devDocNeedsInfoDecision: '需补充',
        devDocNotApplicable: '不适用',
        devDocConditional: '有条件同意（按未批准）',
        devDocReject: '驳回',
        devDocTemplateExported: '模板已导出',
        devDocImported: '已导入，请检查后预审',
        devDocSaved: '草稿已保存',
        devDocUnresolved: '请填写必填内容',
        devDocApprovedNotice: '方案预审通过，请审阅后确认交给 DSH。',
        devDocRejectedNotice: '未通过审批，请按驳回原因修改后重新预审。',
        devDocNeedsInfoNotice: '材料不足，请补充后重新预审。',
        devDocNotApproved: '请完成方案预审，并确认当前项目的这版文档。',
        devDocSentNew: '已新建 DSH 会话并交付开发文档',
        devDocSentExisting: '已把开发文档发到目标会话',
        reviewList: '验收记录',
        reviewListEmpty: '还没有验收记录。',
        recordContents: '首问 / 派发内容',
        sessionReset: '重置',
        sessionResetConfirm: '重置当前 Claude 会话映射？下次 Claude 调用会新建会话，旧会话文件保留。',
        sessionResetDone: '已重置 Claude 会话',
        reviewSettings: 'DSH 完成后的验收',
        reviewSettingsHint: '开启后，DSH 每轮结束会在原会话里出现验收选项；默认项也可以设成直接交给 Claude。',
        autoPromptToggle: 'DSH 完成后自动出现验收选项',
        defaultActionLabel: '默认项',
        defaultActionNone: '不设默认（每次弹出三选一）',
        defaultActionClaude: '自动交给 Claude 验收',
        dailyBudgetLabel: '每日 Claude 预算（$）',
        dailyBudgetHint: '0 表示不限；达到预算后只停自动验收，手动仍可继续。',
        advancedSettings: '预算与高级设置',
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
        firstQuestionContentRequired: '请回答问题，或手动编辑要发送的内容',
        firstQuestionSendToDsh: '发送给 DSH',
        firstQuestionDraft: '发送给 DSH 的内容（可编辑）',
        firstQuestionDraftHint: '发送前可以修改；修改回答会自动更新，手动改过之后不再覆盖。',
        firstQuestionDraftPlaceholder: '将发送给 DSH 的完整消息',
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
        workspaceModes: '工作区',
        workspaceNew: '新建规划',
        workspaceContinue: '继续会话',
        jobOpen: '查看',
        jobDetails: '详情',
        sessionSearch: '搜索会话名称、目录或 ID…',
        reworkDraft: '生成返工草稿',
        reworkDraftHint: '返工内容先在此编辑，确认后才会发送到原 DSH 会话。',
        criterionPass: '已验证',
        criterionFail: '未通过',
        criterionUnknown: '未验证',
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
        justNow: '刚刚',
        minutesAgo: '{n} 分钟前',
        hoursAgo: '{n} 小时前',
        sessionRunning: '运行中',
        currentSession: '当前',
        sessionOpenHint: 'DSH 会话已创建。打开会话可以查看执行进度，也可以直接继续追问。',
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
        acceptanceGenerate: 'Generate acceptance content',
        acceptanceSendDsh: 'Send to DSH',
        acceptanceDraft: 'Acceptance message to DSH (editable)',
        acceptanceDraftHint: 'Claude generated this acceptance brief; edit it before sending.',
        acceptanceDraftPlaceholder: 'The acceptance content sent back to the original DSH conversation',
        acceptanceDraftRequired: 'Acceptance content must not be empty',
        acceptanceCancel: 'Cancel',
        acceptanceDone: 'Acceptance complete',
        firstQuestion: 'First question',
        chooseSession: 'Choose conversation',
        records: 'Records',
        recordsEmpty: 'No first-question or handoff records yet.',
        recordsLoading: 'Loading records…',
        recordsBack: 'Back to list',
        recordFirst: 'First question',
        recordFirstSent: 'First question sent',
        recordDispatch: 'Dispatch',
        recordAcceptance: 'Acceptance',
        claudeSessions: 'Claude CLI sessions created by this plugin',
        claudeSessionsEmpty: 'No Claude CLI sessions recorded yet.',
        recordsDelete: 'Delete',
        recordsDeleteYes: 'Confirm delete',
        recordsDeleteNo: 'Cancel',
        devDoc: 'Development document',
        devDocApproved: 'Pre-review passed',
        devDocRejected: 'Rejected',
        devDocNeedsInfo: 'Needs info',
        devDocDraft: 'Draft',
        devDocFilled: 'Development document',
        devDocEmpty: 'Export the template, fill it in, then import',
        devDocExportTemplate: 'Export template',
        devDocImport: 'Import .md',
        devDocSave: 'Save draft',
        devDocExportCurrent: 'Export current document',
        devDocProject: 'Project directory',
        devDocNeedProject: 'Select a project directory first.',
        devDocPlaceholder: 'Export and fill in the goal, features, and resources. Other fields are optional. Older templates still import.',
        devDocReview: 'Claude pre-review',
        devDocAiReviewNotice: 'Confirm the reviewed plan before handing it to DSH. The finished work still needs functional and visual verification.',
        devDocConfirmDelivery: 'I checked this version’s requirements, design, and acceptance criteria and confirm delivery to DSH',
        devDocSend: 'Hand to DSH',
        devDocTarget: 'Delivery',
        devDocNewSession: 'New DSH session',
        devDocVerdict: 'AI pre-review verdict',
        devDocBlockers: 'Blockers',
        devDocQuestions: 'Missing materials',
        devDocApprove: 'Approve',
        devDocNeedsInfoDecision: 'Needs info',
        devDocNotApplicable: 'Not applicable',
        devDocConditional: 'Conditional (treated as not approved)',
        devDocReject: 'Reject',
        devDocTemplateExported: 'Template exported',
        devDocImported: 'Imported; review it before pre-review',
        devDocSaved: 'Draft saved',
        devDocUnresolved: 'Fill in the required information',
        devDocApprovedNotice: 'The plan passed pre-review; check and confirm it before delivery.',
        devDocRejectedNotice: 'Rejected; fix the blockers and run pre-review again.',
        devDocNeedsInfoNotice: 'More information is required; resubmit after filling it in.',
        devDocNotApproved: 'Finish pre-review and confirm this version for the current project.',
        devDocSentNew: 'Created a new DSH session and handed over the document',
        devDocSentExisting: 'Sent the document to the target session',
        reviewList: 'Acceptance records',
        reviewListEmpty: 'No acceptance records yet.',
        recordContents: 'First-question / handoff content',
        sessionReset: 'Reset',
        sessionResetConfirm: 'Reset the current Claude session mapping? The next Claude call starts a new session; old session files stay.',
        sessionResetDone: 'Claude session reset',
        reviewSettings: 'Acceptance after DSH',
        reviewSettingsHint: 'When enabled, a review choice appears in the original DSH conversation after each turn; the default can hand it straight to Claude.',
        autoPromptToggle: 'Show the review choice after DSH finishes',
        defaultActionLabel: 'Default',
        defaultActionNone: 'No default (show three choices)',
        defaultActionClaude: 'Hand to Claude automatically',
        dailyBudgetLabel: 'Daily Claude budget ($)',
        dailyBudgetHint: '0 means unlimited; reaching it stops automatic review only, manual runs still work.',
        advancedSettings: 'Budget & advanced',
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
        firstQuestionContentRequired: 'Answer the question, or edit the message to send',
        firstQuestionSendToDsh: 'Send to DSH',
        firstQuestionDraft: 'Message to DSH (editable)',
        firstQuestionDraftHint: 'Edit before sending; answer changes fill it until you edit it manually.',
        firstQuestionDraftPlaceholder: 'The full message sent to DSH',
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
        workspaceModes: 'Workspace',
        workspaceNew: 'New plan',
        workspaceContinue: 'Continue session',
        jobOpen: 'Open',
        jobDetails: 'Details',
        sessionSearch: 'Search title, folder, or ID…',
        reworkDraft: 'Draft rework request',
        reworkDraftHint: 'Review and edit the rework draft; it is sent to the original DSH session only after confirmation.',
        criterionPass: 'Verified',
        criterionFail: 'Failed',
        criterionUnknown: 'Unverified',
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
        justNow: 'just now',
        minutesAgo: '{n}m ago',
        hoursAgo: '{n}h ago',
        sessionRunning: 'running',
        currentSession: 'current',
        sessionOpenHint: 'The DSH session is ready. Open it to follow progress or keep asking follow-ups.',
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
      return `# 项目交接：${name}\n\n> Claude on DSH 已完成首问与规划。请直接按下面的任务书开始执行；只有遇到无法从项目或任务书推断的阻塞项才提问。\n\n${body}`.trim()
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

    function timeAgo(ms, tt) {
      if (typeof ms !== 'number' || !Number.isFinite(ms) || ms <= 0) return ''
      const diff = Math.max(0, Date.now() - ms)
      if (diff < 60_000) return tt('justNow')
      if (diff < 3_600_000) return tt('minutesAgo', { n: Math.floor(diff / 60_000) })
      if (diff < 86_400_000) return tt('hoursAgo', { n: Math.floor(diff / 3_600_000) })
      return timeText(ms)
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

    /* review chip on finalized assistant messages                      */

    const REVIEW_FEED_URL = '/api/claude-on-dsh/reviews'
    let reviewFeed = {}
    let reviewSubs = new Set()
    let reviewTimer = null
    let reviewInFlight = false

    function publishReviewFeed(next) {
      reviewFeed = next
      reviewSubs.forEach((callback) => {
        try {
          callback()
        } catch {}
      })
    }

    function reviewsChanged(previous, next) {
      const keys = Object.keys(next)
      if (keys.length !== Object.keys(previous).length) return true
      return keys.some((key) => {
        const a = previous[key]
        const b = next[key]
        return !a || a.at !== b.at || a.verdict !== b.verdict || a.reason !== b.reason
      })
    }

    function fetchReviewFeed() {
      if (reviewInFlight || typeof fetch !== 'function') return
      reviewInFlight = true
      fetch(REVIEW_FEED_URL, { cache: 'no-store' })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (!data || !Array.isArray(data.entries)) return
          const next = {}
          for (const entry of data.entries) {
            if (entry && typeof entry.messageId === 'string') next[entry.messageId] = entry
          }
          if (reviewsChanged(reviewFeed, next)) publishReviewFeed(next)
        })
        .catch(() => {})
        .finally(() => {
          reviewInFlight = false
        })
    }

    function startReviewFeed() {
      if (reviewTimer !== null || typeof window === 'undefined') return
      fetchReviewFeed()
      reviewTimer = window.setInterval(fetchReviewFeed, 3000)
      window.addEventListener('focus', fetchReviewFeed)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) fetchReviewFeed()
      })
    }

    function useReview(messageId) {
      const [record, setRecord] = useState(null)
      useEffect(() => {
        if (!messageId) return undefined
        const sync = () => setRecord(reviewFeed[messageId] || null)
        reviewSubs.add(sync)
        sync()
        startReviewFeed()
        return () => reviewSubs.delete(sync)
      }, [messageId])
      return record
    }

    function ReviewBadge(props) {
      const messageId = props && props.messageId
      const record = useReview(messageId)
      const [open, setOpen] = useState(false)
      if (!messageId || !record) return null
      const verdict = ['pass', 'fail', 'uncertain'].includes(record.verdict)
        ? record.verdict
        : 'uncertain'
      return h(
        React.Fragment,
        null,
        h(
          'button',
          {
            type: 'button',
            className: `cc-reviewBadge ${verdict}`,
            title: record.opinion || record.reason || '',
            'data-claude-on-dsh-review': messageId,
            onClick: () => setOpen(true),
          },
          h('span', { className: 'cc-reviewBadgeVerdict' }, verdict.toUpperCase()),
          record.reason
            ? h('span', { className: 'cc-reviewBadgeReason' }, record.reason)
            : null,
        ),
        open
          ? h(
              'div',
              { className: 'cc-modalBackdrop', onClick: () => setOpen(false) },
              h(
                'div',
                {
                  className: 'cc-modal cc-reviewModal',
                  onClick: (event) => event.stopPropagation(),
                },
                h(
                  'div',
                  { className: 'cc-cardTitle' },
                  `Claude 评审：${verdict.toUpperCase()}`,
                ),
                h(
                  'div',
                  { className: 'cc-hint' },
                  `${record.source === 'acceptance' ? '直接验收' : '回合后意见'} · ${
                    record.at ? new Date(record.at).toLocaleString() : ''
                  }`,
                ),
                h(
                  'div',
                  { className: 'cc-reviewOpinion' },
                  record.opinion || record.reason || '',
                ),
                Array.isArray(record.evidence) && record.evidence.length
                  ? h(
                      'div',
                      null,
                      h('div', { className: 'cc-label' }, '关键证据'),
                      h(
                        'ul',
                        { className: 'cc-reviewEvidence' },
                        record.evidence.map((item, index) =>
                          h('li', { key: `${index}-${String(item).slice(0, 20)}` }, item),
                        ),
                      ),
                    )
                  : null,
                h(
                  'div',
                  { className: 'cc-actions' },
                  h(
                    Button,
                    { variant: 'link', onClick: () => setOpen(false) },
                    '关闭',
                  ),
                ),
              ),
            )
          : null,
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
        sendAcceptanceDispatch,
        runClaudeAcceptance,
        askFirstQuestion,
        sendFirstQuestion,
        listSessions,
        currentSessionId,
        getSettings,
        saveSettings,
        listRecords,
        readRecord,
        listClaudeSessions,
        deleteClaudeSession,
        resetClaudeSession,
        getUsage,
        getReviews,
        getDevDoc,
        getDevDocTemplate,
        saveDevDoc,
        refineDevDoc,
        sendDevDoc,
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
      const [job, setJob] = useState(null)
      const [backgroundJobs, setBackgroundJobs] = useState([])
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
      const [sessionSearch, setSessionSearch] = useState('')
      const [activeWorkspace, setActiveWorkspace] = useState(() => (restored ? restored.activeWorkspace || 'new' : 'new'))
      const [recordsOpen, setRecordsOpen] = useState(false)
      const [recordItems, setRecordItems] = useState([])
      const [claudeSessions, setClaudeSessions] = useState([])
      const [usage, setUsage] = useState({
        costUsd: 0,
        calls: 0,
        budgetUsd: 5,
        over: false,
      })
      const [deleteConfirmKey, setDeleteConfirmKey] = useState('')
      const [deletingKey, setDeletingKey] = useState('')
      const [recordSelected, setRecordSelected] = useState(null)
      const [reviewEntries, setReviewEntries] = useState([])
      const [acceptanceEntries, setAcceptanceEntries] = useState([])
      const [acceptanceSelected, setAcceptanceSelected] = useState(null)
      const [reworkDraft, setReworkDraft] = useState('')
      const [reviewSelected, setReviewSelected] = useState(null)
      const [recordBusy, setRecordBusy] = useState(false)
      const [recordError, setRecordError] = useState('')
      const [devDocOpen, setDevDocOpen] = useState(false)
      const [devDoc, setDevDoc] = useState(null)
      const [devDocDraft, setDevDocDraft] = useState('')
      const [devDocBusy, setDevDocBusy] = useState('')
      const [devDocError, setDevDocError] = useState('')
      const [devDocNotice, setDevDocNotice] = useState('')
      const [devDocSession, setDevDocSession] = useState('')
      const [devDocConfirmed, setDevDocConfirmed] = useState(false)
      useEffect(() => {
        setDevDocConfirmed(false)
      }, [form.projectDir, devDoc && devDoc.contentHash, devDoc && devDoc.status, devDocDraft])
      const [reviewSettings, setReviewSettings] = useState({
        autoPrompt: true,
        defaultAction: 'none',
        dailyBudgetUsd: 5,
      })

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
              brief,
              answer,
              refined,
              promptText,
              desktopPrompt,
              desktopReply,
              phase,
              dispatch,
              consumedJobId,
              activeWorkspace,
            }),
          )
        } catch {}
      }, [form, brief, answer, refined, promptText, desktopPrompt, desktopReply, phase, dispatch, consumedJobId, activeWorkspace])

      useEffect(() => {
        let stopped = false
        getSettings()
          .then((data) => {
            if (!stopped && data) {
              setReviewSettings((current) => ({
                ...current,
                autoPrompt: typeof data.autoPrompt === 'boolean' ? data.autoPrompt : current.autoPrompt,
                defaultAction:
                  data.defaultAction === 'claude' || data.defaultAction === 'none'
                    ? data.defaultAction
                    : current.defaultAction,
                dailyBudgetUsd:
                  typeof data.dailyBudgetUsd === 'number'
                    ? data.dailyBudgetUsd
                    : current.dailyBudgetUsd,
              }))
            }
          })
          .catch(() => {})
        return () => {
          stopped = true
        }
      }, [])

      useEffect(() => {
        let stopped = false
        const loadJobs = async () => {
          try {
            const data = await request('/jobs/list')
            if (stopped) return
            const items = Array.isArray(data.jobs) ? data.jobs : []
            setBackgroundJobs(items)
          } catch {}
        }
        loadJobs()
        const timer = setInterval(loadJobs, 5000)
        return () => { stopped = true; clearInterval(timer) }
      }, [])

      useEffect(() => {
        let stopped = false
        const load = async () => {
          const [
            detectResult,
            historyResult,
            sessionsResult,
            claudeSessionsResult,
            usageResult,
          ] = await Promise.allSettled([
            request('/detect'),
            request('/history'),
            listSessions(),
            listClaudeSessions(),
            getUsage(),
          ])
          if (stopped) return
          if (detectResult.status === 'fulfilled') {
            setDetect(detectResult.value)
            setDetectError('')
          } else {
            const reason = detectResult.reason
            setDetectError(reason && reason.message ? reason.message : tt('detectionFailed'))
          }
          if (historyResult.status === 'fulfilled') {
            setHistory(
              Array.isArray(historyResult.value && historyResult.value.items)
                ? historyResult.value.items
                : [],
            )
          }
          if (sessionsResult.status === 'fulfilled') {
            setAllSessions(
              Array.isArray(sessionsResult.value && sessionsResult.value.items)
                ? sessionsResult.value.items
                : [],
            )
          }
          if (claudeSessionsResult.status === 'fulfilled') {
            setClaudeSessions(
              Array.isArray(claudeSessionsResult.value && claudeSessionsResult.value.items)
                ? claudeSessionsResult.value.items
                : [],
            )
          }
          if (usageResult.status === 'fulfilled' && usageResult.value) {
            setUsage((current) => ({ ...current, ...usageResult.value }))
          }
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
            setBackgroundJobs((current) => current.map((item) => item.id === data.job.id ? data.job : item))
            if (data.job.state === 'running') timer = setTimeout(tick, 1000)
          } catch {
            if (stopped) return
            timer = setTimeout(tick, 2500)
          }
        }
        timer = setTimeout(tick, 800)
        return () => {
          stopped = true
          clearTimeout(timer)
        }
      }, [job && job.id, job && job.state])

      async function startBackgroundJob(kind, payload) {
        const response = await request('/jobs', { method: 'POST', body: JSON.stringify({ kind, ...payload }) })
        setJob(response.job)
        setBackgroundJobs((current) => [response.job, ...current.filter((item) => item.id !== response.job.id)])
        return response.job
      }

      async function cancelBackgroundJob(id) {
        try {
          const response = await request('/jobs/cancel', { method: 'POST', body: JSON.stringify({ id }) })
          if (response.job) {
            setJob((current) => current?.id === id ? response.job : current)
            setBackgroundJobs((current) => current.map((item) => item.id === id ? response.job : item))
          }
        } catch (error) { fail(error.message, error.hint) }
      }

      async function resumeBackgroundJob(item) {
        if (!item) return
        let detail = item
        try {
          const response = await request(`/jobs?id=${encodeURIComponent(item.id)}`)
          if (response.job) detail = response.job
        } catch {}
        if (['error', 'interrupted', 'cancelled'].includes(detail.state)) {
          try {
            const response = await request('/jobs/retry', { method: 'POST', body: JSON.stringify({ id: detail.id }) })
            setJob(response.job)
            setBackgroundJobs((current) => [response.job, ...current.filter((entry) => entry.id !== response.job.id)])
            return
          } catch (error) { fail(error.message, error.hint); return }
        }
        if (detail.kind === 'first-question') {
          setFirstQuestion({ entry: { sessionId: detail.payload?.sessionId || '', projectDir: detail.payload?.projectDir || '', title: detail.payload?.title || '' }, requirement: detail.payload?.requirement || '', busy: detail.state === 'running', error: detail.error || '', generated: detail.state === 'done' ? detail.result : null, answer: detail.payload?.answer || '', draft: detail.payload?.draft || '', draftTemplate: detail.payload?.draftTemplate || '', draftEdited: Boolean(detail.payload?.draftEdited), jobId: detail.id })
          setActiveWorkspace('continue')
        } else if (detail.kind === 'acceptance' || detail.kind === 'acceptance-brief') {
          setDialog({ entry: detail.payload?.entry || { sessionId: detail.payload?.sessionId || '', projectDir: detail.payload?.projectDir || '', title: '' }, mode: detail.kind === 'acceptance' ? 'claude' : 'dsh', opinion: detail.payload?.opinion || '', busy: detail.state === 'running', result: detail.kind === 'acceptance' && detail.state === 'done' ? { overall: detail.result?.report?.overall, status: detail.result?.report?.status, reportPath: detail.result?.paths?.jsonPath } : null, error: detail.error || '', generated: detail.kind === 'acceptance-brief' && detail.state === 'done' ? detail.result : null, draft: detail.payload?.draft || detail.result?.brief || '', draftEdited: Boolean(detail.payload?.draftEdited), jobId: detail.id })
        } else if (detail.kind === 'devdoc') {
          setActiveWorkspace('devdoc')
          setRecordsOpen(false)
          setDevDocOpen(false)
          setDevDocBusy(detail.state === 'running' ? 'review' : '')
          if (detail.state === 'done') {
            const doc = detail.result.doc || detail.result
            setDevDoc(doc)
            setDevDocDraft(doc.content || '')
            setDevDocNotice(tt('devDocAiReviewNotice'))
          }
        }
        setJob(detail.state === 'running' ? detail : null)
      }

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
        } else if (job.kind === 'first-question') {
          setFirstQuestion((current) => current
            ? { ...current, busy: false, error: '', generated: job.result, answer: '', draft: String(job.result.draft || '').replaceAll('{{answer}}', '（待填写）'), draftTemplate: String(job.result.draft || ''), draftEdited: false }
            : current)
          refreshClaudeSessionList()
          refreshUsage()
        } else if (job.kind === 'acceptance-brief') {
          setDialog((current) => current
            ? { ...current, busy: false, generated: job.result, draft: String(job.result.brief || ''), draftEdited: false }
            : current)
          refreshClaudeSessionList()
          refreshUsage()
        } else if (job.kind === 'acceptance') {
          setDialog((current) => current
            ? { ...current, busy: false, result: { overall: job.result.report?.overall, status: job.result.report?.status, reportPath: job.result.paths?.jsonPath } }
            : current)
        } else if (job.kind === 'devdoc') {
          const doc = job.result.doc || job.result
          setDevDoc(doc)
          setDevDocDraft(doc.content || '')
          setDevDocBusy('')
          setDevDocConfirmed(false)
          setDevDocNotice(tt('devDocAiReviewNotice'))
        }
      }, [job && job.id, job && job.state, consumedJobId])

      useEffect(() => {
        if (!job || !['error', 'interrupted', 'cancelled'].includes(job.state)) return
        const message = job.state === 'interrupted' ? '任务因 Host 重启而中断，可重试。' : job.error || (job.state === 'cancelled' ? tt('cancelled') : '')
        if (job.kind === 'first-question') {
          setFirstQuestion((current) => current ? { ...current, busy: false, error: message } : current)
        } else if (job.kind === 'acceptance' || job.kind === 'acceptance-brief') {
          setDialog((current) => current ? { ...current, busy: false, error: message } : current)
        } else if (job.kind === 'devdoc') {
          setDevDocBusy('')
          setDevDocError(message)
        }
      }, [job && job.id, job && job.state])

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

      const activeSessionId = (() => {
        try {
          return typeof currentSessionId === 'function'
            ? currentSessionId()
            : currentSessionId || ''
        } catch {
          return ''
        }
      })()
      const sortedSessions = useMemo(
        () =>
          [...allSessions].sort(
            (left, right) => (right.updatedAt || 0) - (left.updatedAt || 0),
          ),
        [allSessions],
      )
      const liveSessions = useMemo(
        () => new Map(allSessions.map((session) => [session.sessionId, session])),
        [allSessions],
      )
      const visibleJobs = useMemo(
        () => backgroundJobs.filter((item) => ['running', 'interrupted', 'error'].includes(item.state)
          || (item.state === 'done' && ['first-question', 'acceptance-brief', 'acceptance', 'devdoc'].includes(item.kind))).slice(0, 4),
        [backgroundJobs],
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
          const started = await startBackgroundJob('brief', {
            projectDir: form.projectDir,
            projectName: form.projectName,
            goal: form.goal,
            permissionMode: form.permissionMode,
          })
          setBrief(null)
          setRefined(null)
          setPromptText('')
          setAnswer('')
          setPhase('brief')
        } catch (error) {
          fail(error.message, error.hint)
        }
      }

      async function cancelJob() {
        if (!job) return
        await cancelBackgroundJob(job.id)
      }

      async function submitAnswer() {
        if (answer.trim().length === 0) {
          fail(tt('requiredAnswer'))
          return
        }
        setNotice(null)
        try {
          await startBackgroundJob('refine', {
            projectDir: form.projectDir,
            projectName: form.projectName,
            goal: form.goal,
            permissionMode: form.permissionMode,
            brief,
            answer,
          })
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
          refreshClaudeSessionList()
          refreshUsage()
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

      function recordKindLabel(kind) {
        if (kind === 'first-question') return tt('recordFirst')
        if (kind === 'first-question-sent') return tt('recordFirstSent')
        if (kind === 'dispatch') return tt('recordDispatch')
        if (kind === 'acceptance') return tt('recordAcceptance')
        if (kind === 'devdoc') return tt('devDoc')
        return kind
      }

      async function openDevDoc() {
        setDevDocConfirmed(false)
        setActiveWorkspace('devdoc')
        setRecordsOpen(false)
        setDevDocOpen(false)
        setDevDocError('')
        setDevDocNotice('')
        setRecordBusy(true)
        try {
          const [sessionsResult, docResult] = await Promise.allSettled([
            listSessions(),
            form.projectDir ? getDevDoc(form.projectDir) : Promise.resolve({ doc: null }),
          ])
          if (sessionsResult.status === 'fulfilled') setAllSessions(sessionsResult.value.items || [])
          if (docResult.status === 'fulfilled') {
            setDevDoc(docResult.value?.doc || null)
            setDevDocDraft(docResult.value?.doc?.content || '')
          } else {
            setDevDocError(docResult.reason?.message || '')
          }
        } catch (error) {
          setDevDocError(error.message)
        } finally {
          setRecordBusy(false)
        }
      }

      async function selectAcceptance(item) {
        if (!item || !item.sessionId) return
        setRecordBusy(true)
        try {
          const payload = await request(`/acceptance?id=${encodeURIComponent(item.sessionId)}`)
          setAcceptanceSelected(payload)
          const failed = (payload.report?.checks || []).filter((check) => check.conclusion !== 'pass')
          setReworkDraft(failed.map((check) => `${check.id}：${check.name}\n请修复：${check.note || '补充可验证证据。'}`).join('\n\n'))
        } catch (error) {
          setRecordError(error.message)
        } finally {
          setRecordBusy(false)
        }
      }

      async function openRecords() {
        setActiveWorkspace('records')
        setRecordsOpen(true)
        setRecordSelected(null)
        setReviewSelected(null)
        setAcceptanceSelected(null)
        setDevDocOpen(false)
        setDevDocError('')
        setDevDocNotice('')
        setRecordBusy(true)
        setRecordError('')
        try {
          const [recordsResult, sessionsResult, reviewsResult, devDocResult, acceptanceResult] =
            await Promise.allSettled([
              listRecords(),
              listClaudeSessions(),
              getReviews(),
              form.projectDir ? getDevDoc(form.projectDir) : Promise.resolve({ doc: null }),
              request('/acceptance/list'),
            ])
          if (recordsResult.status === 'fulfilled') {
            setRecordItems(
              Array.isArray(recordsResult.value.items) ? recordsResult.value.items : [],
            )
          } else {
            setRecordError(recordsResult.reason?.message || '')
          }
          if (sessionsResult.status === 'fulfilled') {
            setClaudeSessions(
              Array.isArray(sessionsResult.value.items) ? sessionsResult.value.items : [],
            )
          }
          if (reviewsResult.status === 'fulfilled') {
            setReviewEntries(
              Array.isArray(reviewsResult.value.entries) ? reviewsResult.value.entries : [],
            )
          }
          if (acceptanceResult.status === 'fulfilled') {
            setAcceptanceEntries(
              Array.isArray(acceptanceResult.value.items) ? acceptanceResult.value.items : [],
            )
          }
          if (devDocResult.status === 'fulfilled') {
            setDevDoc(devDocResult.value && devDocResult.value.doc ? devDocResult.value.doc : null)
            setDevDocDraft(
              devDocResult.value && devDocResult.value.doc
                ? devDocResult.value.doc.content || ''
                : '',
            )
          }
        } catch (error) {
          setRecordError(error.message)
        } finally {
          setRecordBusy(false)
        }
      }

      async function viewRecord(id) {
        setRecordBusy(true)
        setRecordError('')
        try {
          const data = await readRecord(id)
          setRecordSelected(data.record)
        } catch (error) {
          setRecordError(error.message)
        } finally {
          setRecordBusy(false)
        }
      }

      async function removeClaudeSession(key) {
        setDeletingKey(key)
        setRecordError('')
        try {
          await deleteClaudeSession({ key })
          setClaudeSessions((current) => current.filter((item) => item.key !== key))
          setDeleteConfirmKey('')
        } catch (error) {
          setRecordError(error.message)
        } finally {
          setDeletingKey('')
        }
      }

      function closeRecords() {
        setActiveWorkspace('new')
        setRecordsOpen(false)
        setRecordSelected(null)
        setReviewSelected(null)
        setAcceptanceSelected(null)
        setDevDocOpen(false)
      }

      function criteriaForReport(report) {
        const task = report?.task?.summary || ''
        const match = task.match(/(?:验收标准|验收条件|Acceptance criteria)[:：]?([\s\S]{0,5000})/i)
        if (!match) return []
        const criteria = match[1]
          .split(/\r?\n/)
          .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)]|[A-Z]\d+[.:：])\s*/, '').trim())
          .filter(Boolean)
          .slice(0, 20)
        const checks = Array.isArray(report.checks) ? report.checks : []
        return criteria.map((text, index) => {
          const id = `A${index + 1}`
          const matching = checks.find((check) => new RegExp(`\\b${id}\\b`, 'i').test(`${check.name || ''} ${check.note || ''}`))
          const conclusion = matching && Array.isArray(matching.evidence) && matching.evidence.length
            ? matching.conclusion
            : 'uncertain'
          return { id, text, conclusion }
        })
      }

      function devDocStatusLabel(status) {
        if (status === 'approved') return tt('devDocApproved')
        if (status === 'rejected') return tt('devDocRejected')
        if (status === 'needs_info') return tt('devDocNeedsInfo')
        return tt('devDocDraft')
      }

      function downloadText(filename, content) {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      }

      async function exportDevDocTemplate() {
        setDevDocBusy('template')
        setDevDocError('')
        try {
          const data = await getDevDocTemplate({
            projectDir: form.projectDir,
            projectName: form.projectName,
            goal: form.goal,
          })
          downloadText(data.filename || '开发文档模板.md', data.content || '')
          setDevDocNotice(tt('devDocTemplateExported'))
        } catch (error) {
          setDevDocError(error.message)
        } finally {
          setDevDocBusy('')
        }
      }

      function exportCurrentDevDoc() {
        const content = devDocDraft || (devDoc && devDoc.content) || ''
        if (!content.trim()) {
          setDevDocError(tt('devDocEmpty'))
          return
        }
        downloadText(`${form.projectName || '项目'}-开发文档.md`, content)
      }

      async function importDevDocFile() {
        setDevDocConfirmed(false)
        if (!form.projectDir) {
          setDevDocError(tt('devDocNeedProject'))
          return
        }
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.md,.markdown,.txt,text/markdown,text/plain'
        input.onchange = async () => {
          const file = input.files && input.files[0]
          if (!file) return
          setDevDocBusy('import')
          setDevDocError('')
          try {
            const content = await file.text()
            const data = await saveDevDoc({
              projectDir: form.projectDir,
              title: form.projectName,
              content,
            })
            setDevDoc(data.doc)
            setDevDocDraft(data.doc.content || '')
            setDevDocNotice(tt('devDocImported'))
          } catch (error) {
            setDevDocError(error.message)
          } finally {
            setDevDocBusy('')
          }
        }
        input.click()
      }

      async function saveCurrentDevDoc() {
        if (!form.projectDir) {
          setDevDocError(tt('devDocNeedProject'))
          return
        }
        setDevDocBusy('save')
        setDevDocError('')
        try {
          const data = await saveDevDoc({
            projectDir: form.projectDir,
            title: form.projectName,
            content: devDocDraft,
          })
          setDevDoc(data.doc)
          setDevDocDraft(data.doc.content || '')
          setDevDocNotice(tt('devDocSaved'))
        } catch (error) {
          setDevDocError(error.message)
        } finally {
          setDevDocBusy('')
        }
      }

      async function reviewCurrentDevDoc() {
        if (!form.projectDir) {
          setDevDocError(tt('devDocNeedProject'))
          return
        }
        setDevDocConfirmed(false)
        setDevDocBusy('review')
        setDevDocError('')
        setDevDocNotice('')
        try {
          const validation = await request('/devdoc/validate', {
            method: 'POST',
            body: JSON.stringify({ content: devDocDraft }),
          })
          if (!validation.valid) {
            setDevDocError(
              `${tt('devDocUnresolved')}：${[...(validation.missing || []), ...(validation.placeholders || [])].join('、')}`,
            )
            setDevDocBusy('')
            return
          }
          await startBackgroundJob('devdoc', {
            projectDir: form.projectDir,
            projectName: form.projectName,
            title: form.projectName,
            content: devDocDraft,
          })
        } catch (error) {
          setDevDocBusy('')
          setDevDocError(error.message)
        }
      }

      async function deliverCurrentDevDoc() {
        if (!form.projectDir) {
          setDevDocError(tt('devDocNeedProject'))
          return
        }
        if (!devDoc || devDoc.status !== 'approved' || !devDocConfirmed || devDocDraft !== devDoc.content || normalizeProject(devDoc.projectDir) !== normalizeProject(form.projectDir)) {
          setDevDocError(tt('devDocNotApproved'))
          return
        }
        setDevDocBusy('send')
        setDevDocError('')
        try {
          const result = await sendDevDoc({
            projectDir: form.projectDir,
            sessionId: devDocSession,
            confirmedHash: devDoc.approvedHash,
          })
          setToast(
            result.existing ? tt('devDocSentExisting') : tt('devDocSentNew'),
          )
          if (result.sessionId) openSession(result.sessionId)
          closeRecords()
        } catch (error) {
          setDevDocError(error.message)
        } finally {
          setDevDocBusy('')
        }
      }

      function renderDevDocView() {
        const status = devDoc ? devDoc.status : 'draft'
        const sessions = allSessions
          .filter(
            (item) =>
              !item.cwd ||
              normalizeProject(item.cwd) === normalizeProject(form.projectDir || ''),
          )
          .slice(0, 40)
        return h(
          'div',
          { className: 'cc-devDoc' },
          h(
            'div',
            { className: 'cc-devDocHead' },
            h(
              'div',
              { className: 'cc-devDocTitle' },
              h('span', { className: 'cc-cardTitle' }, tt('devDoc')),
              h(
                'span',
                { className: `cc-devDocStatus ${status}` },
                devDocStatusLabel(status),
              ),
            ),
            h(
              Button,
              { variant: 'link', onClick: () => setActiveWorkspace('new') },
              tt('recordsBack'),
            ),
          ),
          h(
            'div',
            { className: 'cc-actions' },
            h(
              Button,
              {
                variant: 'ghost',
                busy: devDocBusy === 'template',
                onClick: exportDevDocTemplate,
              },
              tt('devDocExportTemplate'),
            ),
            h(
              Button,
              { variant: 'ghost', busy: devDocBusy === 'import', onClick: importDevDocFile },
              tt('devDocImport'),
            ),
            h(
              Button,
              {
                variant: 'ghost',
                busy: devDocBusy === 'save',
                onClick: saveCurrentDevDoc,
                disabled: !form.projectDir,
              },
              tt('devDocSave'),
            ),
            devDocDraft.trim()
              ? h(Button, { variant: 'link', onClick: exportCurrentDevDoc }, tt('devDocExportCurrent'))
              : null,
          ),
          form.projectDir
            ? h('div', { className: 'cc-hint' }, `${tt('devDocProject')}：${form.projectDir}`)
            : h('div', { className: 'cc-inlineWarn' }, tt('devDocNeedProject')),
          h('textarea', {
            className: 'cc-textarea cc-devDocEditor',
            value: devDocDraft,
            spellCheck: false,
            placeholder: tt('devDocPlaceholder'),
            onChange: (event) => {
              const value = event.target.value
              setDevDocDraft(value)
              setDevDocConfirmed(false)
              if (devDoc) setDevDoc({ ...devDoc, status: 'draft' })
            },
          }),
          h(
            'div',
            { className: 'cc-actions' },
            h(
              Button,
              {
                variant: 'primary',
                busy: devDocBusy === 'review',
                disabled: !form.projectDir || !devDocDraft.trim() || Boolean(devDocBusy),
                onClick: reviewCurrentDevDoc,
              },
              tt('devDocReview'),
            ),
            h(
              Button,
              {
                variant: 'primary',
                busy: devDocBusy === 'send',
                disabled:
                  !form.projectDir || !devDoc || devDoc.status !== 'approved' || !devDocConfirmed || devDocDraft !== devDoc.content || normalizeProject(devDoc.projectDir) !== normalizeProject(form.projectDir) || Boolean(devDocBusy),
                onClick: deliverCurrentDevDoc,
              },
              tt('devDocSend'),
            ),
          ),
          devDoc && devDoc.status === 'approved'
            ? h(
                'label',
                { className: 'cc-switch' },
                h('input', {
                  type: 'checkbox',
                  checked: devDocConfirmed,
                  onChange: (event) => setDevDocConfirmed(event.target.checked),
                }),
                tt('devDocConfirmDelivery'),
              )
            : null,
          h(
            'label',
            { className: 'cc-field' },
            h('span', { className: 'cc-label' }, tt('devDocTarget')),
            h(
              'select',
              {
                className: 'cc-select',
                value: devDocSession,
                onChange: (event) => setDevDocSession(event.target.value),
              },
              h('option', { value: '' }, tt('devDocNewSession')),
              sessions.map((item) =>
                h(
                  'option',
                  { value: item.sessionId, key: item.sessionId },
                  `${item.title || item.sessionId} · ${item.sessionId.slice(0, 8)}`,
                ),
              ),
            ),
          ),
          devDocError
            ? h('div', { className: 'cc-notice' }, h('div', { className: 'cc-noticeBody' }, devDocError))
            : null,
          devDocNotice ? h('div', { className: 'cc-inlineWarn' }, devDocNotice) : null,
          devDoc && devDoc.status !== 'draft'
            ? h(
                'div',
                { className: 'cc-devDocReview' },
                h(
                  'div',
                  { className: 'cc-devDocVerdict' },
                  `${tt('devDocVerdict')}：${String(devDoc.verdict || '').toUpperCase()}`,
                  devDoc.summary ? h('p', null, devDoc.summary) : null,
                ),
                Array.isArray(devDoc.blockers) && devDoc.blockers.length
                  ? h(
                      'div',
                      null,
                      h('div', { className: 'cc-label' }, tt('devDocBlockers')),
                      h(
                        'ul',
                        { className: 'cc-ul' },
                        devDoc.blockers.map((item, index) => h('li', { key: index }, item)),
                      ),
                    )
                  : null,
                Array.isArray(devDoc.questions) && devDoc.questions.length
                  ? h(
                      'div',
                      null,
                      h('div', { className: 'cc-label' }, tt('devDocQuestions')),
                      h(
                        'ul',
                        { className: 'cc-ul' },
                        devDoc.questions.map((item, index) => h('li', { key: index }, item)),
                      ),
                    )
                  : null,
                h(
                  'div',
                  { className: 'cc-devDocDepartments' },
                  (devDoc.departments || []).map((item) =>
                    h(
                      'div',
                      { className: `cc-devDocDept ${item.decision}`, key: item.id },
                      h('strong', null, item.name),
                      h(
                        'span',
                        null,
                        item.decision === 'approve'
                          ? tt('devDocApprove')
                          : item.decision === 'needs_info'
                            ? tt('devDocNeedsInfoDecision')
                            : item.decision === 'not_applicable'
                              ? tt('devDocNotApplicable')
                              : tt('devDocReject'),
                      ),
                      h('small', null, item.reason),
                    ),
                  ),
                ),
              )
            : null,
        )
      }

      function openCurrentFirstQuestion() {
        let current = ''
        try {
          current =
            typeof currentSessionId === 'function' ? currentSessionId() : currentSessionId || ''
        } catch {}
        const target = current || (sortedSessions[0] && sortedSessions[0].sessionId) || ''
        const item = sortedSessions.find((session) => session.sessionId === target)
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
          draft: '',
          draftTemplate: '',
          draftEdited: false,
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
          const started = await startBackgroundJob('first-question', {
            sessionId: firstQuestion.entry.sessionId,
            projectDir: firstQuestion.entry.projectDir,
            title: firstQuestion.entry.title,
            requirement: firstQuestion.requirement,
            answer: firstQuestion.answer,
            draft: firstQuestion.draft,
            draftTemplate: firstQuestion.draftTemplate,
            draftEdited: firstQuestion.draftEdited,
          })
          setFirstQuestion((current) => current ? { ...current, busy: true, jobId: started.id } : current)
        } catch (error) {
          setFirstQuestion((current) =>
            current ? { ...current, busy: false, error: error.message } : current,
          )
        }
      }

      async function sendFirstQuestionToDsh() {
        if (!firstQuestion || !firstQuestion.generated) return
        if (
          !firstQuestion.answer.trim() &&
          !(firstQuestion.draftEdited && firstQuestion.draft.trim())
        ) {
          setFirstQuestion((current) =>
            current ? { ...current, error: tt('firstQuestionContentRequired') } : current,
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
            message: firstQuestion.draft,
          })
          setToast(tt('firstQuestionDone'))
          refreshClaudeSessionList()
          refreshUsage()
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
        setDialog({
          entry,
          mode: entry.mode || 'claude',
          opinion: entry.opinion || '',
          busy: false,
          result: null,
          error: '',
          generated: null,
          draft: '',
          draftEdited: false,
        })
      }

      async function confirmAcceptance() {
        if (!dialog) return
        const { entry, mode, opinion } = dialog
        setDialog((current) => (current ? { ...current, busy: true, error: '' } : current))
        try {
          if (mode === 'dsh') {
            if (!dialog.generated) {
              const started = await startBackgroundJob('acceptance-brief', {
                projectDir: entry.projectDir || form.projectDir,
                sessionId: entry.sessionId,
                opinion,
                entry,
                draft: dialog.draft,
                draftEdited: dialog.draftEdited,
              })
              setDialog((current) => current ? { ...current, busy: true, jobId: started.id } : current)
              return
            }
            if (!dialog.draft.trim()) {
              setDialog((current) =>
                current
                  ? { ...current, busy: false, error: tt('acceptanceDraftRequired') }
                  : current,
              )
              return
            }
            const data = await sendAcceptanceDispatch({
              sessionId: entry.sessionId,
              message: dialog.draft,
            })
            setToast(tt('dshAcceptOpened'))
            setDialog(null)
            setRecordsOpen(false)
            setAcceptanceSelected(null)
            try {
              await refreshSessions(data.sessionId)
            } catch {}
            openSession(data.sessionId)
          } else {
            const started = await startBackgroundJob('acceptance', { sessionId: entry.sessionId, opinion, entry })
            setDialog((current) => current ? { ...current, busy: true, jobId: started.id } : current)
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
        const dispatchedLive = dispatch.sessionId ? liveSessions.get(dispatch.sessionId) : undefined
        rightCard = h(
          'div',
          { className: 'cc-card' },
          h(
            'div',
            { className: 'cc-success' },
            h(
              'div',
              { className: 'cc-successHead' },
              h('div', { className: 'cc-successTitle' }, tt('dispatched')),
              dispatchedLive && dispatchedLive.running
                ? h('span', { className: 'cc-badge on' }, tt('sessionRunning'))
                : null,
            ),
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
            h('div', { className: 'cc-hint' }, tt('sessionOpenHint')),
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
      function refreshUsage() {
        getUsage()
          .then((data) => {
            if (data) setUsage((current) => ({ ...current, ...data }))
          })
          .catch(() => {})
      }

      function refreshClaudeSessionList() {
        listClaudeSessions()
          .then((data) =>
            setClaudeSessions(Array.isArray(data && data.items) ? data.items : []),
          )
          .catch(() => {})
      }

      async function resetCurrentClaudeSession(item) {
        if (!item) return
        if (!window.confirm(tt('sessionResetConfirm'))) return
        try {
          await resetClaudeSession({ key: item.key })
          setClaudeSessions((current) => current.filter((entry) => entry.key !== item.key))
          setToast(tt('sessionResetDone'))
        } catch (error) {
          fail(error.message)
        }
      }

      let main
      const normalizeProject = (value) =>
        String(value || '')
          .replace(/\//g, '\\')
          .replace(/\\+$/, '')
          .toLowerCase()
      const currentClaude = form.projectDir
        ? claudeSessions.find(
            (item) => normalizeProject(item.cwd) === normalizeProject(form.projectDir),
          )
        : null
      const currentProjectName =
        String(form.projectDir || '')
          .split(/[\\/]/)
          .filter(Boolean)
          .pop() || ''
      const claudeUseLabel = (label) => {
        const labels = {
          plan: '规划',
          refine: '定稿',
          'first-question': '首问',
          acceptance: '验收',
          review: '验收意见',
          'acceptance-brief': '验收任务书',
        }
        return labels[label] || label || '最近使用'
      }
      if (activeWorkspace === 'devdoc') {
        main = h('div', { className: 'cc-devDocWorkspace' }, renderDevDocView())
      } else if (activeWorkspace === 'continue' && !firstQuestion) {
        main = h(
          'section',
          { className: 'cc-card cc-sessionWorkspace' },
          h('div', { className: 'cc-cardTitle' }, tt('workspaceContinue')),
          h('input', {
            className: 'cc-input', type: 'search', value: sessionSearch, placeholder: tt('sessionSearch'),
            onChange: (event) => setSessionSearch(event.target.value),
          }),
          h('div', { className: 'cc-sessionPicker' }, sortedSessions.filter((item) => {
            const query = sessionSearch.trim().toLowerCase()
            return !query || `${item.title || ''} ${item.cwd || ''} ${item.sessionId}`.toLowerCase().includes(query)
          }).slice(0, 80).map((item) => h(
            'button',
            { type: 'button', key: item.sessionId, className: 'cc-sessionPick', onClick: () => openFirstQuestionDialog({ sessionId: item.sessionId, projectDir: item.cwd, title: (item.cwd || '').split(/[\\/]/).filter(Boolean).pop() || item.sessionId }) },
            h('span', { className: 'cc-recordTitle' }, (item.cwd || '').split(/[\\/]/).filter(Boolean).pop() || item.cwd || item.sessionId),
            h('span', { className: 'cc-sessionPickerMeta' }, `${item.running ? tt('sessionRunning') : timeAgo(item.updatedAt, tt)} · ${item.sessionId.slice(-6)}`),
          ))),
        )
      } else if (phase === 'dispatched') {
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
            currentClaude
              ? h(
                  'span',
                  {
                    className: 'cc-sessionChip',
                    title: `${currentClaude.sessionId}\n${currentClaude.cwd || ''}`,
                  },
                  h('i', { className: 'cc-dot on' }),
                  h(
                    'span',
                    { className: 'cc-sessionName' },
                    `${currentProjectName} · ${currentClaude.sessionId.slice(0, 8)}`,
                  ),
                  h('span', { className: 'cc-sessionUse' }, claudeUseLabel(currentClaude.label)),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'cc-sessionReset',
                      onClick: () => resetCurrentClaudeSession(currentClaude),
                    },
                    tt('sessionReset'),
                  ),
                )
              : null,
            h(
              'span',
              {
                className: `cc-budgetChip${usage.over ? ' over' : ''}`,
                title: `Claude CLI 今日 ${usage.calls || 0} 次`,
              },
              `今日 $${Number(usage.costUsd || 0).toFixed(2)} / ${
                Number(usage.budgetUsd || 0) > 0
                  ? `$${Number(usage.budgetUsd).toFixed(2)}`
                  : '不限'
              }`,
            ),
          ),
        ),
        h(
          'div',
          { className: 'cc-panelToolbar' },
          h(
            'div',
            { className: 'cc-modeTabs', role: 'tablist', 'aria-label': tt('workspaceModes') },
            [
              ['new', tt('workspaceNew')],
              ['continue', tt('workspaceContinue')],
              ['devdoc', tt('devDoc')],
            ].map(([mode, label]) => h(
              'button',
              {
                type: 'button', key: mode, role: 'tab',
                'aria-selected': activeWorkspace === mode,
                className: activeWorkspace === mode ? 'on' : '',
                onClick: () => {
                  if (mode === 'devdoc') openDevDoc()
                  else {
                    setActiveWorkspace(mode)
                    setRecordsOpen(false)
                    if (mode === 'continue') listSessions().then((data) => setAllSessions(data.items || [])).catch(() => {})
                  }
                },
              },
              label,
            )),
          ),
          visibleJobs.length
            ? h(
                'div',
                { className: 'cc-backgroundJobs' },
                visibleJobs.map((item) => h(
                  'div',
                  { className: 'cc-backgroundJob', key: item.id },
                  h('span', null, `${item.phase || item.kind} · ${item.state}`),
                  item.state === 'running' ? h(Button, { variant: 'link', onClick: () => cancelBackgroundJob(item.id) }, tt('cancel')) : null,
                  h(Button, { variant: 'link', onClick: () => resumeBackgroundJob(item) }, item.state === 'running' ? tt('jobOpen') : item.state === 'done' ? tt('jobDetails') : tt('retry')),
                )),
              )
            : null,
          h('div', { className: 'cc-toolbarActions' },
            h(Button, { variant: 'link', onClick: openRecords }, tt('records')),
          ),
        ),
        notice ? h(Notice, { notice, tt }) : null,
        main,
        h(
          'details',
          { className: 'cc-card cc-reviewSettings' },
          h(
            'summary',
            { className: 'cc-settingsSummary' },
            h('span', { className: 'cc-cardTitle' }, tt('reviewSettings')),
            h('span', { className: 'cc-hint' }, reviewSettings.defaultAction === 'claude' ? tt('defaultActionClaude') : tt('defaultActionNone')),
          ),
          h('div', { className: 'cc-reviewSettingsBody' },
          h(
            'label',
            { className: 'cc-switch' },
            h('input', {
              type: 'checkbox',
              checked: Boolean(reviewSettings.autoPrompt),
              onChange: (event) => {
                const value = event.target.checked
                setReviewSettings((current) => ({ ...current, autoPrompt: value }))
                saveSettings({ autoPrompt: value }).catch(() => {})
              },
            }),
            tt('autoPromptToggle'),
          ),
          h(
            'label',
            { className: 'cc-field' },
            h('span', { className: 'cc-label' }, tt('defaultActionLabel')),
            h(
              'select',
              {
                className: 'cc-select',
                value: reviewSettings.defaultAction,
                onChange: (event) => {
                  const value = event.target.value
                  setReviewSettings((current) => ({ ...current, defaultAction: value }))
                  saveSettings({ defaultAction: value }).catch(() => {})
                },
              },
              h('option', { value: 'none' }, tt('defaultActionNone')),
              h('option', { value: 'claude' }, tt('defaultActionClaude')),
            ),
          ),
          h(
            'details',
            { className: 'cc-advanced' },
            h('summary', null, tt('advancedSettings')),
            h(
              'label',
              { className: 'cc-field cc-budgetField' },
              h('span', { className: 'cc-label' }, tt('dailyBudgetLabel')),
              h('input', {
                className: 'cc-input',
                type: 'number',
                min: 0,
                step: 0.5,
                value: reviewSettings.dailyBudgetUsd,
                onChange: (event) => {
                  const value = Number(event.target.value)
                  const next = Number.isFinite(value) && value >= 0 ? value : 0
                  setReviewSettings((current) => ({ ...current, dailyBudgetUsd: next }))
                  saveSettings({ dailyBudgetUsd: next }).catch(() => {})
                  refreshUsage()
                },
              }),
              h('span', { className: 'cc-hint' }, tt('dailyBudgetHint')),
            ),
          ),
          ),
        ),
        h(
          'details',
          { className: 'cc-historyDetails' },
          h('summary', null, `${tt('history')}（${history.length}）`),
          h(
            'div',
            { className: 'cc-history' },
            h('div', { className: 'cc-sectionTitle' }, tt('history')),
          history.length === 0
            ? h('div', { className: 'cc-hint' }, tt('historyEmpty'))
            : h(
                'ul',
                { className: 'cc-historyList' },
                history.slice(0, 6).map((entry) => {
                  const live = entry.sessionId ? liveSessions.get(entry.sessionId) : undefined
                  return h(
                    'li',
                    { key: entry.id || `${entry.sessionId}-${entry.at}` },
                    h(
                      'div',
                      { className: 'cc-historyMain' },
                      h(
                        'div',
                        { className: 'cc-historyTitleRow' },
                        h(
                          'span',
                          { className: 'cc-historyTitle' },
                          entry.title || entry.projectDir || '',
                        ),
                        entry.source === 'first-question'
                          ? h('span', { className: 'cc-badge' }, tt('firstQuestion'))
                          : null,
                        live && live.running
                          ? h('span', { className: 'cc-badge on' }, tt('sessionRunning'))
                          : null,
                      ),
                      h('span', { className: 'cc-historyPath' }, entry.projectDir || ''),
                    ),
                    h(
                      'span',
                      { className: 'cc-historyTime', title: timeText(entry.at) },
                      timeAgo(entry.at, tt),
                    ),
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
                  )
                }),
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
                firstQuestion.generated
                  ? null
                  : h(
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
                                draft: '',
                                draftTemplate: '',
                                draftEdited: false,
                              }
                            : current,
                        )
                      },
                    },
                    h('option', { value: '' }, tt('existingPick')),
                    !firstQuestion.entry.sessionId ||
                    sortedSessions.some(
                      (item) => item.sessionId === firstQuestion.entry.sessionId,
                    )
                      ? null
                      : h(
                          'option',
                          { value: firstQuestion.entry.sessionId },
                          `${firstQuestion.entry.title || firstQuestion.entry.sessionId} · ${tt('currentSession')}`,
                        ),
                    sortedSessions.map((item) => {
                      const label = [
                        item.sessionId === activeSessionId ? `[${tt('currentSession')}]` : '',
                        (item.cwd || '').split(/[\\/]/).filter(Boolean).pop() || item.cwd,
                        item.running ? tt('sessionRunning') : timeAgo(item.updatedAt, tt),
                        item.sessionId.slice(-6),
                      ]
                        .filter(Boolean)
                        .join(' · ')
                      return h('option', { value: item.sessionId, key: item.sessionId }, label)
                    }),
                  ),
                ),
                firstQuestion.generated
                  ? null
                  : h(
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
                                    setFirstQuestion((current) => {
                                      if (!current) return current
                                      const next = { ...current, answer: choice }
                                      if (!current.draftEdited && current.draftTemplate) {
                                        next.draft = current.draftTemplate.replaceAll(
                                          '{{answer}}',
                                          choice,
                                        )
                                      }
                                      return next
                                    }),
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
                          onChange: (event) => {
                            const value = event.target.value
                            setFirstQuestion((current) => {
                              if (!current) return current
                              const next = { ...current, answer: value }
                              if (!current.draftEdited && current.draftTemplate) {
                                next.draft = current.draftTemplate.replaceAll(
                                  '{{answer}}',
                                  value || '（待填写）',
                                )
                              }
                              return next
                            })
                          },
                        }),
                      ),
                      h(
                        'label',
                        { className: 'cc-field cc-draftField' },
                        h('span', { className: 'cc-label' }, tt('firstQuestionDraft')),
                        h('div', { className: 'cc-hint' }, tt('firstQuestionDraftHint')),
                        h('textarea', {
                          className: 'cc-textarea cc-draft',
                          rows: 8,
                          value: firstQuestion.draft,
                          placeholder: tt('firstQuestionDraftPlaceholder'),
                          onChange: (event) =>
                            setFirstQuestion((current) =>
                              current
                                ? { ...current, draft: event.target.value, draftEdited: true }
                                : current,
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
                    {
                      variant: 'link',
                      onClick: firstQuestion.busy && firstQuestion.jobId
                        ? async () => {
                            await cancelBackgroundJob(firstQuestion.jobId)
                            setFirstQuestion((current) => current ? { ...current, busy: false } : current)
                          }
                        : closeFirstQuestion,
                    },
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
                dialog.mode === 'dsh' && dialog.generated
                  ? null
                  : h(
                  'div',
                  { className: 'cc-seg' },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: dialog.mode === 'claude' ? 'on' : '',
                      onClick: () =>
                        setDialog((current) =>
                          current
                            ? {
                                ...current,
                                mode: 'claude',
                                result: null,
                                error: '',
                                generated: null,
                                draft: '',
                                draftEdited: false,
                              }
                            : current,
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
                          current
                            ? {
                                ...current,
                                mode: 'dsh',
                                result: null,
                                error: '',
                                generated: null,
                                draft: '',
                                draftEdited: false,
                              }
                            : current,
                        ),
                    },
                    tt('acceptanceModeDsh'),
                  ),
                ),
                dialog.mode === 'dsh' && dialog.generated
                  ? null
                  : h(
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
                dialog.mode === 'dsh' && dialog.generated
                  ? h(
                      'label',
                      { className: 'cc-field cc-draftField' },
                      h('span', { className: 'cc-label' }, tt('acceptanceDraft')),
                      h('div', { className: 'cc-hint' }, tt('acceptanceDraftHint')),
                      h('textarea', {
                        className: 'cc-textarea cc-draft',
                        rows: 10,
                        value: dialog.draft,
                        placeholder: tt('acceptanceDraftPlaceholder'),
                        onChange: (event) =>
                          setDialog((current) =>
                            current
                              ? { ...current, draft: event.target.value, draftEdited: true }
                              : current,
                          ),
                      }),
                    )
                  : null,
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
                    dialog.busy
                      ? tt('acceptanceRunning')
                      : dialog.mode === 'dsh'
                        ? dialog.generated
                          ? tt('acceptanceSendDsh')
                          : tt('acceptanceGenerate')
                        : tt('acceptanceStart'),
                  ),
                  h(
                    Button,
                    { variant: 'ghost', onClick: closeDialog },
                    tt('acceptanceSkip'),
                  ),
                  h(
                    Button,
                    {
                      variant: 'link',
                      onClick: dialog.busy && dialog.jobId
                        ? async () => {
                            await cancelBackgroundJob(dialog.jobId)
                            setDialog((current) => current ? { ...current, busy: false } : current)
                          }
                        : closeDialog,
                    },
                    tt('acceptanceCancel'),
                  ),
                ),
            )
          : null,
        recordsOpen
          ? h(
              Modal,
              { title: tt('records'), onClose: closeRecords },
              devDocOpen
                ? renderDevDocView()
                : reviewSelected
                ? h(
                    'div',
                    { className: 'cc-recordView' },
                    h(
                      'div',
                      { className: 'cc-actions' },
                      h(
                        Button,
                        { variant: 'link', onClick: () => setReviewSelected(null) },
                        tt('recordsBack'),
                      ),
                    ),
                    h(
                      'div',
                      { className: 'cc-recordMeta' },
                      `${String(reviewSelected.verdict || 'uncertain').toUpperCase()} · ${
                        reviewSelected.source === 'acceptance' ? '直接验收' : '回合后意见'
                      } · ${timeAgo(reviewSelected.at, tt)}`,
                    ),
                    h(
                      'div',
                      { className: 'cc-recordMeta' },
                      `会话：${reviewSelected.sessionId || ''} · 消息：${reviewSelected.messageId || ''}`,
                    ),
                    h(
                      'div',
                      { className: 'cc-reviewOpinion' },
                      reviewSelected.opinion || reviewSelected.reason || '',
                    ),
                    Array.isArray(reviewSelected.evidence) && reviewSelected.evidence.length
                      ? h(
                          'div',
                          null,
                          h('div', { className: 'cc-label' }, '关键证据'),
                          h(
                            'ul',
                            { className: 'cc-reviewEvidence' },
                            reviewSelected.evidence.map((item, index) =>
                              h(
                                'li',
                                { key: `${index}-${String(item).slice(0, 16)}` },
                                item,
                              ),
                            ),
                          ),
                        )
                      : null,
                  )
                : acceptanceSelected
                ? h(
                    'div',
                    { className: 'cc-recordView' },
                    h('div', { className: 'cc-actions' }, h(Button, { variant: 'link', onClick: () => setAcceptanceSelected(null) }, tt('recordsBack'))),
                    h('div', { className: `cc-verdictBanner ${acceptanceSelected.report?.overall || 'uncertain'}` },
                      h('strong', null, String(acceptanceSelected.report?.overall || 'uncertain').toUpperCase()),
                      h('span', null, `${acceptanceSelected.report?.status || ''} · ${acceptanceSelected.title || acceptanceSelected.sessionId}`),
                    ),
                    h('div', { className: 'cc-recordMeta' }, `会话：${acceptanceSelected.sessionId} · ${acceptanceSelected.workspace || ''}`),
                    criteriaForReport(acceptanceSelected.report).map((criterion) => h(
                      'div', { className: `cc-accCheck ${criterion.conclusion}`, key: criterion.id },
                      h('div', { className: 'cc-accCheckName' }, `${criterion.id} · ${criterion.text}`),
                      h('div', { className: 'cc-hint' }, criterion.conclusion === 'pass' ? tt('criterionPass') : criterion.conclusion === 'fail' ? tt('criterionFail') : tt('criterionUnknown')),
                    )),
                    (acceptanceSelected.report?.checks || []).map((check) => h(
                      'div', { className: `cc-accCheck ${check.conclusion}`, key: check.id },
                      h('div', { className: 'cc-accCheckName' }, `${check.name || check.id} · ${check.conclusion}`),
                      h('div', { className: 'cc-hint' }, check.note || ''),
                    )),
                    acceptanceSelected.report?.rework?.length ? h('div', { className: 'cc-reviewOpinion' }, acceptanceSelected.report.rework.join('\n')) : null,
                    reworkDraft ? h(React.Fragment, null,
                      h('div', { className: 'cc-label' }, tt('reworkDraft')),
                      h('div', { className: 'cc-hint' }, tt('reworkDraftHint')),
                      h('textarea', { className: 'cc-textarea cc-draft', rows: 8, value: reworkDraft, onChange: (event) => setReworkDraft(event.target.value) }),
                      h(Button, { variant: 'primary', onClick: () => openAcceptanceDialog({ sessionId: acceptanceSelected.sessionId, projectDir: acceptanceSelected.workspace, title: acceptanceSelected.title, opinion: reworkDraft, mode: 'dsh' }) }, tt('reworkDraft')),
                    ) : null,
                    acceptanceSelected.reportPath ? h('code', { className: 'cc-code' }, acceptanceSelected.reportPath) : null,
                  )
                : recordSelected
                ? h(
                    'div',
                    { className: 'cc-recordView' },
                    h(
                      'div',
                      { className: 'cc-actions' },
                      h(
                        Button,
                        { variant: 'link', onClick: () => setRecordSelected(null) },
                        tt('recordsBack'),
                      ),
                    ),
                    h(
                      'div',
                      { className: 'cc-recordMeta' },
                      `${recordKindLabel(recordSelected.kind)} · ${timeAgo(recordSelected.at, tt)} · ${recordSelected.title || recordSelected.sessionId}`,
                    ),
                    h(
                      'div',
                      { className: 'cc-recordMeta' },
                      `Claude 会话：${recordSelected.claudeSessionId || '未记录'}`,
                    ),
                    h('pre', { className: 'cc-recordContent' }, recordSelected.content),
                  )
                : h(
                    'div',
                    { className: 'cc-recordList' },
                    recordBusy ? h('div', { className: 'cc-hint' }, tt('recordsLoading')) : null,
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'cc-recordItem cc-devDocEntry',
                        onClick: () => openDevDoc(),
                      },
                      h('span', { className: 'cc-recordKind' }, tt('devDoc')),
                      h(
                        'span',
                        { className: 'cc-recordTitle' },
                        devDoc
                          ? devDoc.title || tt('devDocFilled')
                          : tt('devDocEmpty'),
                      ),
                      h(
                        'span',
                        { className: `cc-devDocStatus ${devDoc ? devDoc.status : 'draft'}` },
                        devDocStatusLabel(devDoc ? devDoc.status : 'draft'),
                      ),
                    ),
                    h(
                      'div',
                      { className: 'cc-usageLine' },
                      `今日 Claude：$${Number(usage.costUsd || 0).toFixed(2)} / ${
                        Number(usage.budgetUsd || 0) > 0
                          ? `$${Number(usage.budgetUsd).toFixed(2)}`
                          : '不限'
                      }（${usage.calls || 0} 次）`,
                    ),
                    h(
                      'details',
                      { className: 'cc-claudeSessions' },
                      h(
                        'summary',
                        null,
                        `${tt('claudeSessions')}（${claudeSessions.length}）`,
                      ),
                      claudeSessions.length === 0
                        ? h('div', { className: 'cc-hint' }, tt('claudeSessionsEmpty'))
                        : claudeSessions.map((item) =>
                            h(
                              'div',
                              { className: 'cc-claudeSession', key: item.key || item.sessionId },
                              h(
                                'span',
                                { className: 'cc-recordTitle' },
                                (item.cwd || '').split(/[\\/]/).filter(Boolean).pop() ||
                                  item.cwd ||
                                  item.label ||
                                  '',
                              ),
                              h('code', { className: 'cc-claudeSessionId' }, item.sessionId),
                              h('span', { className: 'cc-recordTime' }, timeAgo(item.at, tt)),
                              h(
                                'div',
                                { className: 'cc-claudeSessionActions' },
                                deleteConfirmKey === item.key
                                  ? h(
                                      React.Fragment,
                                      null,
                                      h(
                                        Button,
                                        {
                                          variant: 'link',
                                          busy: deletingKey === item.key,
                                          onClick: () => removeClaudeSession(item.key),
                                        },
                                        tt('recordsDeleteYes'),
                                      ),
                                      h(
                                        Button,
                                        {
                                          variant: 'link',
                                          onClick: () => setDeleteConfirmKey(''),
                                        },
                                        tt('recordsDeleteNo'),
                                      ),
                                    )
                                  : h(
                                      Button,
                                      {
                                        variant: 'link',
                                        onClick: () => setDeleteConfirmKey(item.key),
                                      },
                                      tt('recordsDelete'),
                                    ),
                              ),
                            ),
                          ),
                    ),
                    h('div', { className: 'cc-sectionTitle' }, `${tt('acceptanceRecent')}（${acceptanceEntries.length}）`),
                    acceptanceEntries.length === 0
                      ? h('div', { className: 'cc-hint' }, tt('reviewListEmpty'))
                      : acceptanceEntries.map((item) => h(
                          'button',
                          { type: 'button', className: 'cc-reviewListItem', key: item.sessionId, onClick: () => selectAcceptance(item) },
                          h('span', { className: `cc-reviewBadge ${item.overall || 'uncertain'}` }, h('span', { className: 'cc-reviewBadgeVerdict' }, String(item.overall || 'uncertain').toUpperCase())),
                          h('span', { className: 'cc-recordTitle' }, item.title || item.sessionId),
                          h('span', { className: 'cc-recordTime' }, timeAgo(Date.parse(item.generatedAt), tt)),
                        )),
                    h(
                      'div',
                      { className: 'cc-sectionTitle' },
                      `${tt('reviewList')}（${reviewEntries.length}）`,
                    ),
                    reviewEntries.length === 0
                      ? h('div', { className: 'cc-hint' }, tt('reviewListEmpty'))
                      : reviewEntries.slice(0, 12).map((item) =>
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'cc-reviewListItem',
                              key: item.messageId,
                              onClick: () => setReviewSelected(item),
                            },
                            h(
                              'span',
                              {
                                className: `cc-reviewBadge ${
                                  ['pass', 'fail', 'uncertain'].includes(item.verdict)
                                    ? item.verdict
                                    : 'uncertain'
                                }`,
                              },
                              h(
                                'span',
                                { className: 'cc-reviewBadgeVerdict' },
                                String(item.verdict || 'uncertain').toUpperCase(),
                              ),
                            ),
                            h(
                              'span',
                              { className: 'cc-recordTitle' },
                              item.reason || item.source || '',
                            ),
                            h('span', { className: 'cc-recordTime' }, timeAgo(item.at, tt)),
                          ),
                        ),
                    h(
                      'div',
                      { className: 'cc-sectionTitle' },
                      `${tt('recordContents')}（${recordItems.length}）`,
                    ),
                    recordError
                      ? h(
                          'div',
                          { className: 'cc-notice' },
                          h('div', { className: 'cc-noticeBody' }, recordError),
                        )
                      : null,
                    !recordBusy && recordItems.length === 0
                      ? h('div', { className: 'cc-hint' }, tt('recordsEmpty'))
                      : null,
                    recordItems.map((item) =>
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'cc-recordItem',
                          key: item.id,
                          onClick: () => viewRecord(item.id),
                        },
                        h('span', { className: 'cc-recordKind' }, recordKindLabel(item.kind)),
                        h(
                          'span',
                          { className: 'cc-recordTitle' },
                          item.title || item.sessionId || '',
                        ),
                        h('span', { className: 'cc-recordTime' }, timeAgo(item.at, tt)),
                      ),
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
      ctx.effect(() => {
        if (!ctx.slots || typeof ctx.slots.inject !== 'function') return () => {}
        return ctx.slots.inject('conversation.chat.assistant-actions', () =>
          ctx.slots.register(
            {
              name: 'conversation.chat.assistant-actions',
              id: 'claude-on-dsh:review',
              order: 90,
            },
            ReviewBadge,
          ),
        )
      }, 'claude-on-dsh: review chip')

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
          request('/jobs', { method: 'POST', body: JSON.stringify({ kind: 'acceptance-brief', ...payload }) }),
        sendAcceptanceDispatch: (payload) =>
          request('/acceptance/dispatch/send', {
            method: 'POST',
            body: JSON.stringify(payload),
            timeoutMs: 90_000,
          }),
        runClaudeAcceptance: (payload) =>
          request('/jobs', { method: 'POST', body: JSON.stringify({ kind: 'acceptance', ...payload }) }),
        askFirstQuestion: (payload) =>
          request('/jobs', { method: 'POST', body: JSON.stringify({ kind: 'first-question', ...payload }) }),
        sendFirstQuestion: (payload) =>
          request('/session/first-question/send', {
            method: 'POST',
            body: JSON.stringify(payload),
            timeoutMs: 90_000,
          }),
        listSessions: () => request('/sessions'),
        listRecords: () => request('/records'),
        getReviews: () => request('/reviews'),
        getDevDoc: (projectDir) =>
          request(`/devdoc?projectDir=${encodeURIComponent(projectDir || '')}`),
        getDevDocTemplate: (params) =>
          request(
            `/devdoc/template?projectDir=${encodeURIComponent(params.projectDir || '')}&projectName=${encodeURIComponent(params.projectName || '')}&goal=${encodeURIComponent(params.goal || '')}`,
          ),
        saveDevDoc: (payload) =>
          request('/devdoc', {
            method: 'POST',
            body: JSON.stringify(payload),
          }),
        refineDevDoc: (payload) =>
          request('/devdoc/refine', {
            method: 'POST',
            body: JSON.stringify(payload),
            timeoutMs: 660_000,
          }),
        sendDevDoc: (payload) =>
          request('/devdoc/send', {
            method: 'POST',
            body: JSON.stringify(payload),
            timeoutMs: 120_000,
          }),
        listClaudeSessions: () => request('/claude-sessions'),
        getUsage: () => request('/usage'),
        deleteClaudeSession: (payload) =>
          request('/claude-session/delete', {
            method: 'POST',
            body: JSON.stringify(payload),
          }),
        resetClaudeSession: (payload) =>
          request('/claude-session/reset', {
            method: 'POST',
            body: JSON.stringify(payload),
          }),
        readRecord: (id) => request(`/record?id=${encodeURIComponent(id)}`),
        getSettings: () => request('/settings'),
        saveSettings: (patch) =>
          request('/settings', {
            method: 'POST',
            body: JSON.stringify(patch),
          }),
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
.cc-reviewBadge {
  display: inline-flex; align-items: center; gap: 5px; height: 20px; padding: 0 8px;
  border: 1px solid transparent; border-radius: 999px; font: inherit; font-size: 11px;
  line-height: 20px; cursor: pointer; white-space: nowrap; max-inline-size: 300px;
}
.cc-reviewBadge.pass {
  background: var(--dsw-alias-state-success-tertiary, #e6faed);
  border-color: color-mix(in oklab, var(--dsw-alias-state-success-primary) 35%, transparent);
  color: var(--dsw-alias-label-primary);
}
.cc-reviewBadge.fail {
  background: var(--dsw-alias-state-error-tertiary, #fdecec);
  border-color: color-mix(in oklab, var(--dsw-alias-state-error-primary) 35%, transparent);
  color: var(--dsw-alias-label-primary);
}
.cc-reviewBadge.uncertain {
  background: var(--dsw-alias-state-warn-tertiary, #fef5e7);
  border-color: color-mix(in oklab, var(--dsw-alias-state-warn-primary) 35%, transparent);
  color: var(--dsw-alias-label-primary);
}
.cc-reviewBadge.pass .cc-reviewBadgeVerdict { color: var(--dsw-alias-state-success-primary); }
.cc-reviewBadge.fail .cc-reviewBadgeVerdict { color: var(--dsw-alias-state-error-primary); }
.cc-reviewBadge.uncertain .cc-reviewBadgeVerdict { color: var(--dsw-alias-state-warn-primary); }
.cc-reviewBadgeVerdict { font-weight: 600; letter-spacing: .02em; }
.cc-reviewBadgeReason { overflow: hidden; text-overflow: ellipsis; color: var(--dsw-alias-label-secondary); }
.cc-reviewModal { inline-size: min(640px, 100%); }
.cc-reviewOpinion {
  white-space: pre-wrap; overflow-wrap: anywhere; max-block-size: 42vh; overflow: auto;
  padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 9px;
  background: var(--dsw-alias-bg-base); font-size: 12px; line-height: 1.65;
}
.cc-reviewEvidence { margin: 6px 0 0; padding-inline-start: 18px; color: var(--dsw-alias-label-secondary); font-size: 11.5px; }
.cc-advanced { margin-block-start: 2px; }
.cc-advanced > summary {
  cursor: pointer; font-size: 11.5px; color: var(--dsw-alias-label-secondary);
  padding-block: 3px;
}
.cc-advanced .cc-budgetField { margin-block-start: 8px; }
.cc-historyDetails > summary {
  cursor: pointer; font-size: 12px; font-weight: 500; color: var(--dsw-alias-label-secondary);
  padding-block: 4px;
}
.cc-budgetChip {
  display: inline-flex; align-items: center; height: 24px; padding: 0 9px;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px;
  background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-secondary);
  font-size: 11.5px; white-space: nowrap;
}
.cc-budgetChip.over { color: #b9512f; border-color: #efc9b8; background: #fff8f4; }
.cc-budgetField .cc-input { max-inline-size: 120px; }
.cc-usageLine { font-size: 11.5px; color: var(--dsw-alias-label-secondary); padding: 2px 0; }
.cc-sessionChip {
  display: inline-flex; align-items: center; gap: 6px; block-size: 24px;
  padding: 0 4px 0 9px; border: 1px solid color-mix(in oklab, #D97757 34%, var(--dsw-alias-border-l1));
  border-radius: 999px; background: #fff8f4; color: var(--dsw-alias-label-secondary);
  font-size: 11.5px; white-space: nowrap; max-inline-size: 360px;
}
.cc-sessionName { overflow: hidden; text-overflow: ellipsis; }
.cc-sessionUse { color: #b9512f; }
.cc-sessionReset {
  border: 0; border-radius: 999px; padding: 2px 7px; background: transparent;
  color: #b9512f; font: inherit; font-size: 11px; cursor: pointer;
}
.cc-sessionReset:hover { background: #fbe9df; }
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
.cc-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.cc-toolbar > .cc-btn { flex: 0 0 auto; }
.cc-toolbar .cc-steps { flex: 1 1 auto; min-inline-size: 0; }
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
.cc-panel { container-type: inline-size; }
@container (max-width: 720px) {
  .cc-grid { grid-template-columns: 1fr; }
  .cc-hero { align-items: flex-start; }
  .cc-chips { justify-content: flex-start; }
  .cc-modeTabs { flex-wrap: wrap; }
  .cc-modeTabs button { flex-basis: calc(50% - 4px); }
  .cc-backgroundJob { flex-wrap: wrap; }
}
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
.cc-successHead { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
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
  display: flex; align-items: center; gap: 10px; min-inline-size: 0; flex-wrap: wrap; row-gap: 4px;
  padding: 7px 10px; border-radius: 8px; border: 1px solid transparent;
}
.cc-historyList li { padding: 9px 12px; border-radius: 10px; }
.cc-historyList li:hover { background: var(--dsw-alias-bg-layer-1); border-color: var(--dsw-alias-border-l1); }
.cc-historyMain { display: flex; flex-direction: column; min-inline-size: 0; flex: 1 1 auto; }
.cc-historyTitleRow { display: flex; align-items: center; gap: 6px; min-inline-size: 0; }
.cc-historyTitle { font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-inline-size: 0; flex: 0 1 auto; }
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
.cc-badge {
  display: inline-flex; align-items: center; block-size: 16px; padding: 0 6px;
  border-radius: 999px; background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary); font-size: 10px; line-height: 1;
  white-space: nowrap; flex: 0 0 auto;
}
.cc-badge.on {
  color: var(--dsw-alias-state-success-primary);
  background: color-mix(in oklab, var(--dsw-alias-state-success-primary) 14%, var(--dsw-alias-bg-base));
}
.cc-select {
  inline-size: 100%; padding: 8px 10px; border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary);
  font-size: 12.5px;
}
.cc-existing { display: flex; flex-direction: column; gap: 10px; }
.cc-draftField {
  margin-block-start: 4px; padding-block-start: 12px;
  border-block-start: 1px solid var(--dsw-alias-border-l1);
}
.cc-draft {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11.5px; line-height: 1.55; background: var(--dsw-alias-bg-base);
}
.cc-reviewSettings { display: block; padding: 14px 18px; border: 1px solid #e6ded1; border-radius: 14px; background: #fffdf8; }
.cc-panelToolbar { display: flex; flex-direction: column; gap: 8px; }
.cc-modeTabs { display: flex; gap: 6px; padding: 4px; border: 1px solid #e6ded1; border-radius: 10px; background: #fffaf2; }
.cc-modeTabs button { flex: 1 1 0; min-block-size: 34px; border: 0; border-radius: 7px; background: transparent; color: #6f6a63; font: inherit; font-size: 12px; cursor: pointer; }
.cc-modeTabs button.on { background: #fffdf8; color: #2f2a25; box-shadow: 0 1px 3px rgba(47,42,37,.08); }
.cc-toolbarActions { display: flex; justify-content: flex-end; gap: 8px; }
.cc-backgroundJobs { display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; border: 1px solid #e8c9b8; border-radius: 9px; background: #fff6ef; }
.cc-backgroundJob { display: flex; align-items: center; gap: 8px; min-inline-size: 0; color: #6f6a63; font-size: 11.5px; }
.cc-backgroundJob > span { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cc-sessionWorkspace { max-inline-size: none; }
.cc-sessionPicker { display: flex; flex-direction: column; gap: 5px; max-block-size: 56vh; overflow: auto; }
.cc-sessionPick { display: flex; align-items: baseline; gap: 10px; inline-size: 100%; padding: 9px 10px; border: 1px solid #e6ded1; border-radius: 8px; background: #fffdf8; color: #2f2a25; text-align: start; font: inherit; cursor: pointer; }
.cc-sessionPick:hover { border-color: #d97757; background: #fdf3eb; }
.cc-sessionPickerMeta { margin-inline-start: auto; color: #6f6a63; font-size: 10.5px; white-space: nowrap; }
.cc-devDocWorkspace { inline-size: 100%; }
.cc-settingsSummary { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; list-style: none; cursor: pointer; }
.cc-settingsSummary::-webkit-details-marker { display: none; }
.cc-settingsSummary .cc-hint { flex: 1 1 auto; }
.cc-reviewSettingsBody { display: flex; flex-direction: column; gap: 10px; padding-block-start: 8px; }
.cc-switch {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 12px; color: var(--dsw-alias-label-secondary); cursor: pointer;
}
.cc-claudeSessions {
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 9px;
  padding: 7px 9px; background: var(--dsw-alias-bg-base);
}
.cc-claudeSessions > summary {
  cursor: pointer; font-size: 11.5px; color: var(--dsw-alias-label-secondary);
}
.cc-claudeSession {
  display: grid; grid-template-columns: minmax(0, 1fr) auto auto auto; align-items: center;
  gap: 8px; padding: 5px 2px; border-block-start: 1px solid var(--dsw-alias-border-l1);
}
.cc-claudeSessionActions { display: flex; align-items: center; gap: 4px; }
.cc-claudeSessionId {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10.5px; color: var(--dsw-alias-label-secondary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-inline-size: 230px;
}
.cc-recordList { display: flex; flex-direction: column; gap: 5px; max-block-size: 60vh; overflow: auto; }
.cc-reviewListItem {
  display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center;
  gap: 10px; inline-size: 100%; padding: 7px 8px; cursor: pointer; text-align: start;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px;
  background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: inherit;
}
.cc-reviewListItem:hover { background: var(--dsw-alias-bg-layer-2); }
.cc-reviewListItem .cc-reviewBadge { pointer-events: none; }
.cc-recordItem {
  display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center;
  gap: 10px; inline-size: 100%; padding: 9px 10px; cursor: pointer; text-align: start;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 9px;
  background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); font: inherit;
}
.cc-recordItem:hover { background: var(--dsw-alias-bg-layer-2); }
.cc-recordKind {
  padding: 1px 7px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l2);
  font-size: 10.5px; color: var(--dsw-alias-label-secondary); white-space: nowrap;
}
.cc-recordTitle { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
.cc-recordTime { font-size: 11px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
.cc-recordMeta { font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.cc-recordContent {
  white-space: pre-wrap; overflow-wrap: anywhere; max-block-size: 58vh; overflow: auto;
  margin: 0; padding: 12px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px;
  background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11.5px; line-height: 1.6;
}
.cc-devDoc { display: flex; flex-direction: column; gap: 12px; min-block-size: 0; }
.cc-devDocHead { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.cc-devDocTitle { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.cc-devDocStatus {
  display: inline-flex; align-items: center; min-block-size: 20px; padding: 0 8px;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 999px;
  font-size: 10.5px; color: var(--dsw-alias-label-secondary); white-space: nowrap;
}
.cc-devDocStatus.approved { color: var(--dsw-alias-state-success-primary); border-color: color-mix(in oklab, var(--dsw-alias-state-success-primary) 40%, transparent); }
.cc-devDocStatus.rejected { color: var(--dsw-alias-state-error-primary); border-color: color-mix(in oklab, var(--dsw-alias-state-error-primary) 40%, transparent); }
.cc-devDocStatus.needs_info { color: var(--dsw-alias-state-warn-primary); border-color: color-mix(in oklab, var(--dsw-alias-state-warn-primary) 40%, transparent); }
.cc-devDocEditor {
  min-block-size: 300px; max-block-size: 48vh; resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11.5px; line-height: 1.6;
}
.cc-devDocReview { display: flex; flex-direction: column; gap: 10px; }
.cc-devDocVerdict { font-size: 12.5px; }
.cc-devDocVerdict p { margin: 4px 0 0; color: var(--dsw-alias-label-secondary); white-space: pre-wrap; }
.cc-devDocDepartments { display: flex; flex-direction: column; gap: 4px; }
.cc-devDocDept {
  display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;
  padding: 6px 8px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 7px;
  font-size: 11.5px;
}
.cc-devDocDept strong { min-inline-size: 120px; font-weight: 600; }
.cc-devDocDept small { flex: 1 1 220px; color: var(--dsw-alias-label-secondary); }
.cc-devDocDept.approve { border-color: color-mix(in oklab, var(--dsw-alias-state-success-primary) 30%, transparent); }
.cc-devDocDept.reject { border-color: color-mix(in oklab, var(--dsw-alias-state-error-primary) 30%, transparent); }
.cc-devDocDept.conditional, .cc-devDocDept.needs_info { border-color: color-mix(in oklab, var(--dsw-alias-state-warn-primary) 30%, transparent); }
.cc-devDocDept.not_applicable { opacity: .72; }
.cc-toast {
  position: fixed; inset-block-end: 26px; inset-inline: 0; margin-inline: auto; z-index: 60;
  inline-size: fit-content; padding: 7px 14px; border-radius: 999px;
  background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary);
  border: 1px solid var(--dsw-alias-border-l2); box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  font-size: 12px;
}

/* Claude Desktop-inspired surface: warm paper, serif headings, soft ink. */
.cc-panel {
  --cc-ink: #2f2a25;
  --cc-muted: #6f6a63;
  --cc-line: #e6ded1;
  --cc-paper: #fffdf8;
  --cc-cream: #f7f4ed;
  --cc-accent: #d97757;
  gap: 16px;
  padding: 28px clamp(18px, 3.5vw, 40px) 72px;
  background: var(--cc-cream);
  color: var(--cc-ink);
  font-family: "Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, sans-serif;
}
.cc-panel > * { max-inline-size: 1080px; }
.cc-hero {
  padding: 20px 22px;
  border-color: var(--cc-line);
  border-radius: 18px;
  background: linear-gradient(145deg, #fbf7ef, #f3ece1);
  box-shadow: none;
}
.cc-mark { background: #f3e5db; border-color: #e7c9b8; border-radius: 12px; }
.cc-heading {
  font-family: Georgia, "Iowan Old Style", "Times New Roman", serif;
  font-size: 25px; font-weight: 600; letter-spacing: -0.02em;
}
.cc-subtitle { color: var(--cc-muted); }
.cc-chips { gap: 6px; }
.cc-chip, .cc-budgetChip {
  border-color: var(--cc-line); background: #fffaf2; color: var(--cc-muted);
}
.cc-sessionChip { border-color: #e8c9b8; background: #fff6ef; color: var(--cc-muted); }
.cc-steps {
  padding: 10px 14px; border-color: var(--cc-line); border-radius: 14px;
  background: #fffaf2;
}
.cc-step.active b { background: var(--cc-accent); border-color: var(--cc-accent); }
.cc-step.done b { background: #7f8b72; border-color: #7f8b72; }
.cc-card {
  padding: 18px 20px; border-color: var(--cc-line); border-radius: 16px;
  background: var(--cc-paper); box-shadow: 0 1px 1px rgba(47, 42, 37, 0.03);
}
.cc-cardTitle {
  font-family: Georgia, "Iowan Old Style", "Times New Roman", serif;
  font-size: 15px; font-weight: 600;
}
.cc-sectionTitle {
  font-family: Georgia, "Iowan Old Style", "Times New Roman", serif;
  font-size: 13px; font-weight: 600;
}
.cc-input, .cc-textarea, .cc-select {
  border-color: #ddd3c6; border-radius: 10px; background: #fffdf8; color: var(--cc-ink);
}
.cc-input:focus, .cc-textarea:focus, .cc-select:focus {
  outline: none; border-color: var(--cc-accent);
  box-shadow: 0 0 0 3px rgba(217, 119, 87, 0.13);
}
.cc-btn { border-radius: 10px; }
.cc-btn.primary { background: #2f2a25; color: #fffdf8; }
.cc-btn.primary:hover:not(:disabled) { background: #1f1b17; filter: none; }
.cc-btn.ghost { border-color: #ddd3c6; background: #fffaf2; color: var(--cc-ink); }
.cc-btn.ghost:hover:not(:disabled) { background: #f5eee4; }
.cc-btn.link { color: #b45f43; }
.cc-question {
  border-inline-start-color: var(--cc-accent); border-radius: 10px;
  background: #fdf3eb;
}
.cc-option.on { border-color: var(--cc-accent); background: #fbeade; }
.cc-historyDetails > summary, .cc-advanced > summary { color: var(--cc-muted); }
.cc-modal {
  border-color: var(--cc-line); border-radius: 16px; background: #fffdf8;
}
.cc-modalBackdrop { background: rgba(47, 42, 37, 0.24); backdrop-filter: blur(3px); }
@media (max-width: 940px) {
  .cc-panel { padding: 18px 14px 56px; }
  .cc-hero { border-radius: 14px; }
  .cc-chips { justify-content: flex-start; }
}
@media (max-width: 640px) {
  .cc-heading { font-size: 22px; }
  .cc-card { padding: 14px; }
  .cc-toolbar { align-items: stretch; }
  .cc-steps { flex-wrap: nowrap; overflow: auto; }
}
@media (prefers-color-scheme: dark) {
  .cc-panel {
    --cc-ink: #f3ede4; --cc-muted: #b9afa2; --cc-line: #4a433b;
    --cc-paper: #282521; --cc-cream: #1f1d1a;
  }
  .cc-hero { background: linear-gradient(145deg, #2d2924, #25211d); }
  .cc-chip, .cc-budgetChip, .cc-steps, .cc-input, .cc-textarea, .cc-select, .cc-btn.ghost {
    background: #2a2621; color: var(--cc-ink); border-color: #4a433b;
  }
  .cc-card, .cc-modal { background: #282521; }
  .cc-question { background: #3a2c24; }
}
`

    return {
      inject: ['slots', 'locale', 'sessions', 'uiWorkspace'],
      apply,
    }
  },
})
