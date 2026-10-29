# 已知偏差清单（目标会话实跑）

样本：`session-192c299b-c3f0-4564-80f5-339e78f291d6`
报告：`docs/acceptance-sample.json` / `docs/acceptance-sample.md`
最终结论：**fail**（`goal-response: uncertain`，`verification: pass`，`scope: fail`），状态 `completed`，Claude 判定 `completed`。

## 1. 判据取不到的项

- **workspace 外的改动**：目标会话的交付物写在 `D:\XiangMu\ClaudeCommander`（后改名为 `D:\XiangMu\claude-on-dsh`），不在 workspace `D:\XiangMu\音乐制作` 内。`git status` 看不到这些文件，只能从 `write`/`edit` 工具调用的 `file_path` 取证。scope 因此判 fail。
- **行号区间**：git status 与工具调用参数都不带行号；证据以 `path + locator + excerpt` 定位。约定允许「行号区间**或**定位串」，本样本全部使用定位串。
- **逐 turn 改动摘要**：Session 有 `workspace/changes` 事件，但首版未采用，避免依赖随版本变化的内部字段。
- **真实 UI 的 ask 回答**：`gatePolicy=ask` 用 `ctx.userQuestions.ask` 实现；本次没有可交互的浏览器验收，ask 分支只有 fake answerer 单测（拒绝不落盘），没有真实点击证据。
- **自动触发**：目标会话是手动入口跑出的报告；`agent/status` running→idle 的自动触发在单测里覆盖（含只触发一次的断言），但没有在真实 dispatch 上再跑一遍。

## 2. 需要人工复核的结论

- **verification: pass**：检查器取“最后一次验证命令”。目标会话里早期确实出现过 `node --test test/acceptance` 的模块解析失败与 2 个失败用例；后续 `node --test "test/acceptance/*.test.js"` 全绿覆盖了它们。人工复核时应确认“最后一次”就是最终状态，而不是漏掉了之后又失败的运行。
- **goal-response: uncertain**：Claude 认为插件骨架与调度测试证据能说明方向，但“左侧栏入口 / CLI 与桌面版 / cc-switch / 首问由 Claude 指挥”等子需求缺少内容级证据，且交付目录存在 `ClaudeCommander` 与 `claude-on-dsh` 两个并行路径，无法确定唯一交付物。人工应确认唯一目录。
- **scope: fail**：这是确定性的越权事实，不是模型判断；若产品定义允许“在 workspace 外创建交付物”，应把该目录加入 `allowedPaths` 后重跑，而不是忽略这条。

## 3. 模型判断与人工判断可能不一致的地方

- 模型把“早期测试失败”视为会话历史的一部分；检查器改为“最后一次验证运行”后，模型仍可能引用证据表里的早期失败。当前报告没有引用早期失败作为 verification 的结论依据，但时间线需要人工读日志确认。
- 目标会话仍然存活，且后续 turn 就是验收功能的开发本身；报告按“整段会话 + 第一条用户任务”评估，事件数在生成时已从 1793 增至 2090。真实 dispatch 会话通常只有一个任务 turn，偏差会小得多。
- 报告没有对“返工建议”做可行性判断；模型给的是方向性建议（迁移目录、清理临时文件、补交付说明）。

## 4. 实现层面的已修偏差

- 早期版本把 `verification` 的所有历史命令都纳入判定，导致“已修复的失败”把最终结论拖成 fail；已改为按 `resultSeq` 取最后一次验证运行。
- 早期版本对命令输出只保留头部，测试汇总在尾部被截断；已新增 `outputTail` 与 `summary` 提取（`ℹ pass/fail` 行）。
- 早期版本把同一证据 id 被多个检查项引用视为重复；已允许“内容相同的同一证据”跨检查项复用，内容冲突仍拒绝。
- 工具写入证据的 locator 曾显示 `tool/call#?`；已在合并 `changedFiles` 时保留 `seq`。

## 5. 报告位置与清理

- 实跑报告写在 `D:\XiangMu\音乐制作\.dsh\acceptance\`；仓库内副本在 `docs/acceptance-sample.{json,md}`。
- 建议项目 `.gitignore` 加入 `.dsh/acceptance/`，避免报告进入业务提交。
- 目标会话的 `ClaudeCommander`、`claude-on-dsh-probe`、`acceptance-probe` 等试验目录已清理或改名；当前唯一插件目录是 `D:\XiangMu\claude-on-dsh`。
