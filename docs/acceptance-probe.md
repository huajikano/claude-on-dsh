# 挂载点探测与取证能力清单

探测时间：2026-10-29（DSH desktop profile，`@deepseek-ai/dsh-api-session-controller`）
目标会话：`session-192c299b-c3f0-4564-80f5-339e78f291d6`

## 1. 会话结束事件

没有名为 `session/ended` 的 Host 事件。Event 目录中与会话生命周期相关的只有：

| 事件 | 模式 | 含义 | 可否作为“结束”触发 |
|---|---|---|---|
| `agent/status` | emit | `{ agent, status: 'idle' \| 'running' }` | **采用**：armed 会话出现 `running` 后回到 `idle`，即本次任务 turn 结束 |
| `agent/disposed` | emit | Agent 离开 registry（归档/关闭） | 兜底：若在 idle 前被 dispose，也触发一次 |
| `session/disposed` | emit | Session 离开 store（发布回滚/关闭） | 未采用（无法保证持久化读取已 flush） |
| `turn/end` | 仅 Session 事件 | turn 结束的持久化事实 | 不订阅 Host 事件；从日志读取结束状态 |
| `api-session/status` | emit | `(sessionId, running)` | 与 `agent/status` 重复，未采用 |

**结论**：会话没有显式“结束”事件。插件采用“插件驱动完成后的后置调用”形态：dispatch 时 `arm(sessionId)`，监听 `agent/status` 的 `running → idle`（延迟 150ms 让 turn 事件落盘），`agent/disposed` 兜底。手动入口 `/acceptance run <sessionId>` 与 `node bin/acceptance.mjs run <sessionId>` 共用同一内核。

> 已知限制：如果一次 dispatch 后会话还有后续 turn，验收在**第一个** running→idle 后触发；这对应插件派发的任务 turn，符合“本次驱动完成后置验收”的定位。

## 2. 按 sessionId 的取证能力

| 判据 | 来源 | 结论 |
|---|---|---|
| 任务目标 | `sessionController.inspect(sessionId).events` 中第一条 `user/message` 且 `data.source.kind === 'user'` | **可取**（跳过 `user-approval`、runtime context、system-reminder） |
| 事件流 | `sessionController.inspect(sessionId)`（Host，持久化读取）或 Session 日志文件（CLI） | **可取** |
| workspace 绝对路径 | `inspect().meta.cwd`（`SessionHeader.cwd`） | **可取** |
| 改动文件 | `git status --porcelain=v1 --untracked-files=all` + `git diff --name-status HEAD` + tool `write`/`edit` 的 `file_path` | **部分可取**：git 只覆盖 workspace；workspace 外的写入只能从工具调用参数取证 |
| 命令与输出 | `tool/call`（`pwsh`/`bash`）配对 `tool/result.message.content` + `isError` | **可取**；输出为空时按规则判 uncertain |
| 结束状态 | 最后一个 `turn/end.data.reason.kind` | **可取** |
| 会话结束事件 | 无 | **不可取**，用 `agent/status` idle 兜底 |
| 逐 turn 改动摘要 | Session 事件 `workspace/changes`（目标会话 4 条） | **可取但未采用**：字段随版本变化，首版以 git + 工具调用为准 |
| DSH 自我汇报 | `assistant/message` | 仅作线索，不作验收依据 |

## 3. Session 日志格式

`~/.dsh/sessions/<cwd-slug>/<sessionId>/session.v4.jsonl.zstd` 是**多个 zstd frame 顺序追加**，不是单个 frame。Node 的 `zstdDecompressSync` 只解第一个 frame；`lib/acceptance/session-log.js` 按 `28 B5 2F FD` 魔数切分并逐帧解压。

目标日志实测：1126 个 frame → 1814 行，0 个解码失败，1793 个事件（探测时）。

## 4. 目标会话事实（探测时）

- workspace：`D:\XiangMu\音乐制作`
- agentPreset：`cordis`
- 1793 个事件：319 次 `tool/call` / 319 次 `tool/result`、4 个完成 turn、4 条 `workspace/changes`
- 首条真实任务：`user/message#16`（`source.kind = 'user'`）
- 工具输出示例：`tool/result.data.message.content[0].text`，`isError` 在 `message` 上
- 写入类工具：`write`/`edit`，路径在 `arguments.file_path`

## 5. 复现方式

1. 安装插件后，派发一次任务；观察 Host 日志 `[claude-on-dsh:acceptance] trigger ...`。
2. 或手动：`node bin/acceptance.mjs run <sessionId>`；报告写到 `<workspace>/.dsh/acceptance/`。
3. 在 DSH 会话内：`/acceptance run <sessionId>`（等价手动入口）。
