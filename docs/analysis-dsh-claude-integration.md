# dsh-claude 怎么融进 claude-on-dsh：三种缝，只有两种该用

对象：[Norman-else/dsh-claude](https://github.com/Norman-else/dsh-claude)（本机已装 `@norman-else/dsh-claude@0.1.67`）。
目标：让 claude-on-dsh 的首问/定稿/验收用上 Claude，同时别把两个插件的边界搅烂。

---

## 一、先看清它是什么

它不是一个"调用 Claude 的工具"，它是 **DSH 的一个 LLM Provider**：

| 证据 | 说明 |
|---|---|
| `src/adapter.ts:244` `export class ClaudeCodeAdapter extends LlmAdapter` | 它实现的是宿主的 LLM 适配器基类，不是给自己用的封装 |
| `src/preset-route.ts` 钩 `agent/request` | 把请求的 `provider` 改写成 `CLAUDE_CODE_PROVIDER`、`model` 改写成目录里的规范 id |
| `cordis.patch.yml` 注册 `id: claude` 的 `@deepseek-ai/dsh-agent-preset` | 于是"选 Claude 预设"= 这个会话的模型请求改走它的适配器 |
| `src/supervisor.ts`（100 KB） | 一进程/会话、轮次串行、空闲驱逐、FIFO 排队、Stop/取消/重启、进程树清理 |
| `src/sdk-messages.ts` | Agent SDK 消息 ↔ DSH 事件的双向翻译 |

**关键结论**：会话里跑的是 **DSH 自己的 agent loop**，只是模型请求被它的适配器接走，再由适配器驱动本机 Claude Code。Claude Code 拥有内层 loop 与工具；它拥有呈现、审批面、进程生命周期。

### 它对外只开三扇门

1. **preset id `claude`**（公开、稳定）——建会话时选它就行。
2. **`claudeSteering` 服务**（`src/steering.ts`）——把消息插进正在跑的那一轮。
3. **`claudeCommands` 服务**（`command-bridge.ts`）——按 agent 读命令目录。

`supervisor` / `adapter` / 各 private 路由 **都不是导出面**。它的 `CONTRIBUTING.md` 也写死了：只用公开的 DSH 导出，不许碰内部。

---

## 二、三种可以"融"的缝

| 层 | 做法 | 耦合度 | 建议 |
|---|---|---|---|
| **L0 协议层** | 自己用 `@anthropic-ai/claude-agent-sdk` 的 `query()` 跑一次性回合（`outputFormat: json_schema`） | 零 | ✅ 已做，规划/验收就该是"一次性、不进会话" |
| **L1 预设层** | 派发的新会话建在 `claude` 预设上，执行者就是 Claude Code 本体 | 只依赖公开的 preset id | ✅ 最划算，已做 + 本轮补权限让位 |
| **L2 会话层** | 首问本身也进会话：建 `claude` 会话 → 用 Session Controller 发首问 → 读回复渲染到面板 | 依赖 `sessionController`（已是我们的硬依赖） | ⚠️ 可选，代价是消耗真实会话 |
| **L3 内部层** | 直接 `import` 它的 supervisor/adapter 来跑回合 | 高 | ❌ 不做 |

**为什么 L3 是错的**：它没有导出这些模块；它的进程池语义（一会话一进程、空闲驱逐）是按"会话"设计的，拿去跑一次性规划会把进程生命周期搅乱；它每次改动都可能换内部形状（README 里明确说过 "Host ships no type declarations, so `pnpm typecheck` cannot see its API drift"）。我们真正需要的只是"让 Claude 干活"，L1 已经给了。

---

## 三、已经落地的部分（截至 2.3.0）

| 能力 | 位置 | 说明 |
|---|---|---|
| SDK 引擎 | `lib/engine/sdk.js` + `index.js` `runClaudeFor` | `engine: auto` 优先 SDK，解析不到退 CLI；schema 走 `outputFormat`，结果取 `structured_output` |
| 只读锁 | `planningDenyTools` | 规划期默认禁 `Write/Edit/MultiEdit/NotebookEdit/Bash/BashOutput/KillShell` |
| 引擎可见 | `/detect` 的 `agentEngine` | 面板 chip 显示 `Agent SDK` / `CLI 引擎`，悬停看路径 |
| 派发到 Claude | `dispatchAgentPreset: claude` | 新会话跑 Claude Code |
| 预设清单鲁棒 | `normalizePresetRows` + 多服务名探测 | 宿主换一种注册形状也不会让下拉消失 |
| **权限让位** | `shouldPinPermission`（本轮新增） | 目标是 Claude 预设时不再强塞 `danger-full-access` |
| 验收 provider 无关 | `lib/acceptance/*` 读 DSH 会话日志 | Claude 会话的改动/命令同样能被验收取到，无需改 |

### 本轮修的冲突（重要）

我们派发时原本无条件 `ctx.permissionPresets.set(live, 'danger-full-access')`。而 dsh-claude 的权限模型是：**每个 Claude 会话有自己的权限模式**，它把 DSH 的沙箱挪到那个模式需要的预设上，并且"之后用 `/permission` 原生切换会覆盖它的记录"。

两者直接对撞：用户在 Claude 会话里选了 Plan，我们派发时又一巴掌拍成 full access。

现在的规则（`shouldPinPermission`）：

| `dispatchPermissionPreset` | 目标预设 | 行为 |
|---|---|---|
| `auto`（默认） | 在 `claudePresetIds`（默认 `['claude']`）里 | **不抢**，沿用会话自己的权限 |
| `auto` | 其它预设 | 照旧钉 `danger-full-access` |
| `''` | 任意 | 完全不动，用 DSH 默认 |
| 具体预设名 | 任意 | 照旧钉（运维显式要求） |

派发记录里多一个 `permissionPinned` 字段，事后能查这次到底谁说了算。

---

## 四、还剩的冲突点（真跑起来会遇到的）

| 冲突 | 现状 | 处理建议 |
|---|---|---|
| **进程数** | 我们一次性调用会起一个 Claude；它的会话常驻一个 | 一次性调用结束即退，正常；`auto` 下规划走 SDK 也只在规划那几十秒存在 |
| **费用记账** | 它有回合结算 footer；我们有每日预算台账（`usage.json`） | 两边各记各的，**不合并**（口径不同：它记会话，我们记任务）。文档里写清，别让人以为漏算 |
| **模型选择** | 它按 Claude 目录 canonical id；我们透传 `model` 给 SDK | 规划用我们的 `model`，执行用会话自己的选择——两者互不影响，但同一项目可能用不同模型，属预期 |
| **计划审阅** | 它在只读访问时给右栏计划面板 | 与我们无关；我们的"首问"是弹窗，不是 plan 模式产物 |
| **首问文案** | 我们的提示词库要求输出 JSON | 若改走 L2（会话内首问），就没有 JSON schema 约束了，得改成"读会话最后一轮文本" |

---

## 五、推荐路线

### 现在这样就是"最好"的形态（L0 + L1）

分工一句话：**claude-on-dsh 管流程（首问→交接→验收），dsh-claude 管执行（Claude Code 本体）。**

- 规划：一次性 SDK 回合，不污染任何会话，几十秒结束，JSON 结构可校验。
- 执行：派发到 `claude` 预设，Claude Code 全功能（Skills/Hooks/MCP/子代理/工具）。
- 验收：读会话日志 + 证据绑定，provider 无关。

### 可选升级：L2「首问进会话」（已实现，默认关）

只有当用户明确要"首问也发生在 Claude 会话里、看得见"时才值得开。做法与落地位置：

1. 配置 `firstQuestionInSession: true`，或面板上勾「首问进会话」（这次可以先开着跑一遍）。
2. `index.js` 的 `runFirstQuestionInSession` 走完整流程：`workspaceRegistry.create` → `sessionController.create({ agentPreset })` → 用 `sessionController.prompt` 发首问 → `waitForTurn`（复用 acceptance 的 running→idle 边沿检测，含 300ms 落盘延迟）→ `readSession` → `lastAssistantText`。
3. `lib/first-question-session.js` 负责三件纯事：
   - `buildSessionPrompt`：因为会话里没有 `outputFormat`，改用**固定四段 Markdown**（理解 / 首问 / 候选答案 / 交接书）约束输出，并在指令里写死"不要输出 JSON"。
   - `parseSessionAnswer`：按标题切段；模型没按格式时退化成"找第一个带问号的句子"，并返回 `complete: false`，**绝不编造问题**。
   - `lastAssistantText`：直接读最后一条 `assistant/message`，不走 `extractAssistantFinal`（那个会裁到 2000 字，交接书会被截断）。
4. 结果字段与一次性路径完全一致（`understanding` / `firstQuestion` / `questionOptions` / `handoffDraft`），所以面板渲染两套模式共用一份代码。
5. 作业类型 `brief-session`，继承 `brief` 的轮询、取消、错误卡片。

代价：一次首问就消耗一个真实会话与一轮 Claude 调用。收益：首问、回答、执行、验收全在同一条时间线里。

---

## 六、配置现状（`cordis.patch.yml`）

```yaml
- id: claude-on-dsh
  config:
    engine: auto                  # auto | cli | sdk
    sdkPath: ''                   # 空 = 搜 $DSH_HOME/profiles/*/node_modules
    planningDenyTools: null       # 空 = 默认只读锁
    dispatchAgentPreset: claude   # 派发到 Claude Code；'' = DSH 默认
    dispatchPermissionPreset: auto# 目标预设自己管权限时让位
    claudePresetIds: ['claude']   # 哪些预设算"自己管权限"
```

---

## 七、验收清单（改完自己跑）

```bash
cd D:\XiangMu\claude-on-dsh-2.1.4
node --check index.js && node --check client.js
node --test --test-reporter tap "test/acceptance/*.test.js"   # 134 用例
node tools/check-panel-coverage.mjs                            # 面板样式 124/124
```

界面上核对三件事：

1. 面板 chip 显示 `Agent SDK`（绿）。
2. 「DSH 新会话模式」下拉里有 `Claude`，且默认选中。
3. 派发后在记录里能看到 `permissionPinned: false`（走 Claude 预设时），会话里 Claude 的权限模式没被改掉。

---

## 八、明确不做的事

- 不 `import` dsh-claude 的任何内部模块（`supervisor` / `adapter` / private 路由）。
- 不复制它的进程池逻辑：一会话一进程的语义不属于一个"派发器"。
- 不接管它的权限选择器，也不去 hide 它——两边各管各的会话。
- 不在它升级时追内部 API；只追 preset id 与 `sessionController` 这两个公开面。
