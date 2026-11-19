# 两条集成线：主题互通 与 Agent SDK 引擎

这份文档记两件事的落地方式、验证手段和回滚步骤：

1. **claude-on-dsh 的视觉**并入 [dsh-claude-style](https://github.com/Nwflower/dsh-claude-style)（主题侧）；
2. **[dsh-claude](https://github.com/Norman-else/dsh-claude) 的引擎能力**并入 claude-on-dsh，作为首问/定稿/预审/验收的 Claude（插件侧）。

两边都是「融合」，不是「复制」：主题侧多一套预设 + 一段兼容样式；插件侧多一个引擎开关，CLI 老路原样保留。

---

## 一、主题侧：纸面（Paper）预设 + 面板兼容层

### 1.1 落点

工作副本：`D:\XiangMu\upstream-dsh-claude-style`（`git clone --depth 1`，直连，别走 127.0.0.1:7890 那个已停的代理）。

| 文件 | 改动 |
|---|---|
| `packages/client/src/theme/tokens.json` | `palette.cards` 追加第 7 张卡 `paper` |
| `packages/contracts/src/prefs.ts` | `PALETTE_PRESETS` 加 `'paper'`（构建脚本据此核对卡片 id） |
| `packages/client/src/theme/tokens.css` | 补一条 `html:has(...[data-dsh-claude-palette-card="paper"])` 画布色 `#fffdf8`（文档元素读不到 body 的令牌，只能逐卡声明） |
| `packages/client/src/features/settings/palette-parts.ts` | `PRESET_LABELS` 加 `paper: 'palettePresetPaper'` |
| `packages/client/src/features/settings/settings.copy.json` | 文案 `纸面 / Paper` |
| `packages/client/src/theme/third-party.css` | 新增 `claude-on-dsh` 段：面板标题改用主题衬线，卡片描边改用主题发丝线 |
| `README.md` / `README.en.md` / `docs/STYLE.md` | 六套 → 七套，写明 `paper` 的取值来源；STYLE.md 的令牌表由构建重新生成 |

### 1.2 取色依据

`paper` 的每个值都来自 claude-on-dsh 自己的面板变量，不是凭感觉调的：

| 用途 | 值 | 面板里的来源 |
|---|---|---|
| 强调 | `#d97757` | `--cc-accent` |
| 画布（亮/暗） | `#fffdf8` / `#282521` | `--cc-paper` |
| 正文（亮/暗） | `#2f2a25` / `#f3ede4` | `--cc-ink` |
| 侧栏（亮/暗） | `#fffaf2` / `#1f1d1a` | 面板次级纸面 / `--cc-cream` 暗值 |
| 气泡（亮/暗） | `#f7f4ed` / `rgba(243,237,228,.06)` | `--cc-cream` |
| 链接（亮/暗） | `#b9512f` / `#e28a67` | `--cc-accent-strong` / 亮化的强调色 |
| 边线 | `edges: highlight` | 暖纸上的边是阴影，暗色上是一道高光 |

### 1.3 反向：面板跟随主题，但不丢自己的脸

第一版桥接做错了：把 `--cc-paper` 也接到了 `--dsw-alias-bg-layer-1`，于是在默认 Claude 预设下（那里是纯白 `#ffffff`）面板从暖奶油 `#f7f4ed` 被抹成了白纸——用户看到的就是「主题一点没变，面板还变白了」。宿主不该用自己的一张白纸把插件的脸盖掉。

现在按「借什么、留什么」分开：

```css
.cc-panel {
  --cc-accent: var(--dsw-alias-brand-primary, #d97757);   /* 借：品牌色 */
  --cc-ink:    light-dark(#2f2a25, var(--dsw-alias-label-primary, #f3ede4));
  --cc-paper:  light-dark(#fffdf8, var(--dsw-alias-bg-layer-1, #282521));
  --cc-cream:  light-dark(#f7f4ed, var(--dsw-alias-bg-layer-2, #1f1d1a));
  /* …亮色留住自己的纸，暗色借宿主的表层阶梯 */
}
body:not([data-ds-dark-theme]) .cc-panel { color-scheme: light; }
body[data-ds-dark-theme] .cc-panel { color-scheme: dark; }
```

- **亮色**：纸、奶油、墨、线全部是自己的值——观感与改动前一致，不会变白。
- **暗色**：交给宿主的 `--dsw-alias-*`，插件不自己发明第二套暗色阶梯；原来那段 `@media (prefers-color-scheme: dark)` 删掉，避免两套打架。
- **强调色**：跟随预设。选 DeepSeek / 森林 / 暮色 / 蔷薇时，面板的徽章、进度点、会话 chip、悬停底色会跟着变色——这就是「面板确实接上了主题」的可见证据。
- `light-dark()` 依赖元素的 `color-scheme`，所以面板自己按宿主的暗色标记（`data-ds-dark-theme`）声明一次，不指望一条它看不见的级联。

改写由 `tools/retheme-cc-panel.mjs` 完成，幂等、可重跑：它认出现在这个桥接形态就跳过，认不出就报错而不是硬改（防止把已经手工调过的样式再拍一遍）。

```bash
node tools/retheme-cc-panel.mjs --check  # 只检查，不改
```

### 1.4 部署到运行中的 profile

源码改了不等于界面变了：DSH 加载的是 profile 里那份包。这里踩过两个坑，最后一条才是对的：

| 方式 | 结果 |
|---|---|
| 把构建产物拷进 `node_modules/dsh-claude-style` | ❌ 每次启动 profile 都会按依赖清单重建 node_modules，拷进去的立刻被换回 registry 版 |
| `dsh plugin add "link:<源码目录>"` | ❌ 链接的包不解析 profile 的 peer 依赖，会去读源码 checkout 自己的 `node_modules`（那套是 0.2.2-rc.1 的 devDeps），主题加载失败，界面直接退回 DSH 默认皮肤 |
| `pnpm pack` 出 tgz，放进 profile 的 `vendor/`，`dsh plugin add "file:./vendor/dsh-claude-style-0.21.6.tgz"` | ✅ 与 profile 自带的那两个 `file:` 插件同一套路，pnpm 每次重建都从 tgz 解包，peer 从 profile 解析 |

现在 profile 依赖是 `file:…/vendor/dsh-claude-style-0.21.6.tgz`，装出来 3.7 MB、`lib/client.js` 与源码构建产物哈希一致。

部署后核对三件事：`node_modules/dsh-claude-style/package.json` 的 version、`lib/client.js` 里是否含 `"paper"` 预设、profile `package.json` 的 `dsh.profile.bundles` 里是否还在。

> 注意：`dsh plugin remove` 会重写 `bundles` 数组，`@norman-else/dsh-claude` 这类非本次操作的插件会被顺手摘掉（摘掉就没有 `claude` 预设可选）。本轮已手工补回，改完 profile 依赖后务必核对一遍 `bundles`。

### 1.5 面板怎么接上主题

面板不再只是「借强调色」：只要 body 上有 `data-dsh-claude-style` 这个标记（主题自己打的），面板就整体并进当前配色——画布、卡片、墨色、发丝线、衬线标题全部跟着预设走；没有主题时它保持自己那张暖纸。规则写在面板样式末尾，作用域限定在 `body[data-dsh-claude-style] .cc-panel`，属于增量覆盖，不是替换。

### 1.4 验证

```bash
cd D:\XiangMu\upstream-dsh-claude-style
node scripts/build/build.mjs        # 会重写 docs/STYLE.md 的令牌表，paper 行自动出现
node scripts/checks/lint.mjs        # 1002 源文件 / 1664 条决策引用，通过
node scripts/checks/decisions-index.mjs --check
npx vitest run                      # 125 个文件 / 869 个用例，全绿
```

产物里核对：`lib/client.js` 出现 `cc-panel`、`cc-heading`；`docs/STYLE.md` 出现 `| paper |` 行。

---

## 二、插件侧：CLI 与 Agent SDK 两个引擎

### 2.1 为什么要换

claude-on-dsh 原来只有一条路：`spawn claude -p --output-format json --json-schema`。schema 走命令行参数、整轮回答是一个 JSON blob、超时就是 `SIGKILL` 一个子进程。dsh-claude 走的是官方 Agent SDK（`@anthropic-ai/claude-agent-sdk` 的 `query()`），结构化输出是一等公民（`outputFormat` + `structured_output`）。把这条路接进来，首问这类调用就同时拿到了：schema 不进命令行、SDK 自己的结构化重试、`AbortController` 能连带收掉它拉起的 CLI。

### 2.2 落点

| 文件 | 改动 |
|---|---|
| `lib/engine/sdk.js` | **新增**（约 400 行，零依赖）：权限模式映射、选项构造、结果解析、SDK 解析（含 profile 搜索）、`startSdkRun` |
| `index.js` | 引入引擎、`engine`/`sdkPath` 配置、`engineFor()`/`sdkAvailable()`/`engineExecutable()`、`runClaudeFor` 里一支 `attemptRun`、6 处调用闸门改 `engineExecutable()` |
| `test/acceptance/engine.test.js` | **新增** 21 个用例：映射、选项、结果解析、解析顺序、取消、超时 |
| `cordis.patch.yml` / `README.md` / `package.json` | 配置项、说明、「两套引擎」章节、版本 2.1.7 |

### 2.3 语义

| `engine` | 行为 |
|---|---|
| `auto`（默认） | 先试 SDK，解析不到退回 CLI，日志留一行 warn |
| `sdk` | 只用 SDK，解析失败直接报错并列出尝试过的目录 |
| `cli` | 与 2.1.6 完全一致的老路 |

- **权限照旧**：面板仍只请求 `plan`/`dontAsk`/`acceptEdits`；`auto` 在 SDK 侧映射成 `default`；`bypassPermissions` 需要 `allowDangerouslySkipPermissions`，只有配置里显式写才发生。
- **认证照旧**：`settingSources: ['user','project','local']`，用的还是 Claude Code 自己的设置与凭据，插件不碰。
- **两条真 `.exe` 的路径不换**：桌面版接管、可见验收终端仍然走 `findCli`——SDK 没有窗口给你看。
- **`executable` 变成可选**：有原生 CLI 就当 `pathToClaudeCodeExecutable` 传进去，没有就用 SDK 自带的二进制。

### 2.4 SDK 从哪来

解析顺序：配置 `sdkPath` → `$DSH_HOME/profiles/*/node_modules/@anthropic-ai/claude-agent-sdk` → 裸包名。

第二条是关键：从源码 `link:` 进来的插件按真实路径解析模块，看不到 profile 里的依赖；本机就是这种装法，所以必须手搜 profile。实测：

```
resolved from: C:\Users\...\.dsh\profiles\desktop\node_modules\@anthropic-ai\claude-agent-sdk\sdk.mjs
query is: function
```

### 2.5 验证

```bash
cd D:\XiangMu\claude-on-dsh-2.1.4
node --check index.js
node --test --test-reporter tap "test/acceptance/*.test.js"   # 117 用例全过
```

`node -e "import('./index.js')"` 能拿到 `apply / claudeTimeoutMessage / ensureClaudeTrust / inject / name / planningPermissionMode / reviewBudget` —— 模块层干净。

---

## 三、一次编码事故与它的修法（别重犯）

用 PowerShell 5.1 做「读 → 替换 → 写回」把 `index.js` 毁了：`Get-Content -Raw` 按 ANSI（cp936）解码 UTF-8，`Set-Content -Encoding UTF8` 再编码一次，中文全部变成 `鈥?` 这类乱码；更糟的是每个悬空的 UTF-8 前导字节会与后一个 ASCII 字符配成不可映射的 GBK 对、被替换成 `?`，于是引号被吃掉、语法直接崩。

教训三条：

1. **改文本只用 UTF-8 工具**（本会话的 `write` / `edit`，或 Node 的 `fs.writeFileSync(..., 'utf8')`）。PowerShell 5.1 的 `Get-Content`/`Set-Content` 默认编码不是 UTF-8。
2. **改前先留底**。客户端那份就是靠 `client.js.bak-retheme` 才没出事。
3. **坏了不要硬修**：`tools/skeleton-diff.mjs` 把两边非 ASCII 字符都替换成 `~` 再逐行比对，能证明「结构完全一致、只有编码损坏」，据此以 2.1.5 发布包为基座重建（`tools/rebuild-index.mjs`），再按 15 个干净差异重放 2.1.6 的真实改动。

重建后的校验：`node --check` 通过、`skeleton-diff` 干净差异 **0** 个、行数 3107 对 3107、117 个用例全过。

---

## 四、回滚

| 想撤掉 | 怎么做 |
|---|---|
| 面板重新主题化 | `copy client.js.bak-retheme client.js` |
| 主题侧全部改动 | `cd D:\XiangMu\upstream-dsh-claude-style && git checkout -- . && rm -rf lib` 后重跑 `npm run build` |
| SDK 引擎（回到 2.1.6 行为） | `cordis.patch.yml` 里 `engine: cli`，重启 DSH |
| SDK 引擎彻底移除 | 删 `lib/engine/`、`test/acceptance/engine.test.js`，`index.js` 用 `tools/rebuild-index.mjs` 的基座重建（或 `git` 回滚） |

---

## 五、2.3.0 补的三件事

1. **`/detect` 回执照实说引擎**：新增 `agentEngine` 字段（`requested` 配置值、`active` 实际值、`sdk.available` 与 `sdk.from` 路径、`denyTools`）。面板右上角多一枚 chip：亮的是 `Agent SDK`，灰的是 `CLI 引擎`；悬停显示 SDK 的实际路径与规划期禁用表。走 `cli` 配置时那枚 chip 一定落在 CLI，不会假装 SDK 在场。
2. **规划期只读的第二道锁**：`planningDenyTools`，默认 `Write / Edit / MultiEdit / NotebookEdit / Bash / BashOutput / KillShell`。本插件的每次 Claude 调用都是读，plan 模式已经管住，这一层是防「模式被改宽」；写空数组等于用回默认表（不允许用空表把锁摘掉）。
3. **纸面配色的预览图**：`docs/screenshots/paper-palette.png`，工具 `tools/paper-swatch.py` 直接读 `tokens.json` 画出来，卡片变了重跑即可；STYLE.md 已引用。

## 六、让 Claude 真的在 DSH 里会话（本轮新增）

dsh-claude 的本体能力是「Claude Code 作为 DSH 的一等会话提供者」——它声明了一个 Agent 预设 `claude`（`cordis.patch.yml` 里那行 `@deepseek-ai/dsh-agent-preset`）。所以「让 Claude 在 DSH 里会话」不需要把 130 个源文件搬进本插件，只需要**让本插件的派发落在那个预设上**：

1. `dispatchAgentPreset`（默认 `claude`）：派发的新会话建在 Claude 预设上，会话里的执行者就是 Claude Code 本体。
2. 面板的「DSH 新会话模式」下拉照旧可选；不选就走上面那个默认。
3. `availableAgentPresets()` 重写成**多服务名 + 多读法**的探测（`agentPresets` / `agentPresetRegistry` / `agentPresetsRegistry`；`list` / `all` / `entries` / `snapshot` / `available`；数组 / Map / 对象 / 裸 id 列表），`normalizePresetRows()` 负责归一。原来只认 `ctx.get('agentPresets').list()` 返回数组这一种形状——宿主换一行，下拉就整个消失，人也就选不到 Claude 会话。
4. 读不到清单时，用配置里那一个 id 顶上去（`/presets` 会回一个单项），不静默退回 DSH 默认。

三种分工因此都成立：

| 目标 | 怎么走 |
|---|---|
| Claude 规划 → DSH 执行 | 默认；`dispatchAgentPreset: ''` |
| Claude 规划 → **Claude 执行** | `dispatchAgentPreset: claude`（当前配置） |
| 全程 Claude，不用本插件 | DSH 里新开会话，预设选 `Claude` |

## 七、下一步可选（还没做）

- 面板 `/detect` 回执里带上当前引擎（现在引擎只在日志里可见）。
- 首问走 SDK 时把 `allowedTools` 收紧成只读白名单，让「规划期不写文件」由工具层再兜一道。
- 主题侧给 `paper` 配一张预览截图（`docs/screenshots/`），README 里补图。
