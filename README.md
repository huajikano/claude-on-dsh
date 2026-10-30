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
   github:huajikano/claude-on-dsh#v1.2.0
   ```

   等价写法：

   ```text
   git+https://github.com/huajikano/claude-on-dsh.git
   ```

3. 安装完成后启用 **Claude on DSH** bundle；若提示重启，重启 DSH。
4. 刷新 Web 页面，左侧栏出现橙色星形图标。

要求：Windows；本机已安装 Claude Code CLI（或安装后在插件配置里填 `claudeCliPath`）；DSH 安装插件需要 Full access 或批准。仓库公开，无需 token。插件是纯 JavaScript bundle，没有构建步骤。

> 已实测：`pnpm add github:huajikano/claude-on-dsh` 可安装到 1.2.0。若安装停在 `spec-host`，检查本机 Git 能否访问 GitHub（代理/证书）。

## 工作流

1. **项目设定**：填写项目目录、项目名称和项目目标，选择指挥引擎。
2. **Claude 首问**：Claude Code CLI 以只读的 `plan` 模式分析目标，给出理解、一个决定方案走向的首问、候选答案和初步计划。
3. **交给 DSH**：你回答首问后，Claude 定稿执行计划、验收标准与一份自包含的任务书；点击「派发给 DSH 执行」后，插件会：
   - 为项目目录创建/复用 DSH 工作区；
   - 通过 DSH API Session Controller 新建会话；
   - 把任务书作为会话的第一条任务提交；
   - 自动把新会话权限切到 `danger-full-access`（完全权限：沙箱 danger-full-access + 审批 never）；
   - 在面板里给出「打开会话」入口。

之后的所有实现工作都在 DSH 会话中进行。

## 在已有对话中继续（首问）

历史记录里每条会话都有「**首问**」按钮：

1. 选择一个已经存在的 DSH 对话；
2. 填写这次的新要求；
3. Claude 读取该对话的历史、任务、改动文件和 git 状态；
4. Claude 生成一条带上下文的首问，**直接发回这个已有对话**，不会新建会话。

只有点「发送首问」才会消耗额度；Claude 无法调用时会退化为把你的新要求作为首问发回。

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
- `bypassPermissions` 仅在你自己显式配置时生效，面板不提供该选项。
- 插件不读取、不写入任何 API key；认证由 Claude Code / CC Switch 的原生配置负责。

## 两种使用方式

1. **派发给 DSH**：Claude 提问 → 你回答 → DSH 执行整案。这个入口**不会**打开 Claude 终端。
2. **Claude 直接验收**：在面板「Claude 直接验收（终端可见）」卡片里选项目目录，点击后打开一个真实的 Claude Code 终端，由 Claude 检查改动、运行测试、把报告写到 `.dsh/acceptance/visible-*.md`。整个过程在终端里可见，不经过 DSH 的隐藏验收。

自动验收默认 **off**；只有显式把 `acceptance.gatePolicy` 设为 `ask`/`auto` 才会在 DSH turn 结束后跑隐藏验收。

## 自动验收（Acceptance Gate，1.0.1+）

派发的会话结束后，插件会自动按会话原始事实生成验收报告，而不是采信 DSH 的自我汇报。

### 触发

- 插件在 dispatch 时 `arm` 会话；
- 监听 `agent/status` 的 `running → idle`（延迟 150ms 落盘）触发一次；
- 若会话在 idle 前被 dispose，用 `agent/disposed` 兜底；
- DSH 没有 `session/ended` 事件，探测结论见 [acceptance-probe.md](docs/acceptance-probe.md)。

### 策略

| `gatePolicy` | 行为 |
|---|---|
| `off` | 不调用 Claude，不落盘 |
| `ask`（默认） | 在会话内向用户询问「验收 / 跳过」；拒绝或超时无报告，不影响会话结束 |
| `auto` | 直接验收 |

### 报告

写入 `<workspace>/.dsh/acceptance/<sessionId>.json` 与同名的 `.md`。JSON 契约见
[report-schema.json](lib/acceptance/report-schema.json)，
真实样本见 [acceptance-sample.md](docs/acceptance-sample.md) 与
[acceptance-sample.json](docs/acceptance-sample.json)。

插件主页的「Claude 验收」卡片会显示：验收状态（已就绪 / 等待选择 / Claude 验收中 / 完成 / 跳过 / 失败）、总结论、
三项检查及说明、可展开的逐条证据、缺失判据、返工建议、报告路径，并提供「立即验收 / 跳过验收 / 刷新」与「最近验收」列表。
验收完成后还会把结论与报告路径注入会话，DSH 在下一轮就能看到。

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
      gatePolicy: off          # off | ask | auto（默认 off；直接验收用上面的可见终端）
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
- 验收内核：`lib/acceptance/`，`npm test` 运行 25 个 node:test 用例（契约、取证、检查器、判定、报告、三态策略、dispatch 回归）。
- 已实测：Claude CLI 探测（2.1.295）、真实首问与定稿两次结构化调用、Host 路由离线 harness、DSH 侧栏与主面板注册。
- 未实测：浏览器内的面板视觉渲染与「点击派发」全链路（开发会话没有浏览器控制能力）；首次使用请刷新一次页面。

## 卸载

在 DSH 的 Plugins 页面关闭并移除本 bundle，或从 profile 的 `package.json` / `cordis.patch.yml` 中删除对应项。
