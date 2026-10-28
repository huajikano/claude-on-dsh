# Claude on DSH

一个 DSH 侧栏插件：让**本机 Claude Code CLI** 或 **Claude 桌面版**负责新项目的首个提问与规划，然后把完整任务交接给 **DSH** 执行。

仓库：<https://github.com/huajikano/claude-on-dsh>

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

## 本机集成

| 组件 | 位置 | 说明 |
|---|---|---|
| Claude Code CLI | `%APPDATA%\npm\node_modules\@anthropic-ai\claude-code\bin\claude.exe`（自动探测） | 以 `-p --output-format json --json-schema` 运行，提示词走 stdin，避免命令行长度与转义问题 |
| Claude 桌面版 | `C:\Program Files\WindowsApps\Claude_3.6556.2.0_x64__pzs8sxrjxfjjc\app\claude.exe`（自动探测） | 桌面版没有可编程接口，因此作为「人工接管」通道：生成简报、复制到剪贴板、拉起桌面版，再把 Claude 的回复粘回面板 |
| CC Switch | `D:\CC Switch\cc-switch.exe`（自动探测） | CLI 与桌面版的实际 API key 由 CC Switch 的本地代理提供；面板会显示代理是否可达，并可一键拉起 CC Switch |

> 桌面版通过 CC Switch 使用其配置的 API key；插件自身不读取、不保存任何密钥，只把 `~/.claude/settings.json` 里的 `ANTHROPIC_BASE_URL` 当作代理健康检查目标。

## 安装

作为本地 bundle 安装到 DSH profile：

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

## 开发与验证

- Host 半：Node ESM，无第三方依赖；`/api/claude-on-dsh/*` 路由负责探测、运行 CLI、派发、历史与桌面启动。
- Client 半：`window.__ModuleLoader__` 工厂，注册 `sidebar.panellist` 图标与 `main` 面板。
- 已实测：Claude CLI 探测（2.1.295）、真实首问与定稿两次结构化调用、Host 路由离线 harness、DSH 侧栏与主面板注册。
- 未实测：浏览器内的面板视觉渲染与「点击派发」全链路（开发会话没有浏览器控制能力）；首次使用请刷新一次页面。

## 卸载

在 DSH 的 Plugins 页面关闭并移除本 bundle，或从 profile 的 `package.json` / `cordis.patch.yml` 中删除对应项。
