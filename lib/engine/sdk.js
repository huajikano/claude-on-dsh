/**
 * The Agent SDK engine: run one unattended Claude turn the way dsh-claude does.
 *
 * Claude on DSH shipped one way to talk to Claude — spawn `claude -p
 * --output-format json --json-schema`, read stdout, parse. That is the CLI's
 * one-shot mode, and it inherits the CLI's limits: the schema travels as a
 * command-line argument, the whole reply arrives as one JSON blob, and the
 * planning turn cannot make use of the Agent SDK's structured-output retries.
 *
 * @norman-else/dsh-claude (the plugin this file borrows from) runs the same
 * local Claude Code through `query()` from @anthropic-ai/claude-agent-sdk. The
 * turn keeps Claude Code's own loop, tools, CLAUDE.md, Skills, Hooks, Plugins,
 * settings and authentication; the caller supplies a prompt, a schema and a
 * permission mode and gets a result message back. `outputFormat: {type:
 * 'json_schema'}` replaces `--json-schema`, and `structured_output` replaces
 * parsing the CLI's stdout.
 *
 * This module is the planner's half of that: same inputs as `startClaudeRun`
 * (prompt on the way in, `{data, meta}` out), same `{promise, cancel}` handle,
 * so index.js picks one engine and every existing call site — first question,
 * refine, dev doc review, acceptance judge, review opinion — follows.
 *
 * It deliberately owns no policy: no trust dialog, no usage ledger, no session
 * map. Those stay in index.js, where the CLI engine puts them.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/** The package dsh-claude pins; the SDK ships the Claude Code binary it drives. */
export const SDK_PACKAGE = '@anthropic-ai/claude-agent-sdk'

/** Modes the SDK accepts. `auto` is a panel word, not an SDK one. */
export const SDK_MODES = new Set(['default', 'acceptEdits', 'bypassPermissions', 'plan', 'dontAsk'])

/**
 * Map a panel permission mode onto the SDK's. `auto` is the panel's "let DSH
 * decide" and has no SDK counterpart, so it lands on `default` — the SDK's own
 * standard behaviour — rather than silently escalating.
 */
export function sdkPermissionMode(mode, fallback = 'plan') {
  const wanted = typeof mode === 'string' ? mode.trim() : ''
  if (SDK_MODES.has(wanted)) return wanted
  if (wanted === 'auto') return 'default'
  return SDK_MODES.has(fallback) ? fallback : 'plan'
}

/** `bypassPermissions` is refused by the SDK unless the operator also says so. */
export function needsSkipPermissions(mode) {
  return mode === 'bypassPermissions'
}

/**
 * Where the SDK lives. A plugin installed from npm finds it as a dependency; a
 * plugin running from a checkout linked into a profile does not, because Node
 * resolves from the checkout's real path. The profiles directory is therefore
 * searched by hand, which is also where a profile that installed dsh-claude
 * already keeps a copy.
 */
export function sdkCandidates({ sdkPath = '', dshHome = '' } = {}) {
  const candidates = []
  const explicit = String(sdkPath || '').trim()
  if (explicit) candidates.push(explicit)
  const home = String(dshHome || '').trim()
  if (home) {
    const profiles = path.join(home, 'profiles')
    try {
      for (const name of readdirSync(profiles)) {
        candidates.push(path.join(profiles, name, 'node_modules', SDK_PACKAGE))
      }
    } catch {}
  }
  return candidates
}

/** The module file behind one candidate directory, or '' when it is not a package. */
export function sdkEntry(dir) {
  if (!dir) return ''
  try {
    const manifest = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8'))
    const main = typeof manifest.main === 'string' && manifest.main ? manifest.main : 'sdk.mjs'
    const entry = path.join(dir, main)
    if (existsSync(entry)) return entry
  } catch {}
  const fallback = path.join(dir, 'sdk.mjs')
  return existsSync(fallback) ? fallback : ''
}

/**
 * A lazy loader for the SDK: the first call resolves and imports, later calls
 * reuse the module. Rejects with the candidates it tried, because a missing SDK
 * is an install problem the user has to be told about by path.
 */
export function createSdkLoader({ sdkPath = '', dshHome = '', importModule } = {}) {
  const loader = async () => {
    if (loader.module) return loader.module
    const tried = []
    for (const dir of sdkCandidates({ sdkPath, dshHome })) {
      const entry = sdkEntry(dir)
      tried.push(entry || dir)
      if (!entry) continue
      const loaded = await (importModule ? importModule(entry) : import(pathToFileURL(entry).href))
      if (loaded && typeof loaded.query === 'function') {
        loader.module = loaded
        loader.from = entry
        return loaded
      }
    }
    // Last resort: a bare specifier, which works wherever the package is hoisted
    // next to the plugin (an npm-installed plugin, a workspace install).
    try {
      const loaded = await (importModule ? importModule(SDK_PACKAGE) : import(SDK_PACKAGE))
      if (loaded && typeof loaded.query === 'function') {
        loader.module = loaded
        loader.from = SDK_PACKAGE
        return loaded
      }
    } catch {}
    const error = new Error(`没有找到 ${SDK_PACKAGE}`)
    error.hint = `已尝试：${tried.join('；') || '（没有候选路径）'}。把 SDK 装进 profile，或在插件配置里用 sdkPath 指向它的目录。`
    throw error
  }
  return loader
}

/**
 * The options one planning turn runs under.
 *
 * `settingSources` carries the user's own Claude Code settings (and therefore
 * the authentication dsh-claude relies on). Tools stay available because the
 * planner runs in `plan` mode, which is read-only at the CLI level: the turn can
 * read the repository it is planning for, and cannot write to it.
 */
export function buildSdkOptions({
  cwd,
  schema = null,
  model = '',
  permissionMode = 'plan',
  resume = '',
  forkSession = false,
  systemPrompt = '',
  abortController,
  executable = '',
  maxTurns,
  allowedTools,
  disallowedTools,
  readOnly = false,
  settingSources = ['user', 'project', 'local'],
} = {}) {
  const mode = sdkPermissionMode(permissionMode)
  const options = {
    cwd,
    permissionMode: mode,
    settingSources,
    ...(readOnly ? { tools: ['Read', 'Glob', 'Grep'], strictMcpConfig: true, mcpServers: {} } : {}),
    ...(abortController ? { abortController } : {}),
    ...(needsSkipPermissions(mode) ? { allowDangerouslySkipPermissions: true } : {}),
    ...(model ? { model } : {}),
    ...(resume ? { resume } : {}),
    ...(forkSession && resume ? { forkSession: true } : {}),
    ...(systemPrompt
      ? { systemPrompt: { type: 'preset', preset: 'claude_code', append: systemPrompt } }
      : {}),
    ...(executable ? { pathToClaudeCodeExecutable: executable } : {}),
    ...(typeof maxTurns === 'number' ? { maxTurns } : {}),
    ...(Array.isArray(allowedTools) ? { allowedTools } : {}),
    ...(Array.isArray(disallowedTools) && disallowedTools.length > 0 ? { disallowedTools } : {}),
    ...(schema ? { outputFormat: { type: 'json_schema', schema } } : {}),
  }
  return options
}

/** JSON a model wrapped in a fence, or the object it handed back framed in prose. */
export function parseStructuredText(raw) {
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (!value) return undefined
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = fenced ? fenced[1].trim() : value
  try {
    const parsed = JSON.parse(body)
    return parsed && typeof parsed === 'object' ? parsed : undefined
  } catch {
    const first = body.indexOf('{')
    const last = body.lastIndexOf('}')
    if (first < 0 || last <= first) return undefined
    try {
      const parsed = JSON.parse(body.slice(first, last + 1))
      return parsed && typeof parsed === 'object' ? parsed : undefined
    } catch {
      return undefined
    }
  }
}

/**
 * Turn the result message into the `{data, meta}` shape the CLI engine returns.
 * `structured_output` is the SDK's own answer to the schema; the text is the
 * fallback for a model that answered in prose anyway, which the CLI path also
 * tolerated.
 */
export function readSdkResult(message, { schema = null } = {}) {
  if (!message || typeof message !== 'object') {
    throw Object.assign(new Error('Claude 没有返回结果消息'), { status: 502 })
  }
  const subtype = typeof message.subtype === 'string' ? message.subtype : ''
  if (message.is_error === true || (subtype && subtype !== 'success')) {
    const detail = typeof message.result === 'string' && message.result ? message.result : subtype || '未知错误'
    // A turn that failed inside the API still reports subtype `success`; name the
    // failure by what came back rather than by that word.
    const label = subtype && subtype !== 'success' ? subtype : 'error'
    throw Object.assign(new Error(`Claude 回合失败（${label}）`), {
      hint: detail.slice(0, 400),
      status: 502,
    })
  }
  const structured = message.structured_output && typeof message.structured_output === 'object'
    ? message.structured_output
    : undefined
  const data = structured || (schema ? parseStructuredText(message.result) : undefined) ||
    (message.result && typeof message.result === 'object' ? message.result : undefined)
  if (!data) {
    throw Object.assign(new Error('Claude 未按结构返回结果'), {
      hint: typeof message.result === 'string' ? message.result.slice(-400) : '',
      status: 502,
    })
  }
  const modelUsage = message.modelUsage && typeof message.modelUsage === 'object' ? message.modelUsage : null
  const meta = {
    durationMs: typeof message.duration_ms === 'number' ? message.duration_ms : undefined,
    costUsd: typeof message.total_cost_usd === 'number' ? message.total_cost_usd : undefined,
    turns: typeof message.num_turns === 'number' ? message.num_turns : undefined,
    sessionId: typeof message.session_id === 'string' && message.session_id ? message.session_id : undefined,
    models: modelUsage ? Object.keys(modelUsage) : [],
  }
  return { data, meta }
}

/**
 * Start one SDK-backed turn.
 *
 * Same handle as `startClaudeRun`: `{promise, cancel}`. `cancel()` aborts the
 * SDK's own controller, so the CLI the SDK spawned is torn down rather than
 * abandoned, and the promise rejects with the caller's cancel error.
 *
 * `loadSdk` exists so tests can hand in a fake `query` without the package.
 */
export function startSdkRun({
  prompt,
  cwd,
  schema = null,
  model = '',
  permissionMode = 'plan',
  resume = '',
  forkSession = false,
  systemPrompt = '',
  executable = '',
  timeoutMs = 240_000,
  maxTurns,
  allowedTools,
  disallowedTools,
  readOnly = false,
  loadSdk,
  makeTimeoutError = () => Object.assign(new Error('Claude 调用超时'), { status: 504 }),
  makeCancelError = () => Object.assign(new Error('已取消本次 Claude 调用'), { status: 409 }),
} = {}) {
  const controller = new AbortController()
  let cancelled = false
  let timer = null
  let timedOut = false

  const promise = (async () => {
    const sdk = await (loadSdk ? loadSdk() : createSdkLoader()())
    if (typeof sdk.query !== 'function') {
      throw Object.assign(new Error('Agent SDK 没有导出 query()'), { status: 500 })
    }
    const options = buildSdkOptions({
      cwd,
      schema,
      model,
      permissionMode,
      resume,
      systemPrompt,
      forkSession,
       abortController: controller,
      executable,
      maxTurns,
      allowedTools,
      disallowedTools,
      readOnly,
    })
    timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, timeoutMs)
    if (typeof timer.unref === 'function') timer.unref()
    try {
      const query = sdk.query({ prompt, options })
      let last = null
      for await (const message of query) {
        if (!message || typeof message !== 'object') continue
        if (message.type === 'result') {
          last = message
          break
        }
      }
      if (cancelled) throw makeCancelError()
      if (timedOut) throw makeTimeoutError()
      if (!last) {
        throw Object.assign(new Error('Agent SDK 回合没有返回结果'), { status: 502 })
      }
      return readSdkResult(last, { schema })
    } catch (error) {
      if (cancelled) throw makeCancelError()
      if (timedOut) throw makeTimeoutError()
      throw error
    } finally {
      if (timer) clearTimeout(timer)
    }
  })()

  return {
    promise,
    cancel() {
      if (cancelled || timedOut) return
      cancelled = true
      try {
        controller.abort()
      } catch {}
    },
  }
}

/** One word for the config: which engine a run uses. */
export function normalizeEngine(value, fallback = 'auto') {
  const wanted = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (wanted === 'cli' || wanted === 'sdk' || wanted === 'auto') return wanted
  return fallback
}
