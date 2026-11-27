# Claude 全局监工

本次改动把「项目持续推进」和可选的「验收报告」分开。旧验收的自动触发、回合后询问、手动入口默认关闭；保留设置中的手动启用方式。旧版没有 `workflowVersion: 2` 的设置会在读取时迁移为关闭，已有日预算保留。新版显式保存的可选验收设置仍会保留；全局监工启用时不会再运行旧的回合后自动验收。

## 触发与结果

监工在 Host 中运行，关闭插件面板不影响监听。它全局订阅 `agent/status`、`agent/error`、`agent/disposed`、`api-session/status`、`api-session/error`、`api-session/added`、`api-session/removed`、`session/disposed` 和 `session/event`。主会话的运行、失败、Agent 可用性变化和终止事件都会进入状态机；会话尚未退出 busy 状态时，终止检查会用退避重试等待状态同步，而不丢弃触发。子智能体、插件为首问新建的内部规划会话和已归档会话不参与项目目标监工。

每次检查包含：原始目标、用户后续明确要求、原生目标状态、最近对话、真实的结束原因、最近工具调用与输出、Git 改动。监工的消息不会变成新的项目目标。上下文是有界摘录，不能据此声称已经完整检查整个仓库；需要更多信息时应等待或让 DSH 补充证据。

| 结果 | 行为 |
| --- | --- |
| 意外中断，目标未完成，需要继续 | Claude 返回 `continue` 后，给原会话发送下一步要求；没有具体下一步时发送「继续」。 |
| 存在暂停/未激活的原生计划目标 | 优先按目标的精确 id、revision 调用 `goals.resume`，交回原生目标驱动器；不再额外发送一条「继续」。不增加原生目标的轮次上限。 |
| 原生目标已经 active、armed | 不重复注入消息，让已有驱动器继续。 |
| DSH 自称完成，尚无足够信息 | Claude 可以返回 `wait`；不因为 turn/end 自动追加「继续」。 |
| Claude 发现有证据支持的遗漏 | 返回 `continue` 并具体指出遗漏，继续原始目标。 |
| 原始目标已达成 | 仅接受 `goalSatisfied: true` 且有证据的 `complete`，完成对应原生目标、发一次「验收合格」通知，然后停止该会话后续监工。通知明确这是 AI 进度判断，不代替人工验收。 |
| 用户明确要求不要继续/暂停监工 | 暂停，不用自动恢复覆盖该指令。 |
| 需要用户决定、外部依赖不可用 | `wait`，面板显示依据，不反复给 DSH 发消息。 |

`wait` 是本轮不干预，后续新的工作轮次结束仍可检查。`complete`、手动暂停、动作结果不确定和达到上限会停止自动动作；可以在监工面板中显式恢复。

## 两类 Claude 接入

### CLI / SDK：全自动

选择「CLI / SDK · 全自动」。使用插件原有的 `engine: auto|cli|sdk` 和认证设置，以只读规划模式调用 Claude。监工每次都是独立查询，不把检查回合混入首问的 resume 会话。费用计入原有 Claude 日预算。

Claude 返回结构化决策：

```json
{
  "decision": "continue",
  "reason": "登录功能已实现，手机端布局仍缺少验证证据",
  "message": "继续验证手机端布局，修复发现的问题，再反馈具体结果。",
  "evidence": ["会话中的工具输出和具体文件位置"],
  "goalSatisfied": false
}
```

### 桌面版：MCP 工具连接

1. 在 **Claude 全局监工 → 监工设置** 里点「配置 MCP 连接」。插件显示实际使用的配置路径，保留其他服务器的配置，并在修改已有文件前备份。
2. 在 Claude Desktop 重载连接，或正常退出再打开；回到面板点「检测连接」。打开应用只会显示「应用已运行 · MCP 未连接」；收到 MCP 初始化确认和有效心跳才显示「MCP 已连接」。如果依然未连接，请在 Claude Desktop 的 **Settings → Developer → Edit Config** 核对路径。Windows 商店版使用包的 `LocalCache/Roaming/Claude`，普通安装使用 `%APPDATA%/Claude`；自定义路径可以用插件行的 `desktopConfigPath` 覆盖。
3. 将监工引擎设为 **Claude Desktop · MCP / 手动回填**，保存。在 Claude Desktop 对话里，请 Claude 用 `claude-on-dsh-supervisor` 读取并处理待审任务。可以提供概览中该任务的 ID。回复先排队，Host 复核会话、轮次及目标版本后才处理；查询状态或监工记录可确认结果。

连接使用本机 [MCP stdio](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)，不额外开放网络端口。工具可见的是待审任务及它们的项目上下文，不开放任意文件读取或命令执行。配置前应确认允许 Claude Desktop 使用这些上下文。连接成功并不代表可自动发起桌面对话：**桌面端仍需由你在对话中发起检查**。无人值守请选择 CLI / SDK。

没有 MCP 时仍可在概览展开「桌面待审任务」，复制提示词到 Claude Desktop，再粘贴 JSON 回填。无有效回复不会续跑，也不会静默改用 CLI。旧任务在会话、用户要求或目标变动后不会执行；同一回复不能触发两次续跑。

## Claude 状态与个人任务模式

主页的「Claude 状态」卡片只报告本插件可以确认的事实：当前项目有没有插件任务正在运行、将使用 CLI 还是 Agent SDK、当前项目映射的 session 短 id、最近用途和当前任务模式。没有正在运行的插件 job 时显示空闲；这不代表用户在其他终端手工启动的 Claude 进程状态，插件不会伪造外部进程的实时状态。「刷新状态」会同时重读引擎检测、项目 session 映射、任务列表和任务模式，并给出完成反馈。

任务列表只为状态卡返回 `projectDir` 和 `title`，不会把完整提示词或模型结果放进列表响应。最近任务失败或中断会短暂显示为警告状态；旧任务不会永久占据当前状态。监工记录页的「刷新记录」会保留当前筛选条件重新拉取，并显示已刷新反馈。

个人模式有三种：

| 模式 | 作用 |
| --- | --- |
| 规划 | 关闭自动监工，适合理解需求、首问和定稿。 |
| 执行 | 开启有边界的全局监工，默认冷却、重试、无进展和轮数上限更适合持续执行。 |
| 审查 | 停止自动续跑，保留手动验收入口。 |

模式保存在 `$DSH_HOME/claude-on-dsh/settings.json`，只作用于本机，不引入 relay、远程调用方或多人权限系统。

项目的普通规划/定稿/验收调用按项目目录复用 Claude Code session。点击当前 session 的「Fork」后，插件只记录 `forkPending`，下一次 CLI 调用使用 `--resume` + `--fork-session`，SDK 调用使用 `resume` + `forkSession`；成功后保存新的 session id，原 session 不被写入。监工始终使用独立的只读查询，不会 Fork 或污染规划 session。


主页工具栏只显示监工入口和累计执行数。独立工作区的「概览」有累计执行、有效判断、续跑、达标、失败和桌面待审，并可按会话暂停、恢复、查看记录。「监工记录」支持按会话和结果筛选，记录依据、证据、错误与动作结果。「监工设置」可一次保存引擎、续跑间隔、重试和上限，也可保留原来的预算和可选验收设置。

CLI / SDK 的每次检查尝试（含重试）单独计数；Desktop 只准备任务不计为执行，收到有效判断才计。实际恢复原生目标或成功发出续跑才计「已续跑」，已运行的目标不重复计数。状态未知的发送不计成功，需人工核对。恢复监工只重置运行上限相关的周期计数，不清空累计统计。旧版只保存的判断次数单列，不补造执行记录。

## 睡眠托管（无人值守）

在「监工设置」打开 `sleepMode` 后，插件进入明确的睡眠托管模式：

- 强制使用本机 CLI 监工，不使用需要人工回填的 Desktop 引擎；
- 强制开启全局监工，并在启用时立即检查已绑定的未结束会话；
- 关闭自动验收询问，避免夜间等待用户选择；
- 要求每日预算 `dailyBudgetUsd > 0`，预算达到后暂停，不会无限调用；
- 仍受 `maxRetries`、`maxNoProgress`、`maxRounds` 约束，任一上限触发后转为暂停/需要核对；
- Host 重启后依据持久化状态恢复检查，但发送中的不确定动作不会自动重放。

睡眠托管不是「无限自动运行」：Claude 仍然只能根据项目证据判断继续、等待或完成；不确定、需要用户决定、会话断开或达到安全边界时会停下并记录原因。

配置示例：

```yaml
supervision:
  enabled: true
  sleepMode: true
  engine: cli
```

面板开启方式会同步保存到 `$DSH_HOME/claude-on-dsh/settings.json`。

## 防止重复、费用循环与意外重放

- 同一终止轮次只处理一次；idle、disposed 和 turn/end 同时到达也会合并。
- 发送前重新读取会话和目标，避免检查期间出现的新要求被旧判断覆盖。
- 自动动作先持久化，再提交给宿主；requestId 由会话、轮次和动作稳定生成。
- 如果 Host 在发送期间退出，恢复后标记「需要核对」，不会猜测是否已发送并再次提交。
- 已经持久化的检查/活跃轮次可在 Host 恢复后继续检查；首次安装不会扫描历史会话并启动它们。
- 关闭全局监工或暂停当前会话会取消在途 Claude 查询，并阻止之后的自动动作。
- 默认续跑间隔 30 秒。限流/配额类中断按更长间隔退避；Claude 调用失败也退避重试，不把错误伪装成「继续」。
- 默认最多重试 3 次、连续无项目进展 3 轮暂停、每会话自动续跑最多 50 次。日预算达到上限同样暂停。需要时可在面板明确恢复，开始新的计数周期。
- 状态文件使用串行临时文件加重命名写入，保存前屏蔽 token 形状文本。可识别的密钥会脱敏，但仍应把整个 DSH_HOME 视为包含私有项目内容的数据目录。

## 配置与数据

```yaml
supervision:
  enabled: true
  sleepMode: false
  engine: cli       # cli | desktop
  cooldownMs: 30000
  retryBaseMs: 60000
  maxRetries: 3
  maxNoProgress: 3
  maxRounds: 50
```

- 监工启用、睡眠托管、引擎和设置由 `/settings` 保存到 `$DSH_HOME/claude-on-dsh/settings.json`。
- 会话状态、待审任务、累计统计和最近 1,000 条已结束记录保存在 `$DSH_HOME/claude-on-dsh/supervision.json`；保留尚未结束的任务。桥接状态和回执位于同目录下的 `desktop-bridge`。
- `GET /supervision`：当前监工状态和统计。
- `GET /supervision/history`：可选 `sessionId`、`status`、`limit`；用 `nextCursor` 作为下一页的 `before`。
- `POST /supervision`：`{ sessionId, action: 'pause'|'resume' }`；`action: 'adopt'` 用于接管任意已有会话（可附带 `objective`、`engine`，省略时目标取自会话首条用户消息）。

## 接管任意会话

监工的行通常由被动信号创建，因此本插件没有派发过的会话此前无法纳入监工——包括在 DSH 界面里直接新建、从未经过首问的对话。

面板「监工 → 接管会话」提供显式入口：

- 列出当前 Host 的全部主会话（已合并 fork 链，子智能体不参与）；
- 选择任意一条点「开始监工」，插件用 `readSession` 读取该会话，目标取首条真实用户消息，工作目录取会话 header 的 `cwd`；
- 该行立即进入 `watching` 并安排一次检查，不必等下一次 `turn/end`；
- 已结束（`complete`）或已被排除（`excluded`）的行会被重新激活，并清空 `lastTurnKey`，让当前轮次可以重新判定；仍在运行的行保留 `lastTurnKey`，避免同一轮重复发送；
- 会话读不到时返回 404，没有目标也没有工作目录时返回 400，不会凭空造一个监工行。

`GET /sessions` 的每一项带 `monitored` 字段，面板据此把已接管的会话显示为「已在监工」并禁用按钮。
- `GET /supervision/desktop/status`：检测应用、配置与 MCP 握手。`POST` 的 `configure` 操作只写用户确认过的桌面配置。
- `POST /supervision/desktop`：打开待审任务或提交带 `requestId` 的决策。
- `GET/POST /task-modes`：读取或应用 `plan`、`execute`、`review` 个人模式。
- `GET /claude-sessions`：读取本插件维护的项目 Claude session 映射。
- `POST /claude-session/fork`：标记指定项目 session，下次 Claude 调用基于它 Fork；不会立即产生额外调用。
监工不会更改 DSH 的沙箱/审批设置，不会提高原生目标轮次上限，也不会自动启用 dsh-claude 或 dsh-claude-style。独立运行所需的只是 Claude CLI/SDK；桌面路径沿用本插件已有的桌面启动配置。

## 验证边界

自动测试以可控的宿主事件、模型返回和文件系统重启场景验证状态机，并通过 Host 路由测试验证设置迁移与决策提交。它们不代表已经在每种 Claude Desktop 版本中做了真实窗口自动化；本次没有把桌面待审回填描述成无人值守能力。
