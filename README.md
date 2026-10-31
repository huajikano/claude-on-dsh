# Claude on DSH

一个 DSH 侧栏插件：让**本机 Claude Code CLI** 或 **Claude 桌面版**负责新项目的首个提问与规划，然后把完整任务交接给 **DSH** 执行。

仓库：<https://github.com/huajikano/claude-on-dsh>

## 在 DSH 里直接安装（GitHub）

无需克隆、无需构建。DSH 的 **Plugins** 页面支持从 Git 安装 bundle：

1. 打开 DSH 侧栏 → **Plugins**。
2. 点 **Add plugin / 安装插件**，在来源/地址栏填入：

   ```text
   github:huajikano/claude-on-dsh
   ```

   固定版本（推荐）：

   ```text
   github:huajikano/claude-on-dsh#v1.3.0
   ```

   等价写法：

   ```text
   git+https://github.com/huajikano/claude-on-dsh.git
   ```

3. 安装完成后启用 **Claude on DSH** bundle；若提示重启，重启 DSH。
4. 刷新 Web 页面，左侧栏出现橙色星形图标。

要求：Windows；本机已安装 Claude Code CLI（或安装后在插件配置里填 `claudeCliPath`）；DSH 安装插件需要 Full access 或批准。仓库公开，无需 token。插件是纯 JavaScript bundle，没有构建步骤。

> 已实测：`pnpm add github:huajikano/claude-on-dsh` 可安装到 1.3.0。若安装停在 `spec-host`，检查本机 Git 能否访问 GitHub（代理/证书）。

## 更新已安装的版本（重要）

DSH 插件管理器在 HMR profile 下**不允许用同名包覆盖已安装的 bundle**；直接再次 Add 会提示 `already-installed`，这不是插件版本号没改，而是管理器没有原地升级路径。

更新到 1.3.0：

1. 打开 DSH → **Plugins**；
2. 找到 **Claude on DSH**，点 **Remove**（只点禁用不够，必须移除依赖）；
3. 重新 **Add plugin**，填入：
   ```text
   github:huajikano/claude-on-dsh#v1.3.0
   ```
4. 安装后启用，重启/刷新 DSH；
5. 如果 profile 里的配置被清除，按下面「配置」一节重新填 `claudeCliPath` 等值。

> 不要用不带 `#v1.3.0` 的 `github:huajikano/claude-on-dsh` 做更新：那会跟随默认分支，无法判断装的是哪一版。固定 tag 更可控。

## 工作流

1. **项目设定**：填写项目目录、项目名称和项目目标，选择指挥引擎。
2. **Claude 首问**：Claude Code CLI 以只读的 `plan` 模式分析目标，给出理解、一个决定方案走向的首问、候选答案和初步计划。
3. **交给 DSH**：你回答首问后，Claude 定稿执行计划、验收标准与一份自包含的任务书；点击「派发给 DSH 执行」后，插件会：
   - 为项目目录创建/复用 DSH 工作区；
   - 通过 DSH API Session Controller 新建会话；
   - 把任务书作为会话的第一条任务提交；
   - 自动把新会话权限切到 `danger-full-access`（完全权限：沙箱 danger-full-access + 审批 never）；
   - 在面板里给出「打开会话」入口。

之后的所有实现工作都在 DSH 会话中进行。任务书会附带「直接开始执行，只有阻塞项才追问」的指令；派发记录会显示会话的运行状态、相对时间与「当前会话」标记。

## 在已有对话中继续（首问）

历史记录里每条会话都有「**首问**」按钮：

1. 选择一个已经存在的 DSH 对话；
2. 填写这次的新要求；
3. Claude 读取该对话的历史、任务、改动文件和 git 状态；
4. Claude 生成一条带上下文的首问和候选答案，**显示在弹窗里，不会写入会话**；
5. 你回答后点「发送给 DSH」，才会把首问 + 你的回答 + 交接背景发回这个已有对话，不会新建会话；
6. 发送前可以在「**发送给 DSH 的内容（可编辑）**」里直接修改完整消息；修改回答会自动更新，手动改过后不再覆盖。

只有点「发送给 DSH」才会写入会话并消耗 DSH 额度；Claude 生成失败会直接报错，不会静默发送旧内容。

## 内容记录

面板右上角的「记录」会列出每次：

- Claude 生成的首问；
- 实际发送给 DSH 的首问内容；
- 派发任务书；
- 交给 DSH 的验收内容。

记录保存在 `$DSH_HOME/claude-on-dsh/records/`，列表只在弹窗里查看，不占主页空间。

同一项目下，首问、验收任务书、验收判定和后续提问会复用同一个 Claude Code CLI session（通过 `--resume`）。「记录」里可以展开「插件创建的 Claude 会话」，记录详情也带 session id；如果原项目目录被删除，会明确报错而不是静默新建会话。

每个 Claude 会话都可以在「记录」里单独删除：会同时删除插件的映射和对应的 Claude Code 会话文件。首问发送内容的顺序为：新要求 → 背景 → 首问 → 用户回答 → 执行指令。

## 会话状态与预算

顶部状态行显示当前项目的 Claude 会话：项目名 · 短 id · 最近用途，并可只清除映射（下次新建会话）。旁边显示今日 Claude CLI 费用/预算。预算默认 $5/天，0 表示不限；达到预算后只停止自动验收，手动验收仍可继续。

助手消息旁会出现 `PASS / FAIL / UNCERTAIN` 小 chip，点击查看完整意见与关键证据。回合后 Claude 意见和「Claude 直接验收」报告都会生成 chip。

## DSH 完成后的验收

「交给 DSH 验收」也分成两步：Claude 先生成验收任务书，弹窗里可以编辑完整发送内容；确认后才发回原 DSH 会话。

插件面板有「DSH 完成后的验收」设置：

- **自动出现验收选项**：开关；关闭后 DSH 每轮结束不会出现验收卡片。
- **默认项**：
  - `不设默认`：在 **DSH 原会话**里弹出三选一：`Claude 验收意见 / 自定义内容 / 跳过`；
  - `自动交给 Claude 验收`：不询问，直接让 Claude 阅读项目与测试记录，生成意见发回 DSH。

选择「自定义内容」时，你输入的验收要求会交给 Claude，Claude 结合项目、改动、测试命令与输出生成意见，再把「结论 + 意见 + 关键证据」发回原 DSH 会话。选择「跳过」不调用 Claude。

## 本机集成

| 组件 | 位置 | 说明 |
|---|---|---|
| Claude Code CLI | `%APPDATA%\npm\node_modules\@anthropic-ai\claude-code\bin\claude.exe`（自动探测） | 以 `-p --output-format json --json-schema` 运行，提示词走 stdin，避免命令行长度与转义问题 |
| Claude 桌面版 | `C:\Program Files\WindowsApps\Claude_3.6556.2.0_x64__pzs8sxrjxfjjc\app\claude.exe`（自动探测） | 桌面版没有可编程接口，因此作为「人工接管」通道：生成简报、复制到剪贴板、拉起桌面版，再把 Claude 的回复粘回面板 |
| CC Switch | `D:\CC Switch\cc-switch.exe`（自动探测） | CLI 与桌面版的实际 API key 由 CC Switch 的本地代理提供；面板会显示代理是否可达，并可一键拉起 CC Switch |

> 桌面版通过 CC Switch 使用其配置的 API key；插件自身不读取、不保存任何密钥，只把 `~/.claude/settings.json` 里的 `ANTHROPIC_BASE_URL` 当作代理健康检查目标。

## 本地开发 / 离线安装

作为本地 bundle 链接到 DSH profile（改代码即时生效，适合开发）：

1. 克隆本仓库到任意目录；
2. 在 DSH 的 Plugins 页面从本地目录安装，或用插件管理器的 `install_bundle` 指向仓库根目录；
3. 刷新一次 Web 页面，左侧栏出现橙色星形图标。

## 配置

在 `cordis.patch.yml` 的本插件行里覆盖任意字段（全部有默认值）：

```yaml
- id: claude-on-dsh
  config:
    claudeCliPath: ''          # 原生 claude.exe；空则自动探测
    desktopAppPath: ''         # 桌面版 claude.exe；空则自动探测 WindowsApps
    ccSwitchPath: 'D:\CC Switch\cc-switch.exe'
    permissionMode: plan       # plan | dontAsk | acceptEdits | bypassPermissions | auto
    permissionPreset: danger-full-access  # 新会话权限预设；完全权限
    model: ''                  # 传给 CLI 的 --model；空则沿用 Claude 原生设置
    timeoutMs: 240000          # 单次 Claude 调用超时
```

## 安全边界

- 规划阶段默认使用 `plan`（只读）权限模式；插件不会让 Claude 修改项目文件。
- 派发使用 DSH 的 API Session Controller，任务书进入正常会话日志，可审计、可中断。
- `bypassPermissions` 仅在你自己显式配置时生效，面板不提供该选项；浏览器请求的权限模式被限制在 `plan` / `dontAsk` / `acceptEdits`。
- 插件不读取、不写入任何 API key；认证由 Claude Code / CC Switch 的原生配置负责。

## 两种使用方式

1. **派发给 DSH**：Claude 提问 → 你回答 → DSH 执行整案。这个入口**不会**打开 Claude 终端。
2. **Claude 直接验收**：在派发记录或派发成功卡片里点「交给 DSH 验收」，在对话框选择「Claude 直接验收」，插件会按该会话的原始事实生成报告；也可以运行 `node bin/acceptance.mjs run <sessionId>` 在终端查看完整过程。

自动验收默认 **off**；只有同时设置 `acceptance.legacyGate: true` 与 `gatePolicy: ask|auto`，才会在 DSH turn 结束后跑隐藏验收。手动入口 `/acceptance run <sessionId>` 与 `node bin/acceptance.mjs` 在 lean 模式下始终可用。

## 自动验收（Acceptance Gate，1.0.1+）

派发的会话结束后，插件会自动按会话原始事实生成验收报告，而不是采信 DSH 的自我汇报。

### 触发（`legacyGate: true` 时）

- 插件在 dispatch 时 `arm` 会话；
- 监听 `agent/status` 的 `running → idle`（延迟 150ms 落盘）触发一次；
- 若会话在 idle 前被 dispose，用 `agent/disposed` 兜底；
- DSH 没有 `session/ended` 事件，探测结论见 [acceptance-probe.md](docs/acceptance-probe.md)。

### 策略

| `gatePolicy` | 行为（仅在 `legacyGate: true` 时生效） |
|---|---|
| `off` | 不调用 Claude，不落盘 |
| `ask` | 在会话内向用户询问「验收 / 跳过」；拒绝或超时无报告，不影响会话结束 |
| `auto` | 直接验收 |

### 报告

写入 `<workspace>/.dsh/acceptance/<sessionId>.json` 与同名的 `.md`。JSON 契约见
[report-schema.json](lib/acceptance/report-schema.json)，
真实样本见 [acceptance-sample.md](docs/acceptance-sample.md) 与
[acceptance-sample.json](docs/acceptance-sample.json)。

验收通过派发记录或派发成功卡片里的「交给 DSH 验收」对话框发起：可以选「Claude 直接验收」生成报告，或把验收任务发回原 DSH 会话。
报告包含总结论、三项检查、可定位证据、缺失判据、返工建议与报告路径。

每条 `pass`/`fail` 检查项必须绑定至少一条可定位证据（`path` + 行号区间或 `locator` + 原文片段）；
证据为空只能是 `uncertain`，校验器会拒绝「pass/fail 但证据为空」的报告。只要存在缺失判据或任一 `uncertain`
检查项，总结论会被强制降级为 **uncertain**，不会因为三项机器检查通过就判 pass。报告状态为
`completed` / `timeout` / `error`，判定器状态为 `completed` / `degraded` / `timeout` / `error` / `skipped`。

### 手动入口

- DSH 会话内：`/acceptance run <sessionId>`
- 终端：`node bin/acceptance.mjs run <sessionId> [--no-judge] [--allow <glob>] [--dir <dir>]`

两个入口与自动钩子共用 `lib/acceptance/kernel.js`，检查器与判定器完全一致。

### 配置

```yaml
- id: claude-on-dsh
  config:
    acceptance:
      legacyGate: false        # true 才启用 turn 结束后的自动验收
      gatePolicy: off          # off | ask | auto（仅 legacyGate: true 时生效）
      timeoutMs: 180000        # 单次验收总预算
      askTimeoutMs: 120000     # ask 等待用户回答的上限
      judgeTimeoutMs: 180000   # Claude 判定上限
      judgeRetries: 2          # schema 校验失败重试次数
      reportDir: .dsh/acceptance
      allowedPaths: []         # 空 = 工作区内全部允许；写 workspace 外交付物时加白名单
```

### 临时关闭与排障

- 关闭：`acceptance.gatePolicy: off`。
- 没有报告：off / ask 被拒绝 / 会话 header 没有 `cwd` / 没有观察到 running→idle。
- `judge=degraded`：Claude CLI 或模型不可用；报告整体降级为 `uncertain`，不伪造 pass。
- `scope: fail`：改动落在工作区外；把交付目录加入 `allowedPaths`，或把交付物迁入工作区。
- 报告目录建议加入项目 `.gitignore`：`.dsh/acceptance/`。

## 开发与验证

- Host 半：Node ESM，无第三方依赖；`/api/claude-on-dsh/*` 路由负责探测、运行 CLI、派发、历史与桌面启动。
- Client 半：`window.__ModuleLoader__` 工厂，注册 `sidebar.panellist` 图标与 `main` 面板。
- 验收内核：`lib/acceptance/`，`npm test` 运行 41 个 node:test 用例（契约、取证、检查器、判定、报告、三态策略、路由、客户端渲染与超时、权限边界、dispatch 回归）。
- 已实测：Claude CLI 探测（2.1.295）、真实首问与定稿两次结构化调用、Host 路由离线 harness、DSH 侧栏与主面板注册。
- 未实测：浏览器内的面板视觉渲染与「点击派发」全链路（开发会话没有浏览器控制能力）；首次使用请刷新一次页面。

## 卸载

在 DSH 的 Plugins 页面关闭并移除本 bundle，或从 profile 的 `package.json` / `cordis.patch.yml` 中删除对应项。
