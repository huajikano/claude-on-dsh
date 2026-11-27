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
        prompts: '提示词',
        promptsHint: '保存后用于本插件后续生成，所有项目共用。已生成内容不会自动更新；需要时请重新生成。输出格式与审批校验仍由程序控制。',
        promptSave: '保存提示词',
        promptReset: '恢复默认',
        promptDefault: '默认',
        promptCustom: '已自定义',
        promptUnsaved: '有未保存修改',
        promptSaved: '已保存，下次生成生效',
        promptVariables: '占位符',
        promptRequired: '必需',
        promptRetry: '重新加载提示词',
        stepSetup: '项目设定',
        stepAsk: 'Claude 首问',
        stepHandoff: '交给 DSH',
        engine: '指挥引擎',
        agentPresetLabel: 'DSH 新会话模式',
        agentPresetHint: '选择新会话使用的 DSH 预设；默认项由 DSH 决定。',
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
        inSessionLabel: '首问进会话',
        inSessionHint: '开：在一个 Claude 会话里问（能看见它思考，会留下会话）；关：一次性调用，弹窗里出结果。',
        starting: 'Claude 正在思考',
        cancel: '取消',
        reset: '重新开始',
        statusCli: 'Claude Code',
        statusDesktop: '桌面版',
        statusEngineSdk: 'Agent SDK',
        statusEngineCli: 'CLI 引擎',
        statusEngineDeny: '规划期禁用：',
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
         sessionFork: 'Fork',
         sessionForkConfirm: '下次 Claude 调用将基于当前会话创建新分支，原会话保持不变。继续？',
         sessionForkPending: '下次调用将 Fork',
         sessionForkDone: '已标记下次调用 Fork',
         claudeStatusTitle: 'Claude 状态',
         claudeStatusRunning: '插件调用中',
         claudeStatusIdle: '空闲，可继续当前会话',
         claudeStatusNew: '已就绪，尚未建立项目会话',
         claudeStatusUnavailable: '没有可用的 Claude 引擎',
         claudeStatusUnknown: '状态未知',
         claudeStatusEngine: '当前引擎',
         claudeStatusSession: '当前会话',
         claudeStatusTask: '当前任务',
         claudeStatusLastUse: '最近用途',
         claudeStatusSource: '状态来源',
         claudeStatusPlugin: '本插件调用',
         claudeStatusRefresh: '刷新状态',
         claudeStatusRefreshing: '刷新中…',
         claudeStatusRefreshed: 'Claude 状态已刷新',
         claudeStatusError: '最近任务失败',
         claudeStatusInterrupted: '最近任务已中断',
         claudeStatusLastTask: '最近任务',
         taskModeLabel: '个人任务模式',
         taskModeHint: '模式只调整本机工作策略，不开启远程协作。',
         taskModePlan: '规划',
         taskModeExecute: '执行',
         taskModeReview: '审查',
         taskModeApplied: '任务模式已应用',
         taskModeDescription: '模式说明',
        supervisorTitle: "Claude 全局监工",
        supervisorSessionDisconnected: 'DSH 会话已断开，等待重新连接。',
        supervisorGlobalOffHint: '全局监工当前已关闭（规划/审查模式会关闭它）。点「恢复监工」会自动切到执行模式并恢复该会话。',
        supervisorGlobalEnabled: '已切到执行模式并开启全局监工。',
        supervisorEnabled: "全局自动监工",
        supervisorAdoptButton: '接管会话',
        supervisorAdoptTitle: '接管已有会话',
        supervisorAdoptHint: '选择任意 DSH 会话，让监工接手它的完成、续跑和中断处理。目标与工作目录取自会话本身；不需要经过首问或由本插件派发。',
        supervisorAdoptAction: '开始监工',
        supervisorAdoptRefresh: '刷新列表',
        supervisorAdoptLoading: '正在读取会话…',
        supervisorAdoptEmpty: '没有找到可接管的会话。',
        supervisorAdopted: '已在监工',
        supervisorAdoptedToast: '已接管该会话，监工开始检查',
        supervisorSleepMode: '睡眠托管（无人值守）',
        supervisorSleepModeHint: '开启后强制使用 CLI 监工，自动处理主会话的完成、续跑和中断；不会等待你的确认。仍受每日预算、无进展上限和续跑上限约束。',
        supervisorSleepBudgetRequired: '开启睡眠托管前，请先设置大于 0 的每日 Claude 预算。',
        supervisorSleepActive: '睡眠托管已接管：CLI 自动监工运行中',
        supervisorHint: "每轮结束或中断后核查目标和进度；判断继续、等待或达标。仅处理主会话，不依赖面板一直打开。",
        supervisorCli: "CLI / SDK · 全自动",
        supervisorDesktop: 'Claude Desktop · MCP / 手动回填',
        supervisorDesktopHint: '在 Claude Desktop 对话中请 Claude 使用 claude-on-dsh-supervisor 连接处理此待审任务。',
        supervisorOverview: '概览',
        supervisorHistoryButton: '监工记录',
        supervisorSettingsButton: '监工设置',
        supervisorEngineLabel: '监工引擎',
        supervisorCooldown: '续跑间隔（秒）',
        supervisorRetryDelay: '初次重试间隔（秒）',
        supervisorMaxRetries: '最多重试次数',
        supervisorNoProgress: '连续无进展上限',
        supervisorMaxRounds: '单会话续跑上限',
        supervisorSave: '保存设置',
        supervisorSaved: '监工设置已保存',
        supervisorConnectionTitle: 'Claude Desktop 连接',
        supervisorConnectionConnected: 'MCP 已连接',
        supervisorConnectionRunning: '应用已运行 · MCP 未连接',
        supervisorConnectionStopped: '应用未运行',
        supervisorConnectionUnknown: '状态未知',
        supervisorConnectionInfo: 'MCP 不会自动新建桌面对话。无人值守请使用 CLI / SDK。',
        supervisorConnectionMissing: '尚未配置监工 MCP 服务器。',
        supervisorConnectionReload: '已配置，等待握手。请在 Claude Desktop 重载连接，或正常退出后重新打开。',
        supervisorRuntimeMissing: '没有找到可用的 Node 或 MCP 入口。',
        supervisorBridgeClient: 'MCP 客户端',
        supervisorBridgeBackup: '配置备份',
        supervisorBridgePath: '桌面配置位置',
        supervisorRefreshDesktop: '检测连接',
        supervisorConfigure: '配置 MCP 连接',
        supervisorConfigureConfirm: '允许 Claude Desktop 通过 MCP 读取待审任务与项目上下文，并提交监工判断？不会自动重启应用。',
        supervisorOpenApp: '打开 Claude Desktop',
        supervisorManualReply: '手动提交判断',
        supervisorTask: '桌面待审任务',
        supervisorEvidence: '证据',
        supervisorExecuted: '累计执行',
        supervisorDecisions: '有效判断',
        supervisorContinued: '已续跑',
        supervisorCompleted: '已达标',
        supervisorFailed: '失败',
        supervisorPending: '桌面待审',
        supervisorWaited: '未干预',
        supervisorCancelled: '已取消',
        supervisorInterrupted: '已中断',
        supervisorStale: '已失效',
        supervisorUncertain: '结果不确定',
        supervisorPreparing: '准备中',
        supervisorControlRecord: '状态操作',
        supervisorHistoryStatus: '按结果筛选',
        supervisorHistoryFilterAll: '全部结果',
        supervisorSessionFilter: '按会话筛选',
        supervisorAllSessions: '全部会话',
        supervisorHistoryEmpty: '没有符合条件的监工记录。',
        supervisorRefreshHistory: '刷新记录',
        supervisorHistoryRefreshed: '监工记录已刷新',
        supervisorHistoryLoading: '正在读取监工记录…',
        supervisorLoadMore: '加载更多',
        supervisorLegacyChecks: '旧版已记录判断（不计入上述累计）',
        supervisorRetention: '保留最近 1,000 条已结束记录；累计统计不受清理影响。',
        supervisorCountHint: 'CLI / SDK 按发起的检查尝试计；Desktop 在收到有效判断后计。',
        supervisorDesktopPrompt: '待审提示词',
        supervisorEmpty: "等待主会话下一轮结束。不会扫描历史会话并擅自启动它们。",
        supervisorPause: "暂停监工",
        supervisorResume: "恢复监工",
        supervisorOpen: "打开会话",
        supervisorOpenDesktop: "打开桌面版并复制待审内容",
        supervisorSubmit: "提交桌面 Claude 判断",
        supervisorReply: "粘贴桌面 Claude 返回的 JSON",
        supervisorWaiting: "监听中",
        supervisorOff: "全局已关闭",
        supervisorUnavailable: "监工状态暂不可用",
        supervisorPhaseWatching: "等待下轮",
        supervisorPhaseOff: "未在监工",
        supervisorPhaseReviewing: "Claude 检查中",
        supervisorPhaseRetrying: "退避重试",
        supervisorPhaseDesktop: "等待桌面回复",
        supervisorPhaseSending: "发送中",
        supervisorPhaseComplete: "已达标 · 停止监工",
        supervisorPhasePaused: "已暂停",
        supervisorPhaseAttention: "需要核对",
        manualAcceptanceToggle: "显示手动验收入口（默认关闭）",
        acceptanceOptional: "可选验收 · 默认关闭",
        reviewSettings: '可选验收',
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
        errorDetails: '详细的失败信息',
        errorCommand: '实际执行的命令',
        errorLogFile: '完整日志',
        retry: '重试',
        jobDismiss: '移除',
        jobsClear: '清除已结束',
        jobsCleared: '已清除结束的任务',
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
        prompts: 'Prompts',
        promptsHint: 'Saved prompts apply to future generation in this plugin across all projects. Existing content does not update automatically; generate again to apply changes. Output formats and approval checks remain enforced.',
        promptSave: 'Save prompt',
        promptReset: 'Restore default',
        promptDefault: 'Default',
        promptCustom: 'Customized',
        promptUnsaved: 'Unsaved changes',
        promptSaved: 'Saved for the next generation',
        promptVariables: 'Placeholders',
        promptRequired: 'required',
        promptRetry: 'Reload prompts',
        stepSetup: 'Project',
        stepAsk: 'Claude asks',
        stepHandoff: 'Hand off to DSH',
        engine: 'Commander engine',
        agentPresetLabel: 'New DSH session mode',
        agentPresetHint: 'Preset for the new session; the default comes from DSH.',
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
        inSessionLabel: 'Ask inside a session',
        inSessionHint: 'On: ask in a Claude session (you watch it think; a session is left behind). Off: one-shot call, the answer opens in the dialog.',
        starting: 'Claude is thinking',
        cancel: 'Cancel',
        reset: 'Start over',
        statusCli: 'Claude Code',
        statusEngineSdk: 'Agent SDK',
        statusEngineCli: 'CLI engine',
        statusEngineDeny: 'Blocked while planning: ',
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
         sessionFork: 'Fork',
         sessionForkConfirm: 'The next Claude call will fork from this session and leave the original unchanged. Continue?',
         sessionForkPending: 'Fork on next call',
         sessionForkDone: 'The next call will fork this session',
         claudeStatusTitle: 'Claude status',
         claudeStatusRunning: 'Plugin call running',
         claudeStatusIdle: 'Idle; current session can continue',
         claudeStatusNew: 'Ready; no project session yet',
         claudeStatusUnavailable: 'No Claude engine available',
         claudeStatusUnknown: 'Status unknown',
         claudeStatusEngine: 'Engine',
         claudeStatusSession: 'Current session',
         claudeStatusTask: 'Current task',
         claudeStatusLastUse: 'Last use',
         claudeStatusSource: 'Status source',
         claudeStatusPlugin: 'Plugin call',
         claudeStatusRefresh: 'Refresh status',
         claudeStatusRefreshing: 'Refreshing…',
         claudeStatusRefreshed: 'Claude status refreshed',
         claudeStatusError: 'Latest task failed',
         claudeStatusInterrupted: 'Latest task was interrupted',
         claudeStatusLastTask: 'Latest task',
         taskModeLabel: 'Personal task mode',
         taskModeHint: 'These modes change local work policy only; no remote collaboration is enabled.',
         taskModePlan: 'Plan',
         taskModeExecute: 'Execute',
         taskModeReview: 'Review',
         taskModeApplied: 'Task mode applied',
         taskModeDescription: 'Mode details',
        supervisorTitle: "Claude global supervisor",
        supervisorSessionDisconnected: 'DSH session disconnected; waiting to reconnect.',
        supervisorGlobalOffHint: 'Global monitoring is off (Plan/Review modes turn it off). Clicking Resume switches to Execute mode and resumes that session.',
        supervisorGlobalEnabled: 'Switched to Execute mode and turned global monitoring on.',
        supervisorEnabled: "Monitor all main sessions",
        supervisorAdoptButton: 'Take over',
        supervisorAdoptTitle: 'Take over an existing conversation',
        supervisorAdoptHint: 'Pick any DSH conversation and let the supervisor handle its completion, continuation and interruptions. The objective and workspace come from the conversation itself — it does not need a first question or a dispatch from this plugin.',
        supervisorAdoptAction: 'Start monitoring',
        supervisorAdoptRefresh: 'Refresh list',
        supervisorAdoptLoading: 'Reading conversations…',
        supervisorAdoptEmpty: 'No conversation to take over was found.',
        supervisorAdopted: 'Monitored',
        supervisorAdoptedToast: 'Conversation taken over; the supervisor is checking it',
        supervisorSleepMode: 'Sleep mode (unattended)',
        supervisorSleepModeHint: 'Forces the CLI monitor to handle main-session completion, continuation, and interruption while you are away. Budget, no-progress, and round limits still apply.',
        supervisorSleepBudgetRequired: 'Set a daily Claude budget above 0 before enabling sleep mode.',
        supervisorSleepActive: 'Sleep mode active: CLI monitor is in charge',
        supervisorHint: "Check the original goal after each completed or interrupted turn; continue, wait, or finish. Monitoring runs in the host while the panel is closed.",
        supervisorCli: "CLI / SDK · automatic",
        supervisorDesktop: 'Claude Desktop · MCP / manual reply',
        supervisorDesktopHint: 'In Claude Desktop, ask Claude to use the claude-on-dsh-supervisor connection to process this review task.',
        supervisorOverview: 'Overview',
        supervisorHistoryButton: 'Monitor history',
        supervisorSettingsButton: 'Monitor settings',
        supervisorEngineLabel: 'Monitor engine',
        supervisorCooldown: 'Continuation interval (s)',
        supervisorRetryDelay: 'Initial retry delay (s)',
        supervisorMaxRetries: 'Maximum retries',
        supervisorNoProgress: 'No-progress limit',
        supervisorMaxRounds: 'Continuation limit per session',
        supervisorSave: 'Save settings',
        supervisorSaved: 'Monitor settings saved',
        supervisorConnectionTitle: 'Claude Desktop connection',
        supervisorConnectionConnected: 'MCP connected',
        supervisorConnectionRunning: 'App running · MCP not connected',
        supervisorConnectionStopped: 'App not running',
        supervisorConnectionUnknown: 'Status unknown',
        supervisorConnectionInfo: 'MCP cannot start a Desktop chat. Use CLI / SDK for unattended reviews.',
        supervisorConnectionMissing: 'The monitor MCP server has not been configured.',
        supervisorConnectionReload: 'Configured, awaiting handshake. Reload the connection in Claude Desktop or quit and reopen the app.',
        supervisorRuntimeMissing: 'Node or the MCP entry point was not found.',
        supervisorBridgeClient: 'MCP client',
        supervisorBridgeBackup: 'Configuration backup',
        supervisorBridgePath: 'Desktop configuration path',
        supervisorRefreshDesktop: 'Check connection',
        supervisorConfigure: 'Configure MCP connection',
        supervisorConfigureConfirm: 'Allow Claude Desktop to read pending reviews and their project context and submit decisions via MCP? The app will not restart automatically.',
        supervisorOpenApp: 'Open Claude Desktop',
        supervisorManualReply: 'Submit a decision manually',
        supervisorTask: 'Pending Desktop task',
        supervisorEvidence: 'Evidence',
        supervisorExecuted: 'Executions',
        supervisorDecisions: 'Valid decisions',
        supervisorContinued: 'Continued',
        supervisorCompleted: 'Goal met',
        supervisorFailed: 'Failed',
        supervisorPending: 'Pending Desktop',
        supervisorWaited: 'No action',
        supervisorCancelled: 'Cancelled',
        supervisorInterrupted: 'Interrupted',
        supervisorStale: 'Stale',
        supervisorUncertain: 'Outcome uncertain',
        supervisorPreparing: 'Preparing',
        supervisorControlRecord: 'Control action',
        supervisorHistoryStatus: 'Filter by outcome',
        supervisorHistoryFilterAll: 'All outcomes',
        supervisorSessionFilter: 'Filter by session',
        supervisorAllSessions: 'All sessions',
        supervisorHistoryEmpty: 'No matching monitor records.',
        supervisorRefreshHistory: 'Refresh history',
        supervisorHistoryRefreshed: 'Monitor history refreshed',
        supervisorHistoryLoading: 'Loading monitor history…',
        supervisorLoadMore: 'Load more',
        supervisorLegacyChecks: 'Decisions recorded by the old version (excluded from totals above)',
        supervisorRetention: 'The latest 1,000 finished records are retained. Totals are not reset when history is trimmed.',
        supervisorCountHint: 'CLI / SDK counts review attempts; Desktop counts valid replies received.',
        supervisorDesktopPrompt: 'Review prompt',
        supervisorEmpty: "Waiting for the next main-session turn to finish. Historical conversations are not started automatically.",
        supervisorPause: "Pause monitor",
        supervisorResume: "Resume monitor",
        supervisorOpen: "Open conversation",
        supervisorOpenDesktop: "Open Desktop and copy review prompt",
        supervisorSubmit: "Submit desktop decision",
        supervisorReply: "Paste the JSON returned by Claude Desktop",
        supervisorWaiting: "Listening",
        supervisorOff: "Globally disabled",
        supervisorUnavailable: "Monitor status unavailable",
        supervisorPhaseWatching: "Watching",
        supervisorPhaseOff: "Not monitored",
        supervisorPhaseReviewing: "Claude reviewing",
        supervisorPhaseRetrying: "Retry backoff",
        supervisorPhaseDesktop: "Awaiting desktop response",
        supervisorPhaseSending: "Sending",
        supervisorPhaseComplete: "Goal met · monitor stopped",
        supervisorPhasePaused: "Paused",
        supervisorPhaseAttention: "Needs inspection",
        manualAcceptanceToggle: "Show manual acceptance actions (off by default)",
        acceptanceOptional: "Optional acceptance · off by default",
        reviewSettings: 'Optional acceptance',
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
        errorDetails: 'Failure details',
        errorCommand: 'Command that ran',
        errorLogFile: 'Full log',
        retry: 'Retry',
        jobDismiss: 'Remove',
        jobsClear: 'Clear finished',
        jobsCleared: 'Finished tasks cleared',
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
        error.details = (data && data.error && data.error.details) || null
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

    function Chip({ on, warn, label, hint }) {
      return h(
        'span',
        { className: 'cc-chip', title: hint ? `${label}\n${hint}` : label },
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

    /** A failed CLI run: the short message plus the captured argv/stderr. */
    function ErrorDetails({ details, tt }) {
      if (!details || (!details.stderr && !details.argv)) return null
      const head = [
        details.exitCode !== undefined ? `exit ${details.exitCode}` : '',
        details.executable || '',
        details.durationMs ? formatDuration(details.durationMs) : '',
        details.logFile ? `${tt('errorLogFile')}: ${details.logFile}` : '',
      ].filter(Boolean).join(' · ')
      return h('details', { className: 'cc-errorDetails' },
        h('summary', null, tt('errorDetails'), head ? ` — ${head}` : ''),
        details.argv ? h('div', { className: 'cc-errorDetailsLabel' }, tt('errorCommand')) : null,
        details.argv ? h('pre', { className: 'cc-pre cc-errorDetailsBody' }, details.argv.join(' ')) : null,
        details.stderr ? h('div', { className: 'cc-errorDetailsLabel' }, 'stderr') : null,
        details.stderr ? h('pre', { className: 'cc-pre cc-errorDetailsBody' }, details.stderr) : null,
        details.stdout ? h('div', { className: 'cc-errorDetailsLabel' }, 'stdout') : null,
        details.stdout ? h('pre', { className: 'cc-pre cc-errorDetailsBody' }, details.stdout) : null,
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
        h(ErrorDetails, { details: notice.details, tt }),
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
      agentPreset: '',
      taskMode: 'execute',
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

    function PromptEditor({ ids, tt }) {
      const [items, setItems] = useState(null)
      const [selected, setSelected] = useState(ids[0])
      const [drafts, setDrafts] = useState({})
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')
      const [saved, setSaved] = useState(false)
      const mounted = useRef(true)
      useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
      const item = items?.find((entry) => entry.id === selected)
      const draft = item ? drafts[item.id] ?? item.value : ''
      async function load() {
        setBusy(true); setError('')
        try {
          const data = await request('/prompts')
          if (mounted.current) setItems(data.items || [])
        } catch (failure) { if (mounted.current) setError(failure.message) }
        finally { if (mounted.current) setBusy(false) }
      }
      async function save(reset = false) {
        if (!item) return
        setBusy(true); setError(''); setSaved(false)
        try {
          const data = await request('/prompts', { method: 'POST', body: JSON.stringify({ id: item.id, ...(reset ? { reset: true } : { value: draft }) }) })
          if (!mounted.current) return
          setItems(data.items || [])
          setDrafts((current) => { const next = { ...current }; delete next[item.id]; return next })
          setSaved(true)
        } catch (failure) { if (mounted.current) setError(failure.message) }
        finally { if (mounted.current) setBusy(false) }
      }
      return h('details', { className: 'cc-promptDetails', onToggle: (event) => { if (event.currentTarget.open && !busy) return load() } },
        h('summary', null, tt('prompts')),
        h('div', { className: 'cc-promptBody' },
          h('p', { className: 'cc-hint' }, tt('promptsHint')),
          items ? h('select', { className: 'cc-select', 'aria-label': tt('prompts'), value: selected, disabled: busy, onChange: (event) => { setSelected(event.target.value); setSaved(false); setError('') } },
            ids.map((id) => { const entry = items.find((candidate) => candidate.id === id); return entry ? h('option', { key: id, value: id }, entry.title) : null }),
          ) : null,
          item ? h(React.Fragment, null,
            h('div', { className: 'cc-hint' }, item.description),
            h('div', { className: 'cc-hint' }, draft !== item.value ? tt('promptUnsaved') : tt(item.customized ? 'promptCustom' : 'promptDefault')),
            item.variables.length ? h('div', { className: 'cc-promptVariables' }, tt('promptVariables') + '：',
              item.variables.map((name) => h('span', { key: name }, h('code', null, '{{' + name + '}}'), ' ' + (item.variableDescriptions?.[name] || '') + (item.required.includes(name) ? ' (' + tt('promptRequired') + ')' : ''))),
            ) : null,
            h('textarea', { className: 'cc-textarea cc-promptEditor', 'aria-label': item.title, spellCheck: false, rows: 14, maxLength: 40000, value: draft, disabled: busy, onChange: (event) => { setDrafts((current) => ({ ...current, [item.id]: event.target.value })); setSaved(false) } }),
            h('div', { className: 'cc-actions' },
              h(Button, { variant: 'primary', busy, disabled: busy || !draft.trim() || draft === item.value, onClick: () => save() }, tt('promptSave')),
              h(Button, { disabled: busy || (!item.customized && draft === item.value), onClick: () => save(true) }, tt('promptReset')),
            ),
          ) : busy ? h('div', { className: 'cc-hint' }, tt('loading')) : null,
          error ? h('div', { className: 'cc-inlineWarn', role: 'alert' }, error, !items ? h(Button, { variant: 'link', onClick: load }, tt('promptRetry')) : null) : null,
          saved ? h('div', { className: 'cc-hint', role: 'status' }, tt('promptSaved')) : null,
        ),
      )
    }

    function sessionLabel(item) {
      return String(item?.title || '').trim()
        || String(item?.cwd || '').split(/[\\/]/).filter(Boolean).pop()
        || item?.sessionId || ''
    }

    function selectableSession(sessions, sessionId) {
      return sessions.find((item) => item.sessionId === sessionId
        || item.forkSessionIds?.includes(sessionId))
    }

    function SessionPicker({ sessions, query, onQueryChange, onSelect, tt }) {
      const search = query.trim().toLowerCase()
      const items = sessions.filter((item) => !search
        || `${item.title || ''} ${item.cwd || ''} ${item.sessionId}`.toLowerCase().includes(search)).slice(0, 80)
      return h(
        'section',
        { className: 'cc-card cc-sessionWorkspace' },
        h('div', { className: 'cc-cardTitle' }, tt('workspaceContinue')),
        h(PromptEditor, { ids: ['firstQuestion', 'firstQuestionSend'], tt }),
        h('input', {
          className: 'cc-input', type: 'search', value: query, placeholder: tt('sessionSearch'),
          onChange: (event) => onQueryChange(event.target.value),
        }),
        h('div', { className: 'cc-sessionPicker' }, items.map((item) => h(
          'button',
          { type: 'button', key: item.sessionId, className: 'cc-sessionPick', onClick: () => onSelect(item) },
          h('span', { className: 'cc-sessionPickInfo' },
            h('span', { className: 'cc-recordTitle', title: sessionLabel(item) }, sessionLabel(item)),
            item.cwd ? h('span', { className: 'cc-sessionPickPath', title: item.cwd }, item.cwd) : null,
          ),
          h('span', { className: 'cc-sessionPickerMeta' }, `${item.running ? tt('sessionRunning') : timeAgo(item.updatedAt, tt)} · ${item.sessionId.slice(-6)}`),
        ))),
      )
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
      const [claudeStatusBusy, setClaudeStatusBusy] = useState(false)
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
      const [agentPresets, setAgentPresets] = useState([])
      const [sessionSearch, setSessionSearch] = useState('')
      const [activeWorkspace, setActiveWorkspace] = useState(() => (restored ? restored.activeWorkspace || 'new' : 'new'))
      const [recordsOpen, setRecordsOpen] = useState(false)
      const [recordItems, setRecordItems] = useState([])
      const [claudeSessions, setClaudeSessions] = useState([])
      const [taskModeActive, setTaskModeActive] = useState('execute')
      const [taskModeItems, setTaskModeItems] = useState([])
      const taskModes = { active: taskModeActive, items: taskModeItems }
      const [usage, setUsage] = useState({
        costUsd: 0,
        calls: 0,
        budgetUsd: 5,
        over: false,
      })
      const [deleteConfirmKey, setDeleteConfirmKey] = useState('')
      // Whether the opening question is asked inside a Claude session (opt-in;
      // the config's default seeds it, the reader can flip it for one run).
      const [inSession, setInSession] = useState(false)
      const [inSessionSeeded, setInSessionSeeded] = useState(false)
      const [deletingKey, setDeletingKey] = useState('')
      const [recordSelected, setRecordSelected] = useState(null)
      const [reviewEntries, setReviewEntries] = useState([])
      const [acceptanceEntries, setAcceptanceEntries] = useState([])
      const [acceptanceSelected, setAcceptanceSelected] = useState(null)
      const [reworkDraft, setReworkDraft] = useState('')
      const [reviewSelected, setReviewSelected] = useState(null)
      const [recordBusy, setRecordBusy] = useState(false)
      const [recordError, setRecordError] = useState('')
      const [startingBrief, setStartingBrief] = useState(false)
      const [copyBusy, setCopyBusy] = useState(false)
      const [continuingDesktop, setContinuingDesktop] = useState(false)
      const [browsing, setBrowsing] = useState(false)
      const [archiving, setArchiving] = useState(false)
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
        manualAcceptance: false,
        supervision: { enabled: true, sleepMode: false, engine: 'cli', cooldownMs: 30000, retryBaseMs: 60000, maxRetries: 3, maxNoProgress: 3, maxRounds: 50 },
        autoPrompt: false,
        defaultAction: 'none',
        dailyBudgetUsd: 5,
      })
      const [supervisionStatus, setSupervisionStatus] = useState({ items: [] })
      const [supervisionError, setSupervisionError] = useState('')
      const [supervisionView, setSupervisionView] = useState('overview')
      const [adoptSearch, setAdoptSearch] = useState('')
      const [adoptBusy, setAdoptBusy] = useState(false)
      const [adoptBusyId, setAdoptBusyId] = useState('')
      const [adoptError, setAdoptError] = useState('')
      const [settingsDraft, setSettingsDraft] = useState({})
      const [settingsBusy, setSettingsBusy] = useState(false)
      const [desktopStatus, setDesktopStatus] = useState(null)
      const [desktopStatusError, setDesktopStatusError] = useState('')
      const [desktopBackup, setDesktopBackup] = useState('')
      const [desktopBusy, setDesktopBusy] = useState(false)
      const [desktopReplyDraft, setDesktopReplyDraft] = useState(null)
      const [desktopTaskBusy, setDesktopTaskBusy] = useState('')
      const [supervisionHistory, setSupervisionHistory] = useState({ items: [], total: 0, nextCursor: '' })
      const [supervisionHistoryBusy, setSupervisionHistoryBusy] = useState(false)
      const [supervisionHistoryError, setSupervisionHistoryError] = useState('')
      const [supervisionFilter, setSupervisionFilter] = useState('')
      const [supervisionSession, setSupervisionSession] = useState('')
      const historyRequest = useRef(0)
      const desktopStatusRequest = useRef(0)
      const supervisionRequest = useRef(0)
      async function refreshSupervision() {
        const version = ++supervisionRequest.current
        try {
          const result = await request('/supervision')
          if (version === supervisionRequest.current) { setSupervisionStatus(result); setSupervisionError('') }
        } catch (error) { if (version === supervisionRequest.current) setSupervisionError(error.message) }
      }
      async function refreshDesktopStatus(force = false) {
        const version = ++desktopStatusRequest.current
        try {
          const result = await request('/supervision/desktop/status' + (force ? '?refresh=1' : ''))
          if (version === desktopStatusRequest.current) { setDesktopStatus(result); setDesktopStatusError('') }
        } catch (error) { if (version === desktopStatusRequest.current) setDesktopStatusError(error.message) }
      }
      async function loadSupervisionHistory(before = '') {
        const version = ++historyRequest.current
        setSupervisionHistoryBusy(true)
        setSupervisionHistoryError('')
        if (!before) setSupervisionHistory({ items: [], total: 0, nextCursor: '' })
        try {
          const query = new URLSearchParams({ limit: '30', status: supervisionFilter, sessionId: supervisionSession, before })
          const data = await request('/supervision/history?' + query)
          if (version === historyRequest.current) setSupervisionHistory((current) => ({ ...data,
            items: before ? [...new Map([...current.items, ...data.items].map((row) => [row.id, row])).values()] : data.items }))
          return version === historyRequest.current
        } catch (error) {
          if (version === historyRequest.current) setSupervisionHistoryError(error.message)
          return false
        } finally { if (version === historyRequest.current) setSupervisionHistoryBusy(false) }
      }
      async function refreshSupervisionHistory() {
        const loaded = await loadSupervisionHistory()
        if (loaded) setToast(tt('supervisorHistoryRefreshed'))
      }
      async function configureDesktopBridge() {
        if (!desktopStatus?.bridgeReady || desktopBusy || !window.confirm(tt('supervisorConfigureConfirm'))) return
        setDesktopBusy(true)
        ++desktopStatusRequest.current
        try {
          const result = await request('/supervision/desktop/status', { method: 'POST', body: JSON.stringify({ action: 'configure', configPath: desktopStatus.configPath }) })
          setDesktopStatus(result)
          if (result.backupPath) setDesktopBackup(result.backupPath)
          await refreshDesktopStatus(true)
        } catch (error) { setDesktopStatusError(error.message) }
        finally { setDesktopBusy(false) }
      }
      async function openSupervisorDesktop() {
        try {
          await request('/supervision/desktop/open', { method: 'POST', body: '{}' })
          await refreshDesktopStatus(true)
        } catch (error) { setDesktopStatusError(error.message) }
      }
      useEffect(() => {
        refreshSupervision()
        const timer = setInterval(refreshSupervision, 5000)
        return () => { clearInterval(timer); ++supervisionRequest.current }
      }, [])
      const showDesktopStatus = activeWorkspace === 'supervision' && (supervisionView === 'settings' || supervisionStatus.engine === 'desktop')
      useEffect(() => {
        if (!showDesktopStatus) return
        refreshDesktopStatus()
        const timer = setInterval(() => refreshDesktopStatus(), 5000)
        return () => { clearInterval(timer); ++desktopStatusRequest.current }
      }, [showDesktopStatus])
      useEffect(() => {
        if (activeWorkspace !== 'supervision' || supervisionView !== 'history') return
        loadSupervisionHistory()
        return () => { ++historyRequest.current }
      }, [activeWorkspace, supervisionView, supervisionFilter, supervisionSession])
      function editMonitorSetting(key, value) {
        setSettingsDraft((current) => ({ ...current, [key]: value }))
      }
      async function saveMonitorSettings(event) {
        event.preventDefault()
        if (settingsBusy) return
        const patch = { supervision: {} }
        for (const [key, value] of Object.entries(settingsDraft)) {
          if (['manualAcceptance', 'autoPrompt', 'defaultAction', 'dailyBudgetUsd'].includes(key)) {
            patch[key] = key === 'dailyBudgetUsd' ? Number(value) : value
          } else patch.supervision[key] = key.endsWith('Ms') ? Number(value) * 1000 : key.startsWith('max') ? Number(value) : value
        }
        if (patch.supervision.sleepMode === true && !(Number(patch.dailyBudgetUsd ?? reviewSettings.dailyBudgetUsd) > 0)) {
          fail(tt('supervisorSleepBudgetRequired'))
          return
        }
        setSettingsBusy(true)
        try {
          const result = await saveSettings(patch)
          setReviewSettings((current) => ({ ...current, ...result }))
          setSettingsDraft({})
          setToast(tt('supervisorSaved'))
          await refreshSupervision()
        } catch (error) { fail(error.message, error.hint, error.details) }
        finally { setSettingsBusy(false) }
      }
      function viewMonitorHistory(sessionId = '') {
        setSupervisionSession(sessionId)
        setSupervisionFilter('')
        setSupervisionView('history')
      }
      async function refreshAdoptList() {
        if (adoptBusy) return
        setAdoptBusy(true)
        setAdoptError('')
        try {
          const data = await listSessions()
          setAllSessions(Array.isArray(data.items) ? data.items : [])
          await refreshSupervision()
        } catch (error) {
          setAdoptError(error.message)
        } finally {
          setAdoptBusy(false)
        }
      }      async function adoptSession(item) {
        if (!item || adoptBusy) return
        setAdoptBusy(true)
        setAdoptBusyId(item.sessionId)
        setAdoptError('')
        try {
          await request('/supervision', { method: 'POST', body: JSON.stringify({ sessionId: item.sessionId, action: 'adopt' }) })
          setToast(tt('supervisorAdoptedToast'))
          await refreshSupervision()
          const data = await listSessions()
          setAllSessions(Array.isArray(data.items) ? data.items : [])
        } catch (error) {
          setAdoptError(error.message)
        } finally {
          setAdoptBusy(false)
          setAdoptBusyId('')
        }
      }
      async function supervisorAction(row, action) {
        try {
          // 规划/审查任务模式会按设计关掉全局监工，此时单个会话的「恢复监工」会被
          // 全局开关挡住。用户主动点恢复就是要监工，所以先切到「执行」再恢复，
          // 而不是留一个点了没反应的死按钮。
          if (action === 'resume' && supervisionStatus.enabled !== true) {
            await request('/task-modes', { method: 'POST', body: JSON.stringify({ id: 'execute' }) })
            setToast(tt('supervisorGlobalEnabled'))
          }
          await request('/supervision', { method: 'POST', body: JSON.stringify({ sessionId: row.sessionId, action }) })
          await refreshSupervision()
        } catch (error) { fail(error.message, error.hint, error.details) }
      }
      async function desktopSupervisor(row, action) {
        const requestId = row.pending.id
        if (desktopTaskBusy) return
        setDesktopTaskBusy(requestId)
        try {
          const result = await request('/supervision/desktop', { method: 'POST', body: JSON.stringify({
            sessionId: row.sessionId, requestId, action,
            ...(action === 'submit' ? { decision: desktopReplyDraft?.id === requestId ? desktopReplyDraft.text : '' } : {}),
          }) })
          if (action === 'open') await copyBrief(result.prompt, false)
          else setDesktopReplyDraft((current) => current?.id === requestId ? null : current)
          await refreshSupervision()
        } catch (error) { fail(error.message, error.hint, error.details) }
        finally { setDesktopTaskBusy('') }
      }
      function supervisorPhase(phase) {
        // With global monitoring off nothing will ever check this row, so saying
        // "waiting for the next turn" would be a lie.
        if (phase === 'watching' && supervisionStatus.enabled === false) return tt('supervisorPhaseOff')
        const key = { watching: 'supervisorPhaseWatching', reviewing: 'supervisorPhaseReviewing', retrying: 'supervisorPhaseRetrying',
          'awaiting-desktop': 'supervisorPhaseDesktop', sending: 'supervisorPhaseSending', complete: 'supervisorPhaseComplete',
          paused: 'supervisorPhasePaused', attention: 'supervisorPhaseAttention' }[phase]
        return key ? tt(key) : phase
      }

      const update = useCallback((patch) => {
        setForm((current) => ({ ...current, ...patch }))
      }, [])

      /* A snapshot can carry a preset this Host does not have (the shipped
         default `claude` needs @norman-else/dsh-claude). Re-sending it would
         make /dispatch reject the whole request, so drop it once the real
         roster is known and fall back to DSH's own default. */
      useEffect(() => {
        if (!Array.isArray(agentPresets) || agentPresets.length === 0) return
        const chosen = form.agentPreset
        if (!chosen) return
        if (agentPresets.some((item) => item && item.id === chosen)) return
        setForm((current) => (current.agentPreset === chosen ? { ...current, agentPreset: '' } : current))
      }, [agentPresets, form.agentPreset])

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
                manualAcceptance: data.manualAcceptance === true,
                supervision: data.supervision || current.supervision,
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
        const loadTaskModes = async () => {
          try {
            const data = await request('/task-modes')
            if (!stopped && data) {
              const active = data.active || 'execute'
              setTaskModeActive(active)
              setTaskModeItems(Array.isArray(data.items) ? data.items : [])
              setForm((current) => ({ ...current, taskMode: active }))
            }
          } catch {}
        }
        loadTaskModes()
        const modeTimer = setInterval(loadTaskModes, 20000)
        return () => { stopped = true; clearInterval(modeTimer) }
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
            presetsResult,
          ] = await Promise.allSettled([
            request('/detect'),
            request('/history'),
            listSessions(),
            listClaudeSessions(),
            getUsage(),
            request('/presets'),
          ])
          if (stopped) return
          if (detectResult.status === 'fulfilled') {
            setDetect(detectResult.value)
            setDetectError('')
            // Seed the toggle from the row config once, then leave it to the reader.
            setInSessionSeeded((seeded) => {
              if (!seeded) {
                const features = detectResult.value && detectResult.value.features
                setInSession(Boolean(features && features.firstQuestionInSession))
              }
              return true
            })
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
          if (presetsResult.status === 'fulfilled') {
            setAgentPresets(
              Array.isArray(presetsResult.value && presetsResult.value.items)
                ? presetsResult.value.items
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
        } catch (error) { fail(error.message, error.hint, error.details) }
      }

      async function clearBackgroundJobs() {
        try {
          const response = await request('/jobs/dismiss', { method: 'POST', body: JSON.stringify({}) })
          const remaining = Array.isArray(response.jobs) ? response.jobs : []
          setBackgroundJobs(remaining)
          setJob((current) => (current && remaining.some((item) => item.id === current.id) ? current : null))
          if (response.removed) setToast(tt('jobsCleared'))
        } catch (error) { fail(error.message, error.hint, error.details) }
      }

      async function dismissBackgroundJob(id) {
        try {
          const response = await request('/jobs/dismiss', { method: 'POST', body: JSON.stringify({ id }) })
          const remaining = Array.isArray(response.jobs) ? response.jobs : backgroundJobs.filter((item) => item.id !== id)
          setBackgroundJobs(remaining)
          setJob((current) => (current?.id === id ? null : current))
        } catch (error) { fail(error.message, error.hint, error.details) }
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
          } catch (error) { fail(error.message, error.hint, error.details); return }
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
        if ((job.kind === 'brief' || job.kind === 'brief-session')) {
          setBrief(job.result)
          setAnswer('')
          setRefined(null)
          setPromptText('')
          setPhase('answer')
        } else if (job.kind === 'refine') {
          const title = job.result.projectTitle || form.projectName || brief?.projectTitle || ''
          setRefined(job.result)
          setPromptText(job.result.handoffPrompt || withHeader(title, job.result.dshPrompt || ''))
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
      // Which engine will actually run the next Claude call, and why.
      const agentEngine = detect && detect.agentEngine ? detect.agentEngine : null
      const engineHint = agentEngine
        ? [
            agentEngine.active === 'sdk'
              ? (agentEngine.sdk && agentEngine.sdk.from
                  ? `${tt('statusEngineSdk')}: ${agentEngine.sdk.from}`
                  : tt('statusEngineSdk'))
              : (detect && detect.cli && detect.cli.path ? detect.cli.path : ''),
            Array.isArray(agentEngine.denyTools) && agentEngine.denyTools.length > 0
              ? `${tt('statusEngineDeny')}${agentEngine.denyTools.join(', ')}`
              : '',
          ].filter(Boolean).join('\n')
        : ''
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
      /* A finished-and-failed job used to sit in the top strip forever, so a
         run of failures piled up with only Retry offered. Keep the strip for
         work that is live or genuinely recent, and let the operator clear it. */
      const FAILED_STRIP_MS = 15 * 60 * 1000
      const visibleJobs = useMemo(() => {
        const now = Date.now()
        return backgroundJobs.filter((item) => {
          if (item.state === 'running') return true
          if (item.state === 'interrupted' || item.state === 'error' || item.state === 'cancelled') {
            const at = item.finishedAt || item.startedAt || 0
            return now - at < FAILED_STRIP_MS
          }
          return item.state === 'done' && ['first-question', 'acceptance-brief', 'acceptance', 'devdoc'].includes(item.kind)
        }).slice(0, 4)
      }, [backgroundJobs, Math.floor(clock / 60)])
      const clearableJobs = useMemo(
        () => backgroundJobs.filter((item) => item.state !== 'running'),
        [backgroundJobs],
      )

      function fail(message, hint, details) {
        setNotice({ message, hint: hint || '', details: details || null })
      }

      async function startBrief() {
        if (startingBrief) return
        if (form.goal.trim().length < 4) {
          fail(tt('requiredGoal'))
          return
        }
        setNotice(null)
        setDispatch({ state: 'idle' })
        setStartingBrief(true)
        try {
          const started = await startBackgroundJob(inSession ? 'brief-session' : 'brief', {
            projectDir: form.projectDir,
            projectName: form.projectName,
            goal: form.goal,
            permissionMode: form.permissionMode,
            agentPreset: form.agentPreset || undefined,
          })
          setBrief(null)
          setRefined(null)
          setPromptText('')
          setAnswer('')
          setPhase('brief')
        } catch (error) {
          fail(error.message, error.hint, error.details)
        } finally {
          setStartingBrief(false)
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
          fail(error.message, error.hint, error.details)
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
            agentPreset: form.agentPreset || undefined,
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
          setDispatch({ state: 'error', message: error.message, hint: error.hint, details: error.details })
        }
      }

      async function browse() {
        if (browsing) return
        setBrowsing(true)
        try {
          const chosen = await pickDirectory()
          if (chosen) update({ projectDir: chosen })
        } catch (error) {
          fail(error.message, tt('openFailed'))
        } finally {
          setBrowsing(false)
        }
      }

      async function openDesktopFlow() {
        if (startingBrief) return
        if (form.goal.trim().length < 4) {
          fail(tt('requiredGoal'))
          return
        }
        setNotice(null)
        setStartingBrief(true)
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
          fail(error.message, error.hint, error.details)
        } finally {
          setStartingBrief(false)
        }
      }

      async function copyBrief(value, launch) {
        if (copyBusy) return
        setCopyBusy(true)
        try {
          const data = await request('/desktop', {
            method: 'POST',
            body: JSON.stringify({ brief: value, launch: Boolean(launch) }),
            timeoutMs: 40_000,
          })
          if (data && data.copied) setToast(tt('copied'))
          else fail(tt('copyFailed'))
        } catch (error) {
          fail(error.message, error.hint, error.details)
        } finally {
          setCopyBusy(false)
        }
      }

      async function continueFromDesktop() {
        if (continuingDesktop) return
        if (desktopReply.trim().length === 0) {
          fail(tt('desktopNoReply'))
          return
        }
        const title = form.projectName || '新项目'
        setContinuingDesktop(true)
        setRefined({
          projectTitle: title,
          summary: '',
          plan: [],
          acceptance: [],
          risks: [],
          dshPrompt: desktopReply.trim(),
        })
        try {
          const data = await request('/prompts/handoff', { method: 'POST', body: JSON.stringify({ title, body: desktopReply.trim() }) })
          setPromptText(data.content)
          setPhase('refined')
        } catch (error) { fail(error.message, error.hint, error.details) }
        finally { setContinuingDesktop(false) }
      }

      async function openCcSwitch() {
        try {
          await request('/cc-switch', { method: 'POST', body: '{}' })
          setToast(tt('statusCcSwitch'))
        } catch (error) {
          fail(error.message, error.hint, error.details)
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

      const monitorStats = supervisionStatus.stats
      const desktopState = desktopStatus?.state || 'unknown'
      const desktopConnected = desktopState === 'connected'
      const connectionLabel = tt({
        connected: 'supervisorConnectionConnected',
        'running-unconnected': 'supervisorConnectionRunning',
        'not-running': 'supervisorConnectionStopped',
      }[desktopState] || 'supervisorConnectionUnknown')

      function renderDesktopConnection() {
        const detail = desktopStatus?.configError || desktopStatus?.processNote || (desktopStatus && (
          !desktopStatus.bridgeReady ? tt('supervisorRuntimeMissing')
            : desktopStatus.needsReload ? tt('supervisorConnectionReload')
              : !desktopStatus.mcpConfigured && !desktopConnected ? tt('supervisorConnectionMissing') : ''))
        return h('section', { className: 'cc-monitorBand' },
          h('div', { className: 'cc-monitorSectionHead' },
            h('h2', { className: 'cc-cardTitle' }, tt('supervisorConnectionTitle')),
            h(Chip, { on: desktopConnected, warn: desktopState === 'running-unconnected', label: connectionLabel,
              hint: desktopStatus?.lastHeartbeatAt && desktopConnected ? timeText(desktopStatus.lastHeartbeatAt) : '' })),
          detail ? h('p', { className: 'cc-hint' }, detail) : null,
          desktopStatusError ? h('div', { className: 'cc-inlineWarn', role: 'alert' }, desktopStatusError) : null,
          desktopStatus?.clientInfo ? h('div', { className: 'cc-meta' }, `${tt('supervisorBridgeClient')}: ${desktopStatus.clientInfo.name} ${desktopStatus.clientInfo.version} · ${desktopStatus.protocolVersion}`) : null,
          desktopStatus?.configPath ? h('div', { className: 'cc-monitorPath cc-meta' }, `${tt('supervisorBridgePath')}: `, h('code', null, desktopStatus.configPath)) : null,
          desktopBackup ? h('div', { className: 'cc-monitorPath cc-meta' }, `${tt('supervisorBridgeBackup')}: `, h('code', null, desktopBackup)) : null,
          h('p', { className: 'cc-hint' }, tt('supervisorConnectionInfo')),
          h('div', { className: 'cc-actions' },
            h(Button, { variant: 'ghost', disabled: desktopBusy, onClick: () => refreshDesktopStatus(true) }, tt('supervisorRefreshDesktop')),
            !desktopStatus?.mcpConfigured ? h(Button, { variant: 'primary', busy: desktopBusy,
              disabled: desktopBusy || !desktopStatus?.bridgeReady || Boolean(desktopStatus?.configError),
              onClick: configureDesktopBridge }, tt('supervisorConfigure')) : null,
            desktopState === 'not-running' ? h(Button, { variant: 'ghost', onClick: openSupervisorDesktop }, tt('supervisorOpenApp')) : null))
      }

      function renderSupervisionSettings() {
        const cfg = reviewSettings.supervision
        const toggle = (key, label, value) => h('label', { className: 'cc-switch' },
          h('input', { type: 'checkbox', checked: settingsDraft[key] ?? value,
            onChange: (event) => editMonitorSetting(key, event.target.checked) }), label)
        const input = (key, label, min, max, step, value) => h('label', { className: 'cc-field', key },
          h('span', { className: 'cc-label' }, label), h('input', { className: 'cc-input', type: 'number', required: true, min, max, step,
            value: settingsDraft[key] ?? value, onChange: (event) => editMonitorSetting(key, event.target.value) }))
        return h('section', { className: 'cc-monitorSettings' },
          h('form', { onSubmit: saveMonitorSettings, className: 'cc-monitorForm' },
            h('fieldset', { className: 'cc-monitorBand', disabled: settingsBusy },
              h('legend', { className: 'cc-cardTitle' }, tt('supervisorSettingsButton')),
              toggle('enabled', tt('supervisorEnabled'), cfg.enabled),
              toggle('sleepMode', tt('supervisorSleepMode'), cfg.sleepMode),
              cfg.sleepMode || settingsDraft.sleepMode === true
                ? h('div', { className: 'cc-inlineWarn' }, tt('supervisorSleepModeHint'))
                : null,
              h('label', { className: 'cc-field cc-monitorEngine' }, h('span', { className: 'cc-label' }, tt('supervisorEngineLabel')),
                h('select', { className: 'cc-select', value: settingsDraft.sleepMode === true || cfg.sleepMode ? 'cli' : (settingsDraft.engine ?? cfg.engine),
                  disabled: settingsDraft.sleepMode === true || cfg.sleepMode,
                  onChange: (event) => editMonitorSetting('engine', event.target.value) },
                  h('option', { value: 'cli' }, tt('supervisorCli')), h('option', { value: 'desktop' }, tt('supervisorDesktop')))),
              h('div', { className: 'cc-monitorBoundGrid' },
                input('cooldownMs', tt('supervisorCooldown'), 0, 3600, 0.001, cfg.cooldownMs / 1000),
                input('retryBaseMs', tt('supervisorRetryDelay'), 1, 3600, 0.001, cfg.retryBaseMs / 1000),
                input('maxRetries', tt('supervisorMaxRetries'), 0, 5, 1, cfg.maxRetries),
                input('maxNoProgress', tt('supervisorNoProgress'), 1, 20, 1, cfg.maxNoProgress),
                input('maxRounds', tt('supervisorMaxRounds'), 1, 1000, 1, cfg.maxRounds),
                input('dailyBudgetUsd', tt('dailyBudgetLabel'), 0, undefined, 'any', reviewSettings.dailyBudgetUsd))),
            h('fieldset', { className: 'cc-monitorBand', disabled: settingsBusy },
              h('legend', { className: 'cc-cardTitle' }, tt('acceptanceOptional')),
              toggle('manualAcceptance', tt('manualAcceptanceToggle'), reviewSettings.manualAcceptance),
              toggle('autoPrompt', tt('autoPromptToggle'), reviewSettings.autoPrompt),
              (settingsDraft.autoPrompt ?? reviewSettings.autoPrompt) ? h('label', { className: 'cc-field cc-monitorEngine' },
                h('span', { className: 'cc-label' }, tt('defaultActionLabel')),
                h('select', { className: 'cc-select', value: settingsDraft.defaultAction ?? reviewSettings.defaultAction,
                  onChange: (event) => editMonitorSetting('defaultAction', event.target.value) },
                  h('option', { value: 'none' }, tt('defaultActionNone')), h('option', { value: 'claude' }, tt('defaultActionClaude')))) : null),
            h('div', { className: 'cc-actions' }, h(Button, { type: 'submit', variant: 'primary', busy: settingsBusy,
              disabled: settingsBusy || !Object.keys(settingsDraft).length }, tt('supervisorSave')))),
          renderDesktopConnection())
      }

      function renderSupervisionHistory() {
        const outcomes = {
          preparing: 'supervisorPreparing', running: 'supervisorPhaseReviewing',
          'awaiting-desktop': 'supervisorPending', continued: 'supervisorContinued', complete: 'supervisorCompleted',
          wait: 'supervisorWaited', failed: 'supervisorFailed', uncertain: 'supervisorUncertain', paused: 'supervisorPhasePaused',
          cancelled: 'supervisorCancelled', interrupted: 'supervisorInterrupted', stale: 'supervisorStale', control: 'supervisorControlRecord',
        }
        const sessionRows = supervisionStatus.items || []
        return h('section', { className: 'cc-monitorHistoryPage', 'aria-busy': supervisionHistoryBusy },
          h('div', { className: 'cc-monitorSectionHead cc-monitorFilters' },
            h('select', { className: 'cc-select', 'aria-label': tt('supervisorHistoryStatus'), value: supervisionFilter,
              onChange: (event) => setSupervisionFilter(event.target.value) },
              h('option', { value: '' }, tt('supervisorHistoryFilterAll')),
              Object.entries(outcomes).map(([value, label]) => h('option', { value, key: value }, tt(label)))),
            h('select', { className: 'cc-select', 'aria-label': tt('supervisorSessionFilter'), value: supervisionSession,
              onChange: (event) => setSupervisionSession(event.target.value) },
              h('option', { value: '' }, tt('supervisorAllSessions')),
              sessionRows.map((row) => h('option', { key: row.sessionId, value: row.sessionId }, `${row.objective?.slice(0, 48) || row.sessionId} · ${row.sessionId.slice(0, 8)}`))),
            h(Button, { variant: 'ghost', busy: supervisionHistoryBusy, disabled: supervisionHistoryBusy, onClick: refreshSupervisionHistory }, tt('supervisorRefreshHistory'))),
          supervisionHistoryError ? h('div', { className: 'cc-inlineWarn', role: 'alert' }, supervisionHistoryError) : null,
          supervisionHistory.items.length ? h('div', { className: 'cc-monitorHistoryList' }, supervisionHistory.items.map((item) =>
            h('article', { className: 'cc-monitorHistoryItem', key: item.id },
              h('div', { className: 'cc-monitorHistoryHead' },
                h('span', { className: 'cc-badge' }, outcomes[item.status] ? tt(outcomes[item.status]) : item.status),
                h('time', { className: 'cc-meta' }, timeText(item.startedAt)),
                item.engine ? h('span', { className: 'cc-meta' }, item.engine === 'desktop' ? 'Desktop' : 'CLI / SDK') : null,
                item.durationMs > 0 ? h('span', { className: 'cc-meta' }, formatDuration(item.durationMs)) : null),
              h('div', { className: 'cc-monitorHistoryObjective', title: item.sessionId }, item.objective || item.sessionId),
              item.reason ? h('div', { className: 'cc-monitorReason' }, item.reason) : null,
              item.note || item.error ? h('div', { className: item.error ? 'cc-inlineWarn' : 'cc-hint' }, item.error || item.note) : null,
              item.evidence?.length || item.message ? h('details', { className: 'cc-monitorEvidence' },
                h('summary', null, tt('supervisorEvidence'), item.evidence?.length ? ` (${item.evidence.length})` : ''),
                item.message ? h('div', { className: 'cc-monitorHistoryMessage' }, item.message) : null,
                item.evidence?.length ? h('ul', null, item.evidence.map((text, index) => h('li', { key: index }, text))) : null) : null)))
            : h('div', { className: 'cc-monitorBand cc-hint' }, supervisionHistoryBusy ? tt('supervisorHistoryLoading') : tt('supervisorHistoryEmpty')),
          h('div', { className: 'cc-monitorSectionHead' },
            h('span', { className: 'cc-meta' }, `${supervisionHistory.items.length} / ${supervisionHistory.total} · ${tt('supervisorRetention')}`),
            supervisionHistory.nextCursor ? h(Button, { variant: 'ghost', busy: supervisionHistoryBusy, disabled: supervisionHistoryBusy,
              onClick: () => loadSupervisionHistory(supervisionHistory.nextCursor) }, tt('supervisorLoadMore')) : null))
      }

      function renderPendingReview(row) {
        const { id, prompt } = row.pending
        const draft = desktopReplyDraft?.id === id ? desktopReplyDraft.text : ''
        const busy = desktopTaskBusy === id
        return h('details', { className: 'cc-desktopPending', key: id },
          h('summary', null, tt('supervisorTask')),
          desktopConnected ? h('p', { className: 'cc-hint' }, tt('supervisorDesktopHint'), ' ', h('code', null, id)) : null,
          h('div', { className: 'cc-actions' },
            h(Button, { variant: 'ghost', busy, disabled: Boolean(desktopTaskBusy), onClick: () => desktopSupervisor(row, 'open') }, tt('supervisorOpenDesktop')),
            h(Button, { variant: 'link', onClick: () => copyBrief(prompt, false) }, tt('supervisorDesktopPrompt'))),
          h('details', { className: 'cc-monitorEvidence' }, h('summary', null, tt('supervisorManualReply')),
            h('label', { className: 'cc-field' }, h('span', { className: 'cc-label' }, tt('supervisorDesktopPrompt')),
              h('textarea', { className: 'cc-textarea', readOnly: true, value: prompt || '', rows: 3 })),
            h('label', { className: 'cc-field' }, h('span', { className: 'cc-label' }, tt('supervisorReply')),
              h('textarea', { className: 'cc-textarea', value: draft, rows: 3, onChange: (event) => setDesktopReplyDraft({ id, text: event.target.value }) })),
            h(Button, { variant: 'primary', busy, disabled: Boolean(desktopTaskBusy) || !draft.trim(), onClick: () => desktopSupervisor(row, 'submit') }, tt('supervisorSubmit'))))
      }

      function renderSupervisionOverview() {
        const rows = supervisionStatus.items || []
        const tallies = [['executions', 'supervisorExecuted'], ['decisions', 'supervisorDecisions'], ['continued', 'supervisorContinued'],
          ['completed', 'supervisorCompleted'], ['failed', 'supervisorFailed'], ['pendingDesktop', 'supervisorPending']]
        return h('section', { className: 'cc-supervisionOverview' },
          h('div', { className: 'cc-monitorSectionHead' },
            h(Chip, { on: supervisionStatus.enabled === true, label: supervisionStatus.sleepMode ? tt('supervisorSleepActive') : supervisionStatus.enabled === undefined ? tt('supervisorUnavailable')
              : tt(supervisionStatus.enabled ? 'supervisorWaiting' : 'supervisorOff') }),
            supervisionStatus.engine === 'desktop' ? h(Button, { variant: 'link', onClick: () => setSupervisionView('settings') }, connectionLabel) : null,
            h(Button, { variant: 'link', onClick: () => setSupervisionView('adopt') }, tt('supervisorAdoptButton')),
            h(Button, { variant: 'link', onClick: () => viewMonitorHistory() }, `${tt('supervisorHistoryButton')} (${monitorStats?.retainedRecords || 0})`)),
          h('dl', { className: 'cc-monitorStats', title: tt('supervisorCountHint') }, tallies.map(([key, label]) =>
            h('div', { className: 'cc-monitorStat', key },
              h('dt', { className: 'cc-monitorLabel' }, tt(label)),
              h('dd', { className: 'cc-monitorNumber' }, monitorStats ? Number(monitorStats[key] || 0).toLocaleString() : '—')))),
          monitorStats?.legacyChecks ? h('div', { className: 'cc-hint' }, `${tt('supervisorLegacyChecks')}: ${monitorStats.legacyChecks}`) : null,
          supervisionStatus.sleepMode ? h('div', { className: 'cc-success' }, tt('supervisorSleepActive')) : null,
          supervisionStatus.enabled === false ? h('div', { className: 'cc-inlineWarn' }, tt('supervisorGlobalOffHint')) : null,
          rows.length ? h('div', { className: 'cc-sessionMonitorList' }, rows.map((row) => {
            const resume = ['paused', 'attention', 'complete'].includes(row.phase)
            return h('article', { className: 'cc-sessionMonitor', key: row.sessionId },
              h('div', { className: 'cc-monitorSectionHead' },
                h('span', { className: 'cc-monitorSessionName', title: row.workspace || row.sessionId }, row.objective || row.sessionId),
                h('span', { className: 'cc-badge' }, supervisorPhase(row.phase))),
              h('div', { className: 'cc-monitorSessionCounts' }, [[tt('supervisorExecuted'), row.stats?.executions],
                [tt('supervisorContinued'), row.stats?.continued], [tt('supervisorFailed'), row.stats?.failed]]
                .map(([label, count]) => `${label} ${count || 0}`).join(' · ')),
              row.disconnected ? h('div', { className: 'cc-inlineWarn' }, tt('supervisorSessionDisconnected'))
                : row.note || row.error ? h('div', { className: row.error ? 'cc-inlineWarn' : 'cc-hint' }, row.error || row.note) : null,
              h('div', { className: 'cc-monitorSessionActions' },
                h(Button, { variant: 'link', onClick: () => openSessionNow(row.sessionId) }, tt('supervisorOpen')),
                h(Button, { variant: 'link', onClick: () => viewMonitorHistory(row.sessionId) }, tt('supervisorHistoryButton')),
                h(Button, { variant: 'link', disabled: row.phase === 'sending',
                  title: supervisionStatus.enabled === false ? tt('supervisorGlobalOffHint') : '',
                  onClick: () => supervisorAction(row, resume ? 'resume' : 'pause') }, tt(resume ? 'supervisorResume' : 'supervisorPause'))),
              row.phase === 'awaiting-desktop' && row.pending ? renderPendingReview(row) : null)
          })) : h('div', { className: 'cc-monitorBand cc-hint' }, tt('supervisorEmpty')))
      }

      /**
       * Take over any existing DSH conversation, including one this plugin
       * never dispatched. Previously a row only appeared through passive
       * signals, so a session started in the DSH UI had no way in.
       */
      function renderSupervisionAdopt() {
        const search = adoptSearch.trim().toLowerCase()
        const items = allSessions.filter((item) => !search
          || `${item.title || ''} ${item.cwd || ''} ${item.sessionId}`.toLowerCase().includes(search)).slice(0, 60)
        return h('section', { className: 'cc-monitorHistoryPage' },
          h('div', { className: 'cc-monitorSectionHead' },
            h('h2', { className: 'cc-cardTitle' }, tt('supervisorAdoptTitle')),
            h(Button, { variant: 'ghost', busy: adoptBusy, disabled: adoptBusy, onClick: refreshAdoptList }, tt('supervisorAdoptRefresh'))),
          h('p', { className: 'cc-hint' }, tt('supervisorAdoptHint')),
          adoptError ? h('div', { className: 'cc-inlineWarn', role: 'alert' }, adoptError) : null,
          h('input', {
            className: 'cc-input', type: 'search', value: adoptSearch,
            placeholder: tt('sessionSearch'),
            onChange: (event) => setAdoptSearch(event.target.value),
          }),
          items.length
            ? h('div', { className: 'cc-sessionPicker' }, items.map((item) => h('div', {
              key: item.sessionId, className: 'cc-sessionPick cc-sessionPickRow',
            },
              h('span', { className: 'cc-sessionPickInfo' },
                h('span', { className: 'cc-recordTitle', title: sessionLabel(item) }, sessionLabel(item)),
                item.cwd ? h('span', { className: 'cc-sessionPickPath', title: item.cwd }, item.cwd) : null),
              h('span', { className: 'cc-sessionPickerMeta' },
                `${item.running ? tt('sessionRunning') : timeAgo(item.updatedAt, tt)} · ${item.sessionId.slice(-6)}`),
              h(Button, {
                variant: item.monitored ? 'link' : 'primary',
                busy: adoptBusy && adoptBusyId === item.sessionId,
                disabled: Boolean(adoptBusy) || item.monitored === true,
                onClick: () => adoptSession(item),
              }, item.monitored ? tt('supervisorAdopted') : tt('supervisorAdoptAction')))))
            : h('div', { className: 'cc-monitorBand cc-hint' },
              adoptBusy ? tt('supervisorAdoptLoading') : tt('supervisorAdoptEmpty')))
      }

      function renderSupervisionPage() {
        return h('div', { className: 'cc-supervisionPage' },
          h('nav', { className: 'cc-modeTabs cc-monitorNav', 'aria-label': tt('supervisorTitle') },
            [['overview', 'supervisorOverview'], ['adopt', 'supervisorAdoptButton'], ['history', 'supervisorHistoryButton'], ['settings', 'supervisorSettingsButton']].map(([key, label]) =>
              h('button', { type: 'button', key, className: supervisionView === key ? 'on' : '', 'aria-pressed': supervisionView === key,
                onClick: () => setSupervisionView(key) }, tt(label)))),
          supervisionError || supervisionStatus.error ? h('div', { className: 'cc-inlineWarn', role: 'alert' }, supervisionError || supervisionStatus.error) : null,
          supervisionView === 'settings' ? renderSupervisionSettings()
            : supervisionView === 'adopt' ? renderSupervisionAdopt()
              : supervisionView === 'history' ? renderSupervisionHistory() : renderSupervisionOverview())
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
            agentPreset: form.agentPreset || undefined,
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
          h(PromptEditor, { ids: ['devdocReview', 'devdocRules', 'devdocSend'], tt }),
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
          devDocSession
            ? null
            : h(AgentPresetPicker, {
                tt,
                value: form.agentPreset,
                presets: agentPresets,
                onChange: (value) => update({ agentPreset: value }),
              }),
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
        const item = selectableSession(sortedSessions, current) || (!current ? sortedSessions[0] : null)
        const target = item?.sessionId || current || ''
        openFirstQuestionDialog({
          sessionId: target,
          projectDir: item && item.cwd,
          title: sessionLabel(item) || target,
        })
      }

      function openFirstQuestionDialog(entry) {
        const latest = selectableSession(sortedSessions, entry?.sessionId)
        const target = latest
          ? { sessionId: latest.sessionId, projectDir: latest.cwd, title: sessionLabel(latest) }
          : entry || { sessionId: '', projectDir: '', title: '' }
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
          .then((data) => {
            const items = Array.isArray(data && data.items) ? data.items : []
            setAllSessions(items)
            const latest = selectableSession(items, target.sessionId)
            if (!latest || latest.sessionId === target.sessionId) return
            setFirstQuestion((current) => current && current.entry.sessionId === target.sessionId
              && !current.busy && !current.generated
              ? { ...current, entry: { sessionId: latest.sessionId, projectDir: latest.cwd, title: sessionLabel(latest) } }
              : current)
          })
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
        } finally {
          setBrowsing(false)
        }
      }

      async function archiveCurrent() {
        if (archiving || !dispatch || !dispatch.sessionId) return
        setArchiving(true)
        try {
          await archiveTask(dispatch.sessionId)
          setToast(tt('archived'))
        } catch (error) {
          fail(error.message, error.hint, error.details)
        } finally {
          setArchiving(false)
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
        h(PromptEditor, { key: form.engine, ids: form.engine === 'cli' ? ['brief', 'commanderSystem'] : ['desktop'], tt }),
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
            h(Button, { variant: 'ghost', busy: browsing, disabled: browsing, onClick: browse }, tt('browse')),
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
          Field,
          { label: tt('taskModeLabel'), hint: tt('taskModeHint') },
          h(
            'select',
            {
              className: 'cc-input',
              value: taskModes.active || form.taskMode || 'execute',
              onChange: (event) => applyTaskMode(event.target.value),
            },
            (taskModes.items.length ? taskModes.items : [
              { id: 'plan', label: tt('taskModePlan'), description: '' },
              { id: 'execute', label: tt('taskModeExecute'), description: '' },
              { id: 'review', label: tt('taskModeReview'), description: '' },
            ]).map((item) => h('option', { key: item.id, value: item.id }, item.label)),
          ),
        ),
        h(
          'div',
          { className: 'cc-actions' },
          form.engine === 'cli'
            ? h(
                Button,
                {
                  variant: 'primary',
                  busy: startingBrief || (running && job && (job.kind === 'brief' || job.kind === 'brief-session')),
                  disabled: startingBrief || running || !cliReady,
                  onClick: startBrief,
                },
                startingBrief || (running && job && (job.kind === 'brief' || job.kind === 'brief-session')) ? tt('starting') : tt('startBrief'),
              )
            : h(
                Button,
                { variant: 'primary', busy: startingBrief, disabled: startingBrief || running, onClick: openDesktopFlow },
                tt('openDesktop'),
              ),
          running
            ? h(Button, { variant: 'ghost', onClick: cancelJob }, tt('cancel'))
            : null,
          form.engine === 'cli' && !running
            ? h(
                'label',
                {
                  className: 'cc-switch',
                  title: tt('inSessionHint'),
                },
                h('input', {
                  type: 'checkbox',
                  checked: inSession,
                  onChange: (event) => setInSession(event.target.checked),
                }),
                tt('inSessionLabel'),
              )
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
            h(Button, { variant: 'primary', busy: continuingDesktop, disabled: continuingDesktop, onClick: continueFromDesktop }, tt('desktopContinue')),
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
            reviewSettings.manualAcceptance ? h(
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
            ) : null,
            h(Button, { variant: 'ghost', onClick: reset }, tt('newProject')),
            h(Button, { variant: 'ghost', busy: archiving, disabled: archiving, onClick: archiveCurrent }, tt('archive')),
          ),
        )
      } else if (showingBrief()) {
        rightCard = h(
          'div',
          { className: 'cc-card' },
          job && (job.kind === 'brief' || job.kind === 'brief-session') && running
            ? h(
                'div',
                { className: 'cc-progress' },
                h('span', { className: 'cc-spinner cc-spinnerDark' }),
                h('span', null, job.phase || tt('starting')),
                h('span', { className: 'cc-progressTime' }, `${elapsed}s`),
              )
            : null,
          job && (job.kind === 'brief' || job.kind === 'brief-session') && job.state === 'error'
            ? h(Notice, { notice: { message: job.error, hint: job.hint, details: job.details }, tt, onRetry: startBrief })
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
                h(PromptEditor, { ids: ['refine', 'handoff', 'commanderSystem'], tt }),
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
                  ? h(Notice, { notice: { message: job.error, hint: job.hint, details: job.details }, tt, onRetry: submitAnswer })
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
            ? h(Notice, { notice: { message: job.error, hint: job.hint, details: job.details }, tt, onRetry: startBrief })
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

      function AgentPresetPicker({ tt, value, presets, onChange }) {
        if (!Array.isArray(presets) || presets.length === 0) return null
        return h(
          'label',
          { className: 'cc-field' },
          h('span', { className: 'cc-label' }, tt('agentPresetLabel')),
          h(
            'select',
            {
              className: 'cc-select',
              value,
              onChange: (event) => onChange(event.target.value),
            },
            presets.map((item) =>
              h(
                'option',
                { value: item.id, key: item.id },
                item.name + (item.isDefault ? '（默认）' : ''),
              ),
            ),
          ),
          h('div', { className: 'cc-hint' }, tt('agentPresetHint')),
        )
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
              h(PromptEditor, { ids: ['refine', 'handoff', 'commanderSystem'], tt }),
              h('div', { className: 'cc-hint' }, tt('handoffHint')),
              h('textarea', {
                className: 'cc-textarea cc-textareaCode',
                rows: 12,
                value: promptText,
                onChange: (event) => setPromptText(event.target.value),
              }),
            ),
            dispatch.state === 'error'
              ? h(Notice, { notice: { message: dispatch.message, hint: dispatch.hint, details: dispatch.details }, tt })
              : null,
            h(AgentPresetPicker, {
              tt,
              value: form.agentPreset,
              presets: agentPresets,
              onChange: (value) => update({ agentPreset: value }),
            }),
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

      async function applyTaskMode(id) {
        try {
          const data = await request('/task-modes', { method: 'POST', body: JSON.stringify({ id }) })
          setTaskModeActive(data.active || id)
          setTaskModeItems(Array.isArray(data.items) ? data.items : [])
          const selected = Array.isArray(data.items) ? data.items.find((item) => item.id === (data.active || id)) : null
          if (selected) setReviewSettings((current) => ({
            ...current,
            manualAcceptance: selected.manualAcceptance === true,
            autoPrompt: selected.autoPrompt === true,
            defaultAction: selected.defaultAction || 'none',
            supervision: current.supervision?.sleepMode === true
              ? { ...selected.supervision, sleepMode: true, enabled: true, engine: 'cli' }
              : (selected.supervision || current.supervision),
          }))
          setForm((current) => ({ ...current, taskMode: data.active || id }))
          setToast(tt('taskModeApplied'))
          await refreshSupervision()
        } catch (error) { fail(error.message, error.hint, error.details) }
      }

      async function refreshClaudeStatus() {
        if (claudeStatusBusy) return
        setClaudeStatusBusy(true)
        try {
          const [detected, sessions, jobsResult, modes] = await Promise.allSettled([
            request('/detect'),
            listClaudeSessions(),
            request('/jobs/list'),
            request('/task-modes'),
          ])
          let applied = 0
          if (detected.status === 'fulfilled') {
            setDetect(detected.value)
            setDetectError('')
            applied += 1
          }
          if (sessions.status === 'fulfilled') {
            setClaudeSessions(Array.isArray(sessions.value && sessions.value.items) ? sessions.value.items : [])
            applied += 1
          }
          if (jobsResult.status === 'fulfilled') {
            setBackgroundJobs(Array.isArray(jobsResult.value && jobsResult.value.jobs) ? jobsResult.value.jobs : [])
            applied += 1
          }
          if (modes.status === 'fulfilled' && modes.value) {
            const active = modes.value.active || 'execute'
            setTaskModeActive(active)
            setTaskModeItems(Array.isArray(modes.value.items) ? modes.value.items : [])
            setForm((current) => ({ ...current, taskMode: active }))
            applied += 1
          }
          if (applied === 0) throw new Error('Claude 状态刷新失败')
          setToast(tt('claudeStatusRefreshed'))
        } catch (error) { fail(error.message, error.hint, error.details) }
        finally { setClaudeStatusBusy(false) }
      }

      async function forkCurrentClaudeSession(item) {
        if (!item) return
        if (!window.confirm(tt('sessionForkConfirm'))) return
        try {
          await request('/claude-session/fork', { method: 'POST', body: JSON.stringify({ key: item.key }) })
          setClaudeSessions((current) => current.map((entry) => entry.key === item.key
            ? { ...entry, forkPending: true, forkFrom: entry.sessionId, forkRequestedAt: Date.now() }
            : entry))
          setToast(tt('sessionForkDone'))
        } catch (error) { fail(error.message, error.hint, error.details) }
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
      const currentTaskMode = taskModes.items.find((item) => item.id === (taskModes.active || form.taskMode))
      const projectJobs = form.projectDir
        ? backgroundJobs.filter((item) => normalizeProject(
            item.projectDir || (item.payload && item.payload.projectDir),
          ) === normalizeProject(form.projectDir))
        : []
      const currentClaudeJob = projectJobs.find((item) => item.state === 'running') || null
      const latestClaudeJob = projectJobs[0] || null
      const recentFailure = latestClaudeJob
        && ['error', 'interrupted'].includes(latestClaudeJob.state)
        && Date.now() - (latestClaudeJob.finishedAt || latestClaudeJob.startedAt || 0) < 15 * 60_000
      const engineAvailable = cliReady || Boolean(agentEngine && agentEngine.active === 'sdk' && agentEngine.sdk && agentEngine.sdk.available)
      const claudeStatus = currentClaudeJob
        ? 'running'
        : recentFailure && latestClaudeJob.state === 'error'
          ? 'error'
          : recentFailure && latestClaudeJob.state === 'interrupted'
            ? 'interrupted'
            : !engineAvailable
              ? 'unavailable'
              : currentClaude
                ? 'idle'
                : 'new'
      const claudeStatusLabel = {
        running: tt('claudeStatusRunning'),
        error: tt('claudeStatusError'),
        interrupted: tt('claudeStatusInterrupted'),
        idle: tt('claudeStatusIdle'),
        new: tt('claudeStatusNew'),
        unavailable: tt('claudeStatusUnavailable'),
      }[claudeStatus] || tt('claudeStatusUnknown')
      const claudeTaskLabel = currentClaudeJob
        ? (currentClaudeJob.phase || currentClaudeJob.kind)
        : latestClaudeJob
          ? `${latestClaudeJob.phase || latestClaudeJob.kind} · ${tt('claudeStatusLastTask')}`
          : '—'

      if (activeWorkspace === 'supervision') {
        main = renderSupervisionPage()
      } else if (activeWorkspace === 'devdoc') {
        main = h('div', { className: 'cc-devDocWorkspace' }, renderDevDocView())
      } else if (activeWorkspace === 'continue' && !firstQuestion) {
        main = h(SessionPicker, {
          sessions: sortedSessions,
          query: sessionSearch,
          onQueryChange: setSessionSearch,
          onSelect: (item) => openFirstQuestionDialog({ sessionId: item.sessionId, projectDir: item.cwd, title: sessionLabel(item) }),
          tt,
        })
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
              hint: detect && detect.cli && detect.cli.path ? detect.cli.path : '',
            }),
            h(Chip, {
              on: Boolean(agentEngine && agentEngine.active === 'sdk'),
              warn: Boolean(agentEngine && agentEngine.requested === 'sdk' && !(agentEngine.sdk && agentEngine.sdk.available)),
              label: agentEngine && agentEngine.active === 'sdk'
                ? tt('statusEngineSdk')
                : tt('statusEngineCli'),
              hint: engineHint,
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
                  h('span', { className: 'cc-sessionUse' }, currentClaude.forkPending ? tt('sessionForkPending') : claudeUseLabel(currentClaude.label)),
                   h(
                     'button',
                     {
                       type: 'button',
                       className: 'cc-sessionReset',
                       onClick: () => forkCurrentClaudeSession(currentClaude),
                     },
                     tt('sessionFork'),
                   ),
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
              ['supervision', tt('supervisorTitle')],
            ].map(([mode, label]) => h(
              'button',
              {
                type: 'button', key: mode, role: 'tab',
                'aria-selected': activeWorkspace === mode,
                className: activeWorkspace === mode ? 'on' : '',
                title: mode === 'supervision' && monitorStats ? `${tt('supervisorExecuted')}: ${monitorStats.executions}` : undefined,
                onClick: () => {
                  if (mode === 'devdoc') openDevDoc()
                  else {
                    setActiveWorkspace(mode)
                    setRecordsOpen(false)
                    if (mode === 'supervision') { setSupervisionView('overview'); refreshSupervision() }
                    if (mode === 'continue') listSessions().then((data) => setAllSessions(data.items || [])).catch(() => {})
                  }
                },
              },
              label,
              mode === 'supervision' && monitorStats ? h('span', { className: 'cc-monitorTabCount' }, Number(monitorStats.executions || 0).toLocaleString()) : null,
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
                  item.state !== 'running'
                    ? h(Button, { variant: 'link', onClick: () => dismissBackgroundJob(item.id) }, tt('jobDismiss'))
                    : null,
                )),
                clearableJobs.length
                  ? h('div', { className: 'cc-backgroundJobsActions' },
                      h(Button, { variant: 'link', onClick: clearBackgroundJobs }, tt('jobsClear')))
                  : null,
              )
            : null,
          h('div', { className: 'cc-toolbarActions' },
            h(Button, { variant: 'link', onClick: openRecords }, tt('records')),
          ),
        ),
        activeWorkspace !== 'supervision'
          ? h(
              'section',
              { className: `cc-claudeStatusCard cc-claudeStatus-${claudeStatus}` },
              h('div', { className: 'cc-claudeStatusHead' },
                h('div', { className: 'cc-cardTitle' }, tt('claudeStatusTitle')),
                h('span', { className: 'cc-statusPill' }, h('i', { className: `cc-dot ${claudeStatus === 'running' ? 'on' : ['unavailable', 'error', 'interrupted'].includes(claudeStatus) ? 'warn' : ''}` }), claudeStatusLabel),
                h(Button, {
                  variant: 'link',
                  busy: claudeStatusBusy,
                  disabled: claudeStatusBusy,
                  onClick: refreshClaudeStatus,
                }, claudeStatusBusy ? tt('claudeStatusRefreshing') : tt('claudeStatusRefresh')),
              ),
              h('div', { className: 'cc-claudeStatusGrid' },
                h('div', null, h('span', { className: 'cc-statusLabel' }, tt('claudeStatusEngine')), h('strong', null, agentEngine && agentEngine.active === 'sdk' ? tt('statusEngineSdk') : tt('statusEngineCli'))),
                h('div', null, h('span', { className: 'cc-statusLabel' }, tt('claudeStatusSession')), h('strong', null, currentClaude ? currentClaude.sessionId.slice(0, 12) : '—')),
                h('div', null, h('span', { className: 'cc-statusLabel' }, tt('claudeStatusTask')), h('strong', null, claudeTaskLabel)),
                h('div', null, h('span', { className: 'cc-statusLabel' }, tt('claudeStatusLastUse')), h('strong', null, currentClaude ? claudeUseLabel(currentClaude.label) : '—')),
              ),
              h('p', { className: 'cc-claudeStatusNote' }, `${tt('claudeStatusSource')}：${tt('claudeStatusPlugin')}${currentTaskMode ? ` · ${currentTaskMode.label}` : ''}`),
            )
          : null,
        notice ? h(Notice, { notice, tt }) : null,
        main,
        activeWorkspace !== 'supervision' && h(
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
                    entry.sessionId && reviewSettings.manualAcceptance
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
                h(PromptEditor, { ids: ['firstQuestion', 'firstQuestionSend'], tt }),
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
                                  title: sessionLabel(selected),
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
                        (item.sessionId === activeSessionId || item.forkSessionIds?.includes(activeSessionId)) ? `[${tt('currentSession')}]` : '',
                        sessionLabel(item),
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
                h(PromptEditor, { key: dialog.mode, ids: dialog.mode === 'dsh' ? ['acceptanceBrief', 'acceptanceFallback'] : ['judge', 'judgeSystem'], tt }),
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
/* ===========================================================================
   Claude on DSH — panel stylesheet
   ---------------------------------------------------------------------------
   This panel is not a form bolted onto a host: it is the one surface where this
   plugin speaks, so it borrows the language of Claude Code Desktop rather than
   the host's own chrome. Three things carry that language:

     1. Warm paper. The canvas is #faf9f5, cards are #fffdf8, and edges are
        hairlines of ink at 10% — no grey boxes, no heavy shadows. A bordered
        white card on a warm ground is what makes a page read as "Claude".
     2. A serif voice for headings, a sans voice for the interface. Latin serif
        first, the CJK sans families named after it so Chinese headings never
        fall back to a foreign face.
     3. One accent, #d97757, used sparingly: the sparkle, the primary action,
        the step that is happening now. Everything else is ink on paper.

   The palette is stated once in the .cc-panel block below; every rule after it
   reads those variables. Dark comes from light-dark() keyed on the element's
   own color-scheme, which the two rules after the token block set from the
   host's dark mark. Nothing here depends on another plugin being installed.
   =========================================================================== */

/* Tokens are scoped to the plugin's own surfaces, never to :root. A token on
   :root would also be readable — and overridable — by the host, and a
   color-scheme on :root rewrites the entire page's rendering (scrollbars,
   form controls, every light-dark() in the host's own stylesheet). The review
   badge and its modal render in conversation.chat.assistant-actions, outside
   .cc-panel, so they are listed here too. */
.cc-panel,
.cc-reviewBadge,
.cc-modalBackdrop {
  /* paper & ink */
  --cc-paper: light-dark(#fffdf8, #262523);
  --cc-paper-2: light-dark(#faf9f5, #1f1e1c);
  --cc-cream: light-dark(#f5f2ec, #1a1917);
  --cc-ink: light-dark(#1c1b19, #f5f2ec);
  --cc-ink-2: light-dark(#52504b, #c6c1b8);
  --cc-muted: light-dark(#7b7871, #a09b92);
  --cc-line: light-dark(rgba(28, 27, 25, 0.1), rgba(245, 242, 236, 0.12));
  --cc-line-strong: light-dark(rgba(28, 27, 25, 0.18), rgba(245, 242, 236, 0.2));
  /* one accent, three depths */
  --cc-accent: #d97757;
  --cc-accent-strong: light-dark(#bf5f3d, #e6906f);
  --cc-accent-tint: light-dark(rgba(217, 119, 87, 0.09), rgba(217, 119, 87, 0.14));
  --cc-accent-line: light-dark(rgba(217, 119, 87, 0.3), rgba(217, 119, 87, 0.42));
  /* semantic */
  --cc-ok: light-dark(#2f7a52, #7dc39a);
  --cc-warn: light-dark(#9a6a12, #e0b258);
  --cc-bad: light-dark(#a83a2c, #e58a7c);
  --cc-ok-tint: light-dark(rgba(47, 122, 82, 0.08), rgba(125, 195, 154, 0.12));
  --cc-warn-tint: light-dark(rgba(154, 106, 18, 0.08), rgba(224, 178, 88, 0.12));
  --cc-bad-tint: light-dark(rgba(168, 58, 44, 0.07), rgba(229, 138, 124, 0.12));
  /* type */
  --cc-serif: 'Anthropic Serif Web Text', 'Anthropic Serif', 'Iowan Old Style', 'Palatino Linotype', Georgia,
    'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'PingFang SC', 'Microsoft YaHei', serif;
  --cc-sans: 'Anthropic Sans Web Text', 'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system,
    'PingFang SC', 'Microsoft YaHei', sans-serif;
  --cc-mono: 'Anthropic Mono Web', 'JetBrains Mono', ui-monospace, 'SF Mono', Consolas, 'Liberation Mono',
    'Microsoft YaHei', monospace;
  /* shape & rhythm */
  --cc-r-lg: 16px;
  --cc-r-md: 12px;
  --cc-r-sm: 8px;
  --cc-r-xs: 5px;
  --cc-shadow: light-dark(0 1px 2px rgba(28, 27, 25, 0.04), 0 1px 2px rgba(0, 0, 0, 0.3));
  --cc-shadow-pop: light-dark(0 12px 32px rgba(28, 27, 25, 0.12), 0 16px 40px rgba(0, 0, 0, 0.45));

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 14px;
  block-size: 100%;
  min-block-size: 0;
  overflow: auto;
  padding: 18px clamp(14px, 2.6vw, 32px) 48px;
  background: var(--cc-cream);
  color: var(--cc-ink);
  font-family: var(--cc-sans);
  font-size: 13px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  container-type: inline-size;
}

/* The element's own scheme decides which half of every light-dark() applies.
   Scoped to the plugin's surfaces: putting color-scheme on the root would
   change how the host itself renders, which is exactly the theme bleed this
   avoids. */
.cc-panel,
.cc-reviewBadge,
.cc-modalBackdrop { color-scheme: light; }
body[data-ds-dark-theme] :is(.cc-panel, .cc-reviewBadge, .cc-modalBackdrop),
body[data-theme="dark"] :is(.cc-panel, .cc-reviewBadge, .cc-modalBackdrop),
body.dark :is(.cc-panel, .cc-reviewBadge, .cc-modalBackdrop) { color-scheme: dark; }

.cc-panel > * {
  box-sizing: border-box;
  min-inline-size: 0;
  inline-size: 100%;
  max-inline-size: 1060px;
  margin-inline: auto;
}

/* When dsh-claude-style is installed it marks the body; the panel then joins
   that scheme instead of standing beside it. Inert on a host without the skin.
   Every fallback is the literal the token would otherwise have: pointing the
   fallback at var(--cc-x) references the very declaration being overridden,
   which CSS treats as a cycle and resolves to nothing. */
body[data-dsh-claude-style] .cc-panel {
  --cc-paper: var(--dsh-claude-card, light-dark(#fffdf8, #262523));
  --cc-paper-2: var(--dsh-claude-canvas, light-dark(#faf9f5, #1f1e1c));
  --cc-cream: var(--dsh-claude-canvas, light-dark(#f5f2ec, #1a1917));
  --cc-ink: var(--dsw-alias-label-primary, light-dark(#1c1b19, #f5f2ec));
  --cc-muted: var(--dsw-alias-label-secondary, light-dark(#7b7871, #a09b92));
  --cc-line: var(--dsw-alias-border-l1, light-dark(rgba(28, 27, 25, 0.1), rgba(245, 242, 236, 0.12)));
  --cc-serif: var(--dsh-claude-font-serif, 'Iowan Old Style', 'Palatino Linotype', Georgia, 'Noto Serif SC', serif);
  --cc-sans: var(--dsw-font-family, 'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif);
  --cc-mono: var(--dsh-claude-font-code, ui-monospace, 'SF Mono', Consolas, monospace);
}

/* light-dark() needs Chromium 123 / Safari 17.5. An older core would otherwise
   invalidate every token at once and leave the panel with no surface at all, so
   the light half is restated literally when the function is unavailable. */
@supports not (color: light-dark(#fff, #000)) {
  .cc-panel,
  .cc-reviewBadge,
  .cc-modalBackdrop {
    --cc-paper: #fffdf8;
    --cc-paper-2: #faf9f5;
    --cc-cream: #f5f2ec;
    --cc-ink: #1c1b19;
    --cc-ink-2: #52504b;
    --cc-muted: #7b7871;
    --cc-line: rgba(28, 27, 25, 0.1);
    --cc-line-strong: rgba(28, 27, 25, 0.18);
    --cc-accent-strong: #bf5f3d;
    --cc-accent-tint: rgba(217, 119, 87, 0.09);
    --cc-accent-line: rgba(217, 119, 87, 0.3);
    --cc-ok: #2f7a52;
    --cc-warn: #9a6a12;
    --cc-bad: #a83a2c;
    --cc-ok-tint: rgba(47, 122, 82, 0.08);
    --cc-warn-tint: rgba(154, 106, 18, 0.08);
    --cc-bad-tint: rgba(168, 58, 44, 0.07);
    --cc-shadow: 0 1px 2px rgba(28, 27, 25, 0.04);
    --cc-shadow-pop: 0 12px 32px rgba(28, 27, 25, 0.12);
  }
  .cc-modalBackdrop { background: rgba(28, 27, 25, 0.32); }
}

/* ---------- hero ---------- */

.cc-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 16px;
  border: 1px solid var(--cc-line);
  border-radius: var(--cc-r-lg);
  background: var(--cc-paper);
  box-shadow: var(--cc-shadow);
}

.cc-mark {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  inline-size: 44px;
  block-size: 44px;
  border-radius: var(--cc-r-md);
  border: 1px solid var(--cc-accent-line);
  background: var(--cc-accent-tint);
  color: var(--cc-accent);
}

.cc-heroText { min-inline-size: 0; flex: 1 1 300px; }

.cc-heading {
  margin: 0;
  font-family: var(--cc-serif);
  font-size: 25px;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.015em;
  color: var(--cc-ink);
}

.cc-subtitle {
  margin: 6px 0 0;
  font-family: var(--cc-sans);
  color: var(--cc-muted);
  font-size: 12.5px;
  line-height: 1.5;
}

.cc-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  justify-content: flex-end;
  margin-inline-start: auto;
  max-inline-size: 52%;
}

/* ---------- status chips ---------- */

.cc-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  block-size: 24px;
  padding: 0 10px;
  border: 1px solid var(--cc-line);
  border-radius: 999px;
  background: var(--cc-paper);
  color: var(--cc-ink-2);
  font-size: 11.5px;
  white-space: nowrap;
  max-inline-size: 240px;
}

.cc-chipLabel { overflow: hidden; text-overflow: ellipsis; }

.cc-dot {
  flex: 0 0 auto;
  inline-size: 6px;
  block-size: 6px;
  border-radius: 50%;
  background: var(--cc-muted);
  opacity: 0.5;
}
.cc-dot.on { background: var(--cc-ok); opacity: 1; }
.cc-dot.warn { background: var(--cc-warn); opacity: 1; }

.cc-budgetChip {
  display: inline-flex;
  align-items: center;
  block-size: 24px;
  padding: 0 10px;
  border: 1px solid var(--cc-line);
  border-radius: 999px;
  background: var(--cc-paper);
  color: var(--cc-ink-2);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.cc-budgetChip.over {
  border-color: var(--cc-accent-line);
  background: var(--cc-accent-tint);
  color: var(--cc-accent-strong);
}

.cc-claudeStatusCard {
  position: relative;
  z-index: 1;
  display: grid;
  flex: 0 0 auto;
  gap: 8px;
  max-inline-size: 100%;
  overflow: hidden;
  padding: 10px 12px;
  border: 1px solid var(--cc-line);
  border-radius: var(--cc-r-sm);
  background: var(--cc-paper);
}
.cc-claudeStatusHead,
.cc-claudeStatusGrid { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; min-inline-size: 0; }
.cc-claudeStatusHead .cc-cardTitle { margin-inline-end: auto; }
.cc-claudeStatusGrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 145px), 1fr)); align-items: start; }
.cc-claudeStatusGrid > div { display: grid; gap: 1px; min-inline-size: 0; }
.cc-statusLabel { color: var(--cc-muted); font-size: 11px; }
.cc-claudeStatusGrid strong { overflow-wrap: anywhere; font-size: 12px; font-weight: 600; }
.cc-statusPill { display: inline-flex; align-items: center; gap: 5px; color: var(--cc-ink-2); font-size: 11.5px; }
.cc-claudeStatus-running { border-color: var(--cc-accent-line); background: var(--cc-accent-tint); }
.cc-claudeStatus-unavailable,
.cc-claudeStatus-error,
.cc-claudeStatus-interrupted { border-color: var(--cc-warn); }
.cc-claudeStatusNote { margin: 0; color: var(--cc-muted); font-size: 11px; }

.cc-sessionChip .cc-sessionReset + .cc-sessionReset { margin-inline-start: -5px; }

  display: inline-flex;
  align-items: center;
  gap: 7px;
  block-size: 24px;
  padding: 0 4px 0 10px;
  border: 1px solid var(--cc-accent-line);
  border-radius: 999px;
  background: var(--cc-accent-tint);
  color: var(--cc-ink-2);
  font-size: 11.5px;
  white-space: nowrap;
  max-inline-size: 330px;
}
.cc-sessionName { overflow: hidden; text-overflow: ellipsis; }
.cc-sessionUse { color: var(--cc-accent-strong); }
.cc-sessionReset {
  border: 0;
  border-radius: 999px;
  padding: 2px 8px;
  background: transparent;
  color: var(--cc-accent-strong);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
}
.cc-sessionReset:hover { background: var(--cc-accent-tint); }

.cc-usageLine {
  padding: 2px 0;
  color: var(--cc-muted);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}

/* ---------- toolbar & mode tabs ---------- */

.cc-panelToolbar,
.cc-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.cc-toolbar > .cc-btn { flex: 0 0 auto; }
.cc-toolbar .cc-steps { flex: 1 1 auto; min-inline-size: 0; }
.cc-toolbarActions { display: flex; align-items: center; gap: 8px; margin-inline-start: auto; }

.cc-modeTabs {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border: 1px solid var(--cc-line);
  border-radius: 999px;
  background: var(--cc-cream);
}
.cc-modeTabs button {
  border: 0;
  border-radius: 999px;
  padding: 6px 16px;
  background: transparent;
  color: var(--cc-muted);
  font: inherit;
  font-size: 12.5px;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.cc-modeTabs button:hover { color: var(--cc-ink); }
.cc-modeTabs button.on {
  background: var(--cc-paper);
  color: var(--cc-ink);
  box-shadow: var(--cc-shadow);
}

/* ---------- steps ---------- */

.cc-steps {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid var(--cc-line);
  border-radius: var(--cc-r-md);
  background: var(--cc-paper);
}
.cc-step {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--cc-muted);
  font-size: 12px;
}
.cc-step b {
  display: grid;
  place-items: center;
  inline-size: 20px;
  block-size: 20px;
  border-radius: 50%;
  border: 1px solid var(--cc-line-strong);
  font-size: 11px;
  font-weight: 500;
  color: inherit;
}
.cc-step.active { color: var(--cc-ink); }
.cc-step.active b {
  border-color: var(--cc-accent);
  background: var(--cc-accent);
  color: #fff;
}
.cc-step.done { color: var(--cc-ink-2); }
.cc-step.done b {
  border-color: var(--cc-ok);
  background: var(--cc-ok-tint);
  color: var(--cc-ok);
}
.cc-sep { color: var(--cc-line-strong); }

/* ---------- grid & cards ---------- */

.cc-grid {
  display: grid;
  grid-template-columns: minmax(300px, 0.94fr) minmax(340px, 1.1fr);
  gap: 18px;
  align-items: start;
}

.cc-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-inline-size: 0;
}
.cc-sectionHead {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}
.cc-sectionTitle {
  margin: 0;
  font-family: var(--cc-serif);
  font-size: 17px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--cc-ink);
}
.cc-sectionAside { margin-inline-start: auto; color: var(--cc-muted); font-size: 11.5px; }

.cc-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-inline-size: 0;
  padding: 18px 20px;
  border: 1px solid var(--cc-line);
  border-radius: var(--cc-r-md);
  background: var(--cc-paper);
  box-shadow: var(--cc-shadow);
}

.cc-cardTitle {
  margin: 0;
  font-family: var(--cc-serif);
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: var(--cc-ink);
}

.cc-meta { color: var(--cc-muted); font-size: 11.5px; }

/* ---------- fields ---------- */

.cc-field { display: flex; flex-direction: column; gap: 7px; min-inline-size: 0; }
.cc-label { color: var(--cc-ink-2); font-size: 12px; font-weight: 500; }
.cc-hint { color: var(--cc-muted); font-size: 11.5px; line-height: 1.5; }

.cc-input,
.cc-textarea,
.cc-select {
  box-sizing: border-box;
  inline-size: 100%;
  border: 1px solid var(--cc-line-strong);
  border-radius: var(--cc-r-sm);
  background: var(--cc-paper-2);
  color: var(--cc-ink);
  padding: 9px 11px;
  font: inherit;
  font-size: 12.5px;
  outline: none;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}
.cc-input::placeholder,
.cc-textarea::placeholder { color: var(--cc-muted); opacity: 0.8; }
.cc-input:focus,
.cc-textarea:focus,
.cc-select:focus {
  border-color: var(--cc-accent);
  box-shadow: 0 0 0 3px var(--cc-accent-tint);
}
.cc-textarea { resize: vertical; line-height: 1.65; min-block-size: 72px; }
.cc-textareaCode,
.cc-code {
  font-family: var(--cc-mono);
  font-size: 12px;
  line-height: 1.6;
}

.cc-row { display: flex; align-items: center; gap: 8px; min-inline-size: 0; }
.cc-row .cc-input { flex: 1 1 auto; min-inline-size: 0; }
.cc-row .cc-btn { flex: 0 0 auto; white-space: nowrap; }

.cc-promptVariables { font-size: 11.5px; color: var(--cc-muted); }
.cc-promptVariables code {
  padding: 1px 5px;
  border-radius: var(--cc-r-xs);
  background: var(--cc-cream);
  font-family: var(--cc-mono);
  font-size: 11px;
}

/* ---------- segmented choices ---------- */

.cc-seg { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.cc-seg button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 10px 12px;
  border: 1px solid var(--cc-line-strong);
  border-radius: var(--cc-r-sm);
  background: var(--cc-paper-2);
  color: var(--cc-ink);
  font: inherit;
  text-align: start;
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease;
}
.cc-seg button:hover { background: var(--cc-cream); }
.cc-seg button.on {
  border-color: var(--cc-accent);
  background: var(--cc-accent-tint);
  box-shadow: inset 0 0 0 1px var(--cc-accent);
}
.cc-segTitle { font-size: 12.5px; font-weight: 500; }
.cc-segHint { color: var(--cc-muted); font-size: 11px; }

.cc-option,
.cc-options .cc-option {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 9px 12px;
  border: 1px solid var(--cc-line);
  border-radius: var(--cc-r-sm);
  background: var(--cc-paper-2);
  color: var(--cc-ink-2);
  font-size: 12.5px;
  text-align: start;
  cursor: pointer;
}
.cc-option:hover { border-color: var(--cc-line-strong); color: var(--cc-ink); }
.cc-options { display: flex; flex-direction: column; gap: 7px; }

/* ---------- buttons ---------- */

.cc-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 9px; }
.cc-actionsEnd { margin-block-start: 2px; }

.cc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-block-size: 34px;
  padding: 0 15px;
  border: 1px solid transparent;
  border-radius: var(--cc-r-sm);
  font: inherit;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease, color 120ms ease;
}
.cc-btn:disabled { opacity: 0.42; cursor: not-allowed; }
.cc-btn:focus-visible { outline: 2px solid var(--cc-accent); outline-offset: 2px; }

.cc-btn.primary {
  background: var(--cc-accent);
  color: #fffdf8;
  border-color: var(--cc-accent);
}
.cc-btn.primary:hover:not(:disabled) { background: var(--cc-accent-strong); border-color: var(--cc-accent-strong); }

.cc-btn.ghost {
  background: var(--cc-paper);
  border-color: var(--cc-line-strong);
  color: var(--cc-ink);
}
.cc-btn.ghost:hover:not(:disabled) { background: var(--cc-cream); }

.cc-btn.link {
  min-block-size: 0;
  padding: 2px 0;
  background: transparent;
  border-color: transparent;
  color: var(--cc-accent-strong);
  border-radius: var(--cc-r-xs);
}
.cc-btn.link:hover:not(:disabled) { text-decoration: underline; }

/* ---------- prose blocks ---------- */

.cc-prose,
.cc-reviewOpinion,
.cc-recordContent,
.cc-promptBody,
.cc-successBody,
.cc-noticeBody {
  color: var(--cc-ink-2);
  font-size: 12.5px;
  line-height: 1.72;
  overflow-wrap: anywhere;
}
.cc-prose :is(h1, h2, h3, h4) {
  margin: 14px 0 6px;
  font-family: var(--cc-serif);
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--cc-ink);
}
.cc-prose h1 { font-size: 19px; }
.cc-prose h2 { font-size: 16px; }
.cc-prose h3 { font-size: 14px; }
.cc-prose p { margin: 0 0 8px; }
.cc-prose :is(ul, ol),
.cc-ul,
.cc-ol { margin: 6px 0; padding-inline-start: 20px; }
.cc-prose li,
.cc-ul li,
.cc-ol li { margin-block: 3px; }
.cc-prose code,
.cc-code {
  padding: 1px 5px;
  border-radius: var(--cc-r-xs);
  background: var(--cc-cream);
  font-family: var(--cc-mono);
  font-size: 11.5px;
}
.cc-prose strong { color: var(--cc-ink); font-weight: 600; }
.cc-prose a { color: var(--cc-accent-strong); text-underline-offset: 2px; }

.cc-question {
  padding: 14px 16px;
  border: 1px solid var(--cc-accent-line);
  border-inline-start: 3px solid var(--cc-accent);
  border-radius: var(--cc-r-sm);
  background: var(--cc-accent-tint);
  color: var(--cc-ink);
  font-size: 13px;
  line-height: 1.65;
}
.cc-outcome { color: var(--cc-muted); font-size: 11.5px; }

/* ---------- badges & banners ---------- */

.cc-reviewBadge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  block-size: 21px;
  padding: 0 9px;
  border: 1px solid var(--cc-line);
  border-radius: 999px;
  font: inherit;
  font-size: 11px;
  line-height: 21px;
  white-space: nowrap;
  max-inline-size: 320px;
  cursor: pointer;
  background: var(--cc-paper);
  color: var(--cc-ink-2);
}
.cc-reviewBadge.pass { border-color: var(--cc-ok); background: var(--cc-ok-tint); }
.cc-reviewBadge.fail { border-color: var(--cc-bad); background: var(--cc-bad-tint); }
.cc-reviewBadge.uncertain { border-color: var(--cc-warn); background: var(--cc-warn-tint); }
.cc-reviewBadge.pass .cc-reviewBadgeVerdict { color: var(--cc-ok); }
.cc-reviewBadge.fail .cc-reviewBadgeVerdict { color: var(--cc-bad); }
.cc-reviewBadge.uncertain .cc-reviewBadgeVerdict { color: var(--cc-warn); }
.cc-reviewBadgeVerdict { font-weight: 600; letter-spacing: 0.03em; }
.cc-reviewBadgeReason { overflow: hidden; text-overflow: ellipsis; color: var(--cc-muted); }

.cc-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border: 1px solid var(--cc-line);
  border-radius: 999px;
  background: var(--cc-cream);
  color: var(--cc-ink-2);
  font-size: 11px;
}

.cc-inlineWarn,
.cc-notice {
  padding: 11px 13px;
  border: 1px solid var(--cc-warn);
  border-radius: var(--cc-r-sm);
  background: var(--cc-warn-tint);
  color: var(--cc-ink);
  font-size: 12.5px;
}
.cc-noticeTitle { font-weight: 600; font-size: 12.5px; margin: 0 0 4px; }
.cc-noticeBody { font-size: 12px; }
.cc-noticeHint { margin-block-start: 6px; color: var(--cc-muted); font-size: 11.5px; }
.cc-noticeActions { display: flex; gap: 8px; margin-block-start: 9px; }

.cc-verdictBanner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border: 1px solid var(--cc-line);
  border-radius: var(--cc-r-sm);
  background: var(--cc-cream);
  font-size: 12.5px;
  font-weight: 500;
}

.cc-success {
  padding: 16px 18px;
  border: 1px solid var(--cc-ok);
  border-radius: var(--cc-r-md);
  background: var(--cc-ok-tint);
}
.cc-successHead { display: flex; align-items: center; gap: 9px; margin-block-end: 8px; }
.cc-successTitle {
  margin: 0;
  font-family: var(--cc-serif);
  font-size: 15px;
  font-weight: 500;
  color: var(--cc-ink);
}
.cc-successBody { font-size: 12.5px; }

.cc-toast {
  position: sticky;
  inset-block-end: 10px;
  align-self: center;
  padding: 8px 16px;
  border-radius: 999px;
  background: var(--cc-ink);
  color: var(--cc-paper);
  font-size: 12px;
  box-shadow: var(--cc-shadow-pop);
}

.cc-spinner {
  inline-size: 14px;
  block-size: 14px;
  border: 2px solid var(--cc-line-strong);
  border-top-color: var(--cc-accent);
  border-radius: 50%;
  animation: cc-spin 700ms linear infinite;
}
@keyframes cc-spin { to { rotate: 1turn; } }

/* ---------- collapsible sections ---------- */

.cc-advanced,
.cc-details,
.cc-promptDetails,
.cc-historyDetails,
.cc-accDetails {
  border: 1px solid var(--cc-line);
  border-radius: var(--cc-r-sm);
  background: var(--cc-paper);
}
.cc-advanced > summary,
.cc-details > summary,
.cc-promptDetails > summary,
.cc-historyDetails > summary,
.cc-accDetails > summary {
  padding: 9px 13px;
  color: var(--cc-ink-2);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  list-style: none;
}
.cc-advanced > summary::-webkit-details-marker,
.cc-details > summary::-webkit-details-marker,
.cc-promptDetails > summary::-webkit-details-marker { display: none; }
.cc-advanced > summary::before,
.cc-details > summary::before,
.cc-promptDetails > summary::before {
  content: '›';
  display: inline-block;
  inline-size: 14px;
  color: var(--cc-muted);
  transition: rotate 120ms ease;
}
.cc-advanced[open] > summary::before,
.cc-details[open] > summary::before,
.cc-promptDetails[open] > summary::before { rotate: 90deg; }
.cc-advanced > *:not(summary),
.cc-details > *:not(summary),
.cc-promptDetails > *:not(summary) { padding: 0 13px 12px; }
.cc-advanced .cc-budgetField { margin-block-start: 4px; }

/* ---------- records & history ---------- */

.cc-history { display: flex; flex-direction: column; gap: 10px; }
.cc-historyList,
.cc-recordList,
.cc-claudeSessions,
.cc-reviewListItem {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cc-historyMain,
.cc-recordItem,
.cc-claudeSession {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 11px 13px;
  border: 1px solid var(--cc-line);
  border-radius: var(--cc-r-sm);
  background: var(--cc-paper);
  cursor: pointer;
  transition: border-color 120ms ease, background 120ms ease;
}
.cc-historyMain:hover,
.cc-recordItem:hover,
.cc-claudeSession:hover { border-color: var(--cc-line-strong); background: var(--cc-cream); }
.cc-historyTitleRow { display: flex; align-items: baseline; gap: 8px; }
.cc-historyTitle,
.cc-recordTitle {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--cc-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cc-historyMuted,
.cc-recordMeta,
.cc-recordTime,
.cc-historyTime,
.cc-historyPath,
.cc-recordKind {
  color: var(--cc-muted);
  font-size: 11.5px;
}
.cc-recordTime,
.cc-historyTime { font-variant-numeric: tabular-nums; }
.cc-recordView { display: flex; flex-direction: column; gap: 10px; }
.cc-claudeSessionId { font-family: var(--cc-mono); font-size: 11px; color: var(--cc-muted); }
.cc-claudeSessionActions { display: flex; gap: 8px; }

/* ---------- session picker ---------- */

.cc-sessionPicker { display: flex; flex-direction: column; gap: 8px; }
.cc-sessionPick {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 11px 13px;
  border: 1px solid var(--cc-line);
  border-radius: var(--cc-r-sm);
  background: var(--cc-paper);
  text-align: start;
  font: inherit;
  cursor: pointer;
}
.cc-sessionPick:hover { border-color: var(--cc-accent-line); background: var(--cc-accent-tint); }
/* A row that carries its own action button is a container, not a button. */
.cc-sessionPickRow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  cursor: default;
}
.cc-sessionPickRow:hover { border-color: var(--cc-line); background: var(--cc-paper); }
.cc-sessionPickInfo { display: flex; align-items: baseline; gap: 8px; min-inline-size: 0; }
.cc-sessionPickPath { color: var(--cc-muted); font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cc-sessionPickerMeta { color: var(--cc-muted); font-size: 11.5px; }

/* ---------- dev doc ---------- */

.cc-devDoc { display: flex; flex-direction: column; gap: 12px; }
.cc-devDocHead { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.cc-devDocTitle { font-family: var(--cc-serif); font-size: 15px; font-weight: 500; color: var(--cc-ink); }
.cc-devDocStatus { color: var(--cc-muted); font-size: 11.5px; }
.cc-devDocVerdict { font-size: 12px; font-weight: 500; }
.cc-devDocDepartments { display: flex; flex-wrap: wrap; gap: 6px; }
.cc-devDocDept {
  padding: 3px 9px;
  border: 1px solid var(--cc-line);
  border-radius: 999px;
  background: var(--cc-cream);
  color: var(--cc-ink-2);
  font-size: 11px;
}
.cc-devDocReview { display: flex; flex-direction: column; gap: 8px; }
.cc-devDocWorkspace { display: flex; flex-direction: column; gap: 12px; }

/* ---------- acceptance ---------- */

.cc-accCheck { display: flex; align-items: center; gap: 8px; font-size: 12.5px; }
.cc-accCheckName { color: var(--cc-ink-2); }
.cc-reviewEvidence {
  margin: 6px 0 0;
  padding-inline-start: 18px;
  color: var(--cc-muted);
  font-size: 11.5px;
}
.cc-reviewSettingsBody { display: flex; flex-direction: column; gap: 10px; }
.cc-settingsSummary { color: var(--cc-muted); font-size: 11.5px; }
.cc-refinedHead { display: flex; align-items: baseline; gap: 10px; }
.cc-badge { align-self: flex-start; }

/* ---------- background jobs ---------- */

.cc-backgroundJobs { display: flex; flex-direction: column; gap: 8px; }
.cc-backgroundJob {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border: 1px solid var(--cc-accent-line);
  border-radius: var(--cc-r-sm);
  background: var(--cc-accent-tint);
  font-size: 12px;
}
.cc-progress { flex: 1 1 auto; block-size: 4px; border-radius: 999px; background: var(--cc-line); overflow: hidden; }
.cc-progressTime { color: var(--cc-muted); font-size: 11.5px; font-variant-numeric: tabular-nums; }
.cc-backgroundJobsActions { display: flex; justify-content: flex-end; }

/* ---------- switch ---------- */

.cc-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--cc-ink-2);
  cursor: pointer;
}
.cc-switch input { inline-size: 15px; block-size: 15px; accent-color: var(--cc-accent); }

/* ---------- empty state ---------- */

.cc-emptyTitle {
  margin: 0;
  font-family: var(--cc-serif);
  font-size: 19px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--cc-ink);
  text-align: center;
}
.cc-emptyBody {
  margin: 8px auto 0;
  max-inline-size: 420px;
  color: var(--cc-muted);
  font-size: 12.5px;
  line-height: 1.7;
  text-align: center;
}
.cc-emptyMark { display: grid; place-items: center; color: var(--cc-accent); opacity: 0.9; }

/* ---------- modal ---------- */

.cc-modalBackdrop {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: light-dark(rgba(28, 27, 25, 0.32), rgba(0, 0, 0, 0.55));
  backdrop-filter: blur(4px);
  z-index: 60;
}
.cc-modal {
  box-sizing: border-box;
  /* .cc-modalClose is absolutely positioned; without a containing block here it
     escapes to the fixed backdrop and lands in the viewport corner. */
  position: relative;
  inline-size: min(680px, 100%);
  max-block-size: min(82vh, 860px);
  overflow: auto;
  padding: 22px 24px;
  border: 1px solid var(--cc-line);
  border-radius: var(--cc-r-lg);
  background: var(--cc-paper);
  color: var(--cc-ink);
  box-shadow: var(--cc-shadow-pop);
  font-size: 13px;
}
.cc-reviewModal { inline-size: min(660px, 100%); }
.cc-modalClose {
  position: absolute;
  inset-block-start: 12px;
  inset-inline-end: 12px;
  border: 0;
  background: transparent;
  color: var(--cc-muted);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}
.cc-reviewOpinion {
  max-block-size: 42vh;
  overflow: auto;
  padding: 12px 14px;
  border: 1px solid var(--cc-line);
  border-radius: var(--cc-r-sm);
  background: var(--cc-paper-2);
}

/* ---------- global supervision ---------- */

.cc-monitorTabCount {
  display: inline-block;
  min-inline-size: 1.2em;
  margin-inline-start: .45em;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--cc-accent-strong);
}
.cc-supervisionPage,
.cc-supervisionOverview,
.cc-monitorSettings,
.cc-monitorForm,
.cc-monitorHistoryPage { display: grid; gap: 12px; min-inline-size: 0; }
.cc-monitorNav { justify-self: start; max-inline-size: 100%; box-sizing: border-box; }
.cc-monitorBand,
.cc-sessionMonitor,
.cc-monitorHistoryItem { padding: 10px 12px; min-inline-size: 0; overflow-wrap: anywhere; }
.cc-monitorBand { margin: 0; border: 0; border-block: 1px solid var(--cc-line); }
.cc-monitorBand > legend { padding-inline-end: 8px; }
.cc-monitorBand > * + *,
.cc-desktopPending > * + *,
.cc-monitorEvidence > * + * { margin-block-start: 8px; }
.cc-monitorBand > p,
.cc-desktopPending > p { margin-block-end: 0; }
.cc-monitorSectionHead,
.cc-monitorHistoryHead,
.cc-monitorSessionActions { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; }
.cc-monitorSectionHead .cc-cardTitle,
.cc-monitorSectionHead .cc-monitorSessionName { margin-inline-end: auto; }
.cc-monitorSectionHead > *,
.cc-monitorHistoryHead > * { max-inline-size: 100%; }
.cc-monitorStats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 105px), 1fr));
  margin: 0;
  background: var(--cc-paper);
  border: 1px solid var(--cc-line);
  border-radius: var(--cc-r-sm);
  overflow: hidden;
}
.cc-monitorStat { display: flex; flex-direction: column; gap: 2px; padding: 8px 12px; min-inline-size: 0; }
.cc-monitorLabel { color: var(--cc-ink-2); font-size: 11.5px; overflow-wrap: anywhere; }
.cc-monitorNumber { margin: 0; font-size: 19px; font-weight: 600; line-height: 1.25; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.cc-sessionMonitorList,
.cc-monitorHistoryList { background: var(--cc-paper); border: 1px solid var(--cc-line); border-radius: var(--cc-r-sm); }
.cc-sessionMonitor + .cc-sessionMonitor,
.cc-monitorHistoryItem + .cc-monitorHistoryItem { border-block-start: 1px solid var(--cc-line); }
.cc-sessionMonitor,
.cc-monitorHistoryItem { display: grid; gap: 5px; }
.cc-monitorSessionName,
.cc-monitorHistoryObjective { font-weight: 600; }
.cc-monitorReason { color: var(--cc-ink-2); font-size: 12px; white-space: pre-wrap; overflow-wrap: anywhere; }
.cc-errorDetails { margin-block-start: 8px; }
.cc-errorDetails > summary { cursor: pointer; color: var(--cc-ink-2); font-size: 12px; }
.cc-errorDetailsLabel { margin-block-start: 8px; color: var(--cc-muted); font-size: 11.5px; }
.cc-errorDetailsBody {
  max-block-size: 260px;
  overflow: auto;
  margin: 4px 0 0;
  padding: 10px 12px;
  border: 1px solid var(--cc-line);
  border-radius: var(--cc-r-sm);
  background: var(--cc-paper-2);
  font-family: var(--cc-mono);
  font-size: 11.5px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.cc-monitorSessionCounts { color: var(--cc-ink-2); font-size: 11.5px; font-variant-numeric: tabular-nums; }
.cc-monitorHistoryMessage { white-space: pre-wrap; }
.cc-monitorFilters .cc-select { flex: 0 1 230px; min-inline-size: 0; }
.cc-monitorEvidence,
.cc-desktopPending { border-block-start: 1px solid var(--cc-line); padding-block-start: 4px; }
.cc-monitorEvidence > summary,
.cc-desktopPending > summary { padding-block: 4px; cursor: pointer; color: var(--cc-ink-2); }
.cc-monitorEvidence > ul { padding-inline-start: 18px; }
.cc-monitorBoundGrid {
  display: grid;
  gap: 8px 12px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 146px), 1fr));
}
.cc-monitorEngine { max-inline-size: 360px; }
.cc-monitorPath { overflow-wrap: anywhere; }
.cc-monitorPath code { font-family: var(--cc-mono); }
.cc-supervisionPage .cc-actions { gap: 6px; }
.cc-supervisionPage :is(.cc-select, .cc-input) { padding: 6px 8px; }
.cc-supervisionPage .cc-btn.link { min-block-size: 26px; padding-block: 2px; }
.cc-modeTabs button:focus-visible,
.cc-supervisionPage summary:focus-visible { outline: 2px solid var(--cc-accent-strong); outline-offset: 2px; }

/* ---------- scrollbars ---------- */

.cc-panel,
.cc-modal {
  scrollbar-width: thin;
  scrollbar-color: var(--cc-line-strong) transparent;
}
.cc-panel::-webkit-scrollbar,
.cc-modal::-webkit-scrollbar { inline-size: 10px; block-size: 10px; }
.cc-panel::-webkit-scrollbar-thumb,
.cc-modal::-webkit-scrollbar-thumb {
  border: 3px solid transparent;
  border-radius: 999px;
  background: var(--cc-line-strong);
  background-clip: content-box;
}

/* ---------- responsive ---------- */

@container (max-width: 760px) {
  .cc-grid { grid-template-columns: 1fr; }
  .cc-claudeStatusHead { align-items: flex-start; }
  .cc-claudeStatusHead .cc-cardTitle { flex: 1 1 100%; margin-inline-end: 0; }
  .cc-claudeStatusHead .cc-statusPill { min-inline-size: 0; max-inline-size: 100%; white-space: normal; overflow-wrap: anywhere; }
  .cc-claudeStatusHead .cc-btn { flex: 0 0 auto; }
  .cc-heroText { flex-basis: min(100%, 300px); }
  .cc-chips {
    inline-size: 100%;
    min-inline-size: 0;
    justify-content: flex-start;
    margin-inline-start: 0;
    max-inline-size: 100%;
  }
  .cc-chip { max-inline-size: 100%; }
  .cc-modeTabs { flex-wrap: wrap; border-radius: var(--cc-r-md); }
  .cc-modeTabs button { flex: 1 1 auto; }
  .cc-seg { grid-template-columns: 1fr; }
}
/* A container query cannot style the container itself, so the panel's own
   padding is viewport-driven; the descendants stay width-driven. */
@container (max-width: 520px) {
  .cc-heading { font-size: 22px; }
  .cc-card { padding: 15px 16px; }
}
@media (max-width: 520px) {
  .cc-panel { padding: 18px 14px 56px; }
}
@media (max-width: 900px) {
  .cc-grid { grid-template-columns: 1fr; }
}
`

    return {
      inject: ['slots', 'locale', 'sessions', 'uiWorkspace'],
      apply,
    }
  },
})
