/**
 * Claude on DSH — Host half.
 *
 * The Host owns everything that needs the machine:
 *   - locating the local Claude Code CLI, the Claude desktop app, and CC Switch;
 *   - running the CLI unattended (prompt on stdin, structured JSON out);
 *   - creating the DSH Session that will execute the handoff and admitting the
 *     handoff prompt through the API Session Controller;
 *   - a small JSON history so the panel survives a reload.
 *
 * The browser half never spawns a process; it talks to these routes only.
 */
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { attachAcceptance } from './lib/acceptance/host.js'
import { attachReviewPrompt } from './lib/acceptance/review.js'
import { executeAcceptance } from './lib/acceptance/kernel.js'
import { extractTask, buildFacts } from './lib/acceptance/facts.js'

/** Loader row name. */
export const name = 'claude-on-dsh'

/** Hard dependencies: the HTTP carrier, the session seams, and full-access setup. */
export const inject = [
  'connection',
  'workspaceRegistry',
  'sessionController',
  'sessions',
  'permissionPresets',
  'approval',
  'agents',
  'userQuestions',
]

const ROUTE = '/api/claude-on-dsh'
const CLI_PROBE_TTL_MS = 60_000
const DETECT_TTL_MS = 2_000
const DETECT_STATIC_TTL_MS = 60_000
const JOB_KEEP = 16
const HISTORY_KEEP = 24

const DEFAULTS = {
  claudeCliPath: '',
  desktopAppPath: '',
  ccSwitchPath: 'D:\\CC Switch\\cc-switch.exe',
  permissionMode: 'plan',
  permissionPreset: 'danger-full-access',
  model: '',
  timeoutMs: 240_000,
}

const MODES = new Set(['plan', 'dontAsk', 'acceptEdits', 'bypassPermissions', 'auto'])

/** Modes the panel may request for a planning run. A browser request cannot
 * escalate beyond these; only an explicit config value may. */
const PLANNING_MODES = new Set(['plan', 'dontAsk', 'acceptEdits'])

const COMMANDER_SYSTEM = [
  '你是 DSH 的「Claude 指挥官」，只负责三件事：理解需求、提出一个决定方案走向的首问、写一份可以直接执行的交接书。',
  '你不写代码、不修改文件、不执行命令、不调用工具。',
  '输出必须是简体中文（用户使用其他语言时跟随用户语言），文字务实、具体、可验收，避免空话。',
].join('\n')

const BRIEF_SCHEMA = {
  type: 'object',
  properties: {
    projectTitle: { type: 'string' },
    understanding: { type: 'string' },
    firstQuestion: { type: 'string' },
    questionOptions: { type: 'array', items: { type: 'string' } },
    planOutline: { type: 'array', items: { type: 'string' } },
    handoffDraft: { type: 'string' },
  },
  required: ['projectTitle', 'understanding', 'firstQuestion', 'questionOptions', 'planOutline', 'handoffDraft'],
  additionalProperties: false,
}

const REFINE_SCHEMA = {
  type: 'object',
  properties: {
    projectTitle: { type: 'string' },
    summary: { type: 'string' },
    plan: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          step: { type: 'string' },
          outcome: { type: 'string' },
        },
        required: ['step', 'outcome'],
        additionalProperties: false,
      },
    },
    acceptance: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
    dshPrompt: { type: 'string' },
  },
  required: ['projectTitle', 'summary', 'plan', 'acceptance', 'risks', 'dshPrompt'],
  additionalProperties: false,
}

/* ------------------------------------------------------------------ */
/* small utilities                                                     */
/* ------------------------------------------------------------------ */

function text(value, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function expand(value) {
  const raw = text(value).trim()
  if (raw === '') return ''
  const home = os.homedir()
  let out = raw
  if (out === '~') out = home
  else if (out.startsWith('~/') || out.startsWith('~\\')) out = path.join(home, out.slice(2))
  out = out.replace(/%([^%]+)%/g, (_, key) => process.env[key] ?? `%${key}%`)
  return out
}

function isFile(value) {
  try {
    return statSync(value).isFile()
  } catch {
    return false
  }
}

function isDir(value) {
  try {
    return statSync(value).isDirectory()
  } catch {
    return false
  }
}

function readJsonSafe(file) {
  try {
    const raw = readFileSync(file, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : undefined
  } catch {
    return undefined
  }
}

function tail(value, limit = 1_200) {
  const raw = text(value).trim()
  return raw.length > limit ? `…${raw.slice(-limit)}` : raw
}

function messageOf(error) {
  if (error instanceof Error && error.message) return error.message
  return String(error)
}

function userError(message, hint = '', status = 400) {
  const error = new Error(message)
  error.hint = hint
  error.status = status
  return error
}

function json(value, status = 200) {
  return Response.json(value, {
    status,
    headers: { 'cache-control': 'no-store' },
  })
}

function dshHome() {
  const configured = text(process.env.DSH_HOME).trim()
  return configured ? path.resolve(configured) : path.join(os.homedir(), '.dsh')
}

/* ------------------------------------------------------------------ */
/* detection                                                           */
/* ------------------------------------------------------------------ */

function findCli(configured) {
  const explicit = expand(configured)
  const appData = text(process.env.APPDATA)
  const localAppData = text(process.env.LOCALAPPDATA)
  const home = os.homedir()
  const candidates = [
    explicit,
    appData ? path.join(appData, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude.exe') : '',
    appData ? path.join(appData, 'npm', 'claude.cmd') : '',
    appData ? path.join(appData, 'npm', 'claude.exe') : '',
    localAppData ? path.join(localAppData, 'Programs', 'claude-code', 'claude.exe') : '',
    path.join(home, '.local', 'bin', 'claude.exe'),
    path.join(home, '.local', 'bin', 'claude'),
    path.join(home, '.claude', 'local', 'claude.exe'),
    path.join(home, '.claude', 'local', 'claude'),
  ]
  for (const candidate of candidates) {
    if (candidate && isFile(candidate)) return candidate
  }
  for (const dir of text(process.env.PATH).split(path.delimiter)) {
    if (!dir) continue
    for (const leaf of ['claude.exe', 'claude.cmd', 'claude']) {
      const candidate = path.join(dir, leaf)
      if (isFile(candidate)) return candidate
    }
  }
  return ''
}

function findDesktop(configured) {
  const explicit = expand(configured)
  if (explicit && isFile(explicit)) return { path: explicit, source: 'config' }

  const roots = ['C:\\Program Files\\WindowsApps', 'C:\\Program Files']
  for (const root of roots) {
    let names = []
    try {
      names = readdirSync(root)
    } catch {
      continue
    }
    for (const entry of names) {
      if (!/^Claude([_.\s-]|$)/i.test(entry)) continue
      const base = path.join(root, entry)
      for (const leaf of ['app\\claude.exe', 'claude.exe', 'Claude.exe', 'app\\Claude.exe']) {
        const candidate = path.join(base, leaf)
        if (isFile(candidate)) return { path: candidate, source: root }
      }
    }
  }

  const localAppData = text(process.env.LOCALAPPDATA)
  const home = os.homedir()
  const locals = [
    localAppData ? path.join(localAppData, 'AnthropicClaude', 'claude.exe') : '',
    localAppData ? path.join(localAppData, 'Programs', 'Claude', 'Claude.exe') : '',
    localAppData ? path.join(localAppData, 'Programs', 'claude', 'claude.exe') : '',
    path.join(home, 'AppData', 'Local', 'AnthropicClaude', 'claude.exe'),
  ]
  for (const candidate of locals) {
    if (candidate && isFile(candidate)) return { path: candidate, source: 'local' }
  }
  return { path: '', source: '' }
}

function findCcSwitch(configured) {
  const home = os.homedir()
  const localAppData = text(process.env.LOCALAPPDATA)
  const programFiles = text(process.env.ProgramFiles) || 'C:\\Program Files'
  const candidates = [
    expand(configured),
    'D:\\CC Switch\\cc-switch.exe',
    localAppData ? path.join(localAppData, 'Programs', 'CC Switch', 'cc-switch.exe') : '',
    path.join(programFiles, 'CC Switch', 'cc-switch.exe'),
  ]
  const executable = candidates.find((candidate) => candidate && isFile(candidate)) ?? ''
  return {
    path: executable,
    liveStatePath: path.join(home, '.cc-switch', 'live-state.json'),
    settingsPath: path.join(home, '.cc-switch', 'settings.json'),
  }
}

function readClaudeSettings() {
  const file = path.join(os.homedir(), '.claude', 'settings.json')
  const raw = readJsonSafe(file)
  const env = raw && typeof raw.env === 'object' && raw.env !== null ? raw.env : {}
  return {
    exists: Boolean(raw),
    path: file,
    baseUrl: text(env.ANTHROPIC_BASE_URL).trim(),
    hasAuthToken: Boolean(text(env.ANTHROPIC_AUTH_TOKEN).trim() || text(env.ANTHROPIC_API_KEY).trim()),
    defaultMode: text(raw && raw.permissions && raw.permissions.defaultMode).trim(),
    models: [
      text(env.ANTHROPIC_DEFAULT_OPUS_MODEL).trim(),
      text(env.ANTHROPIC_DEFAULT_SONNET_MODEL).trim(),
      text(env.ANTHROPIC_DEFAULT_HAIKU_MODEL).trim(),
    ].filter(Boolean),
  }
}

function probeTcp(host, port, timeoutMs = 700) {
  return new Promise((resolve) => {
    let settled = false
    let socket
    const finish = (value) => {
      if (settled) return
      settled = true
      try {
        socket?.destroy()
      } catch {}
      resolve(value)
    }
    try {
      socket = net.connect({ host, port })
      socket.setTimeout(timeoutMs)
      socket.once('connect', () => finish(true))
      socket.once('timeout', () => finish(false))
      socket.once('error', () => finish(false))
    } catch {
      finish(false)
    }
  })
}

async function probeProxy(baseUrl) {
  // Only a local proxy is something we can check with a TCP probe. A remote or
  // official endpoint is "not applicable", not "unreachable": warning about it
  // would tell users without CC Switch that their working setup is broken.
  if (!baseUrl) {
    return { url: '', host: '', port: 0, reachable: false, local: true, applicable: false, reason: 'no-base-url' }
  }
  let parsed
  try {
    parsed = new URL(baseUrl)
  } catch {
    return { url: baseUrl, host: '', port: 0, reachable: false, local: true, applicable: false, reason: 'invalid-url' }
  }
  const host = parsed.hostname
  const local = host === '127.0.0.1' || host === 'localhost' || host === '::1'
  const port = parsed.port ? Number(parsed.port) : parsed.protocol === 'https:' ? 443 : 80
  if (!local) {
    return { url: baseUrl, host, port, reachable: false, local: false, applicable: false, reason: 'remote' }
  }
  const reachable = await probeTcp(host, port)
  return { url: baseUrl, host, port, reachable, local: true, applicable: true }
}

/* ------------------------------------------------------------------ */
/* process helpers                                                     */
/* ------------------------------------------------------------------ */

function childEnv() {
  const env = { ...process.env }
  env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC ?? '1'
  return env
}

function cmdQuote(value) {
  const raw = String(value)
  if (raw !== '' && !/[\s"&|<>^%]/.test(raw)) return raw
  return `"${raw.replace(/"/g, '\\"')}"`
}

function spawnCommand(executable, args) {
  if (/\.exe$/i.test(executable)) return { file: executable, args }
  const comspec = text(process.env.ComSpec, 'C:\\Windows\\System32\\cmd.exe')
  const line = [executable, ...args].map(cmdQuote).join(' ')
  return { file: comspec, args: ['/d', '/s', '/c', line] }
}

function runProcess(executable, args, { timeoutMs = 10_000, cwd = os.tmpdir(), input = null } = {}) {
  const command = spawnCommand(executable, args)
  return new Promise((resolve) => {
    const child = spawn(command.file, command.args, {
      cwd,
      env: childEnv(),
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      try {
        child.kill('SIGKILL')
      } catch {}
      resolve({ code: 124, stdout, stderr: `${stderr}\n[timeout]`, timedOut: true })
    }, timeoutMs)
    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(result)
    }
    child.once('error', (error) => finish({ code: 127, stdout, stderr: `${stderr}\n${error.message}`, error }))
    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.once('close', (code) => finish({ code: code ?? 0, stdout, stderr }))
    child.stdin.on('error', () => {})
    if (input === null) child.stdin.end()
    else child.stdin.end(input, 'utf8')
  })
}

/* ------------------------------------------------------------------ */
/* Claude CLI runs                                                     */
/* ------------------------------------------------------------------ */

function parseLooseJson(raw) {
  const value = text(raw).trim()
  if (value === '') return undefined
  const withoutFence = value
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
  try {
    return JSON.parse(withoutFence)
  } catch {}
  const lines = value.split(/\r?\n/).filter(Boolean)
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      return JSON.parse(lines[index])
    } catch {}
  }
  return undefined
}

function extractResult(raw) {
  const parsed = parseLooseJson(raw)
  if (!parsed || typeof parsed !== 'object') {
    throw userError('Claude 没有返回可解析的 JSON', tail(raw, 400))
  }
  if (parsed.is_error === true) {
    throw userError('Claude 报告执行失败', text(parsed.result) || text(parsed.api_error_status) || tail(raw, 400))
  }
  const structured =
    parsed.structured_output && typeof parsed.structured_output === 'object' ? parsed.structured_output : undefined
  const fromText = typeof parsed.result === 'string' ? parseLooseJson(parsed.result) : undefined
  const data = structured ?? (fromText && typeof fromText === 'object' ? fromText : undefined)
  if (!data) {
    throw userError('Claude 未按结构返回结果', tail(parsed.result ?? raw, 400))
  }
  const meta = {
    durationMs: typeof parsed.duration_ms === 'number' ? parsed.duration_ms : undefined,
    costUsd: typeof parsed.total_cost_usd === 'number' ? parsed.total_cost_usd : undefined,
    turns: typeof parsed.num_turns === 'number' ? parsed.num_turns : undefined,
    sessionId: text(parsed.session_id) || undefined,
    models: parsed.modelUsage && typeof parsed.modelUsage === 'object' ? Object.keys(parsed.modelUsage) : [],
  }
  return { data, meta }
}

function normalizeMode(value, fallback) {
  const mode = text(value).trim()
  if (MODES.has(mode)) return mode
  return MODES.has(fallback) ? fallback : 'plan'
}

/**
 * Resolve the permission mode for a planning run. A browser request may only
 * ask for the three panel modes; elevated modes (bypassPermissions/auto) can
 * come from the operator's config, never from a request body.
 */
export function planningPermissionMode(requested, fallback) {
  const mode = text(requested).trim()
  if (PLANNING_MODES.has(mode)) return mode
  return normalizeMode(fallback, 'plan')
}

function cliArgs({ permissionMode, schema, model, systemPrompt }) {
  const args = ['-p', '--output-format', 'json', '--permission-mode', permissionMode]
  if (schema) args.push('--json-schema', JSON.stringify(schema))
  if (model) args.push('--model', model)
  if (systemPrompt) args.push('--append-system-prompt', systemPrompt)
  return args
}

function apiHint(stderr, proxy) {
  const raw = text(stderr).toLowerCase()
  if (
    raw.includes('econnrefused') ||
    raw.includes('connection refused') ||
    raw.includes('proxy') ||
    raw.includes('401') ||
    raw.includes('403') ||
    raw.includes('authentication')
  ) {
    return proxy.url
      ? `检查 CC Switch 是否已启动，以及 ${proxy.url} 是否可访问。`
      : '检查 Claude Code 的登录状态或 CC Switch 代理。'
  }
  return '可在面板中打开 CC Switch 检查代理，或稍后重试。'
}

/**
 * Start one unattended Claude Code run.
 * @returns {{ promise: Promise<{data: object, meta: object}>, cancel: () => void }}
 */
function startClaudeRun({ executable, prompt, cwd, schema, systemPrompt, permissionMode, model, timeoutMs, proxy }) {
  const command = spawnCommand(executable, cliArgs({ permissionMode, schema, model, systemPrompt }))
  const child = spawn(command.file, command.args, {
    cwd,
    env: childEnv(),
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  let stdout = ''
  let stderr = ''
  let timedOut = false
  let cancelled = false
  const promise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      timedOut = true
      try {
        child.kill('SIGKILL')
      } catch {}
    }, timeoutMs)
    const fail = (error) => {
      clearTimeout(timer)
      reject(error)
    }
    child.once('error', (error) => fail(userError('无法启动 Claude Code CLI', error.message)))
    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.once('close', (code) => {
      clearTimeout(timer)
      if (cancelled) {
        fail(userError('已取消本次 Claude 调用', '', 409))
        return
      }
      if (timedOut) {
        fail(
          userError(
            'Claude 调用超时',
            `已等待 ${Math.round(timeoutMs / 1000)} 秒；可以重试、缩短目标，或在 cordis.patch.yml 调整 timeoutMs。`,
            504,
          ),
        )
        return
      }
      if (code !== 0) {
        fail(userError(`Claude Code 退出码 ${code}`, tail(stderr) || tail(stdout) || apiHint(stderr, proxy), 502))
        return
      }
      try {
        resolve(extractResult(stdout))
      } catch (error) {
        reject(error)
      }
    })
    child.stdin.on('error', () => {})
    child.stdin.end(prompt, 'utf8')
  })
  return {
    promise,
    cancel() {
      cancelled = true
      try {
        child.kill('SIGKILL')
      } catch {}
    },
  }
}

/* ------------------------------------------------------------------ */
/* prompts                                                             */
/* ------------------------------------------------------------------ */

function buildBriefPrompt({ projectName, projectDir, goal }) {
  return [
    '你是「Claude 指挥官」，正在为一个新项目做开局。执行代理 DSH 会在你之后接手全部实现工作。',
    '',
    '## 项目信息',
    `- 项目名称：${projectName || '（未命名，请根据目标命名）'}`,
    `- 项目目录：${projectDir || '（尚未指定）'}`,
    '- 用户目标：',
    goal,
    '',
    '## 你要输出',
    '1. projectTitle：一个简短的项目名。',
    '2. understanding：用 3-6 句说明你对目标的理解，点明隐含约束与成功标准。',
    '3. firstQuestion：只提出 1 个最关键的首问。它的不同答案必须会实质改变技术方案、范围或验收标准；不要问能从目标里推断的信息。',
    '4. questionOptions：为这个首问给出 2-4 个可直接点选的候选答案，使用短句。',
    '5. planOutline：3-8 步的初步计划，每一步都是一个可验收的产出。',
    '6. handoffDraft：一段给 DSH 的完整任务书，包含背景、目标、范围、交付物、验收标准、约束与风险；尚未确认的点标为「待确认」，不要虚构用户偏好。',
    '',
    '## 约束',
    '- 全部使用简体中文（用户使用其他语言时跟随用户语言）。',
    '- 不修改任何文件、不执行命令、不调用工具。',
    '- 内容要具体、可执行、可验收，避免空泛的鼓励性表述。',
  ].join('\n')
}

function buildRefinePrompt({ projectName, projectDir, goal, brief, answer }) {
  return [
    '你是「Claude 指挥官」。用户已经回答了你提出的首问，现在请定稿交接书。',
    '',
    '## 项目信息',
    `- 项目名称：${projectName || brief?.projectTitle || '（未命名）'}`,
    `- 项目目录：${projectDir || '（未指定）'}`,
    '- 用户目标：',
    goal,
    '',
    '## 你此前的判断',
    `- 理解：${text(brief?.understanding)}`,
    `- 首问：${text(brief?.firstQuestion)}`,
    `- 初步计划：${(brief?.planOutline ?? []).map((step, index) => `${index + 1}) ${step}`).join(' ')}`,
    '',
    '## 用户的回答',
    answer,
    '',
    '## 你要输出',
    '1. projectTitle：最终项目名。',
    '2. summary：2-4 句定稿说明，体现用户回答带来的变化。',
    '3. plan：4-10 步的最终计划，每步包含 step（做什么）与 outcome（可验收的产出）。',
    '4. acceptance：3-8 条验收标准，必须可检验。',
    '5. risks：0-5 条主要风险与应对。',
    '6. dshPrompt：一份可以直接交给 DSH 执行的任务书。要求：自包含、不依赖追问、把用户回答融入方案、写清背景/目标/范围/交付物/验收标准/约束。不要以「根据对话」开头，不要复述这段指令。',
    '',
    '## 约束',
    '- 全部使用简体中文（用户使用其他语言时跟随用户语言）。',
    '- 不修改任何文件、不执行命令、不调用工具。',
    '- 任务书面向执行代理，要能直接开工。',
  ].join('\n')
}

function buildDesktopPrompt({ projectName, projectDir, goal }) {
  return [
    '你是我这次项目的总指挥。请先不要写代码，只做开局判断。',
    '',
    `项目名称：${projectName || '（未命名）'}`,
    `项目目录：${projectDir || '（未指定）'}`,
    '项目目标：',
    goal,
    '',
    '请按以下顺序回复：',
    '1. 你对目标的理解，以及隐含约束与成功标准。',
    '2. 一个最关键的首问（只需一个，答案会改变方案走向），附 2-4 个候选答案。',
    '3. 初步计划（3-8 步，每步一个可验收产出）。',
    '4. 一份可直接交给执行代理 DSH 的任务书：背景、目标、范围、交付物、验收标准、约束与风险。',
  ].join('\n')
}

/* ------------------------------------------------------------------ */
/* job manager                                                         */
/* ------------------------------------------------------------------ */

function createJobs() {
  const jobs = new Map()

  function prune() {
    if (jobs.size <= JOB_KEEP) return
    const finished = [...jobs.values()]
      .filter((job) => job.state !== 'running')
      .sort((left, right) => left.startedAt - right.startedAt)
    while (jobs.size > JOB_KEEP && finished.length > 0) {
      const victim = finished.shift()
      jobs.delete(victim.id)
    }
  }

  function serialize(job) {
    return {
      id: job.id,
      kind: job.kind,
      state: job.state,
      phase: job.phase,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      result: job.result,
      meta: job.meta,
      error: job.error,
      hint: job.hint,
    }
  }

  function start(kind, begin) {
    const id = randomUUID()
    const run = begin()
    const job = {
      id,
      kind,
      state: 'running',
      phase: kind === 'brief' ? 'Claude 正在理解需求' : 'Claude 正在定稿交接书',
      startedAt: Date.now(),
      cancel: run.cancel,
    }
    jobs.set(id, job)
    run.promise.then(
      ({ data, meta }) => {
        Object.assign(job, {
          state: 'done',
          phase: '完成',
          result: data,
          meta,
          finishedAt: Date.now(),
        })
        prune()
      },
      (error) => {
        Object.assign(job, {
          state: error && error.status === 409 ? 'cancelled' : 'error',
          phase: '结束',
          error: messageOf(error),
          hint: text(error && error.hint),
          finishedAt: Date.now(),
        })
        prune()
      },
    )
    return job
  }

  return { jobs, start, serialize }
}

/* ------------------------------------------------------------------ */
/* history                                                             */
/* ------------------------------------------------------------------ */

function historyFile() {
  return path.join(dshHome(), 'claude-on-dsh', 'history.json')
}

async function readHistory() {
  try {
    const raw = await readFile(historyFile(), 'utf8')
    const parsed = JSON.parse(raw.replace(/^\uFEFF/, ''))
    return Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry === 'object') : []
  } catch {
    return []
  }
}

async function writeHistoryEntry(entry) {
  const list = await readHistory()
  list.unshift(entry)
  const trimmed = list.slice(0, HISTORY_KEEP)
  const file = historyFile()
  await mkdir(path.dirname(file), { recursive: true })
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`
  await writeFile(temporary, `${JSON.stringify(trimmed, null, 2)}\n`, 'utf8')
  await rename(temporary, file)
  return trimmed
}

// History is read-modify-write. Serialize appends so two dispatches (or a
// dispatch plus a first-question send) cannot clobber each other's record.
let historyWrite = Promise.resolve()

function appendHistory(entry) {
  const task = historyWrite.then(() => writeHistoryEntry(entry))
  historyWrite = task.catch(() => {})
  return task
}

/* ------------------------------------------------------------------ */
/* plugin                                                              */
/* ------------------------------------------------------------------ */

/**
 * @param {import('cordis').Context} ctx
 * @param {Record<string, unknown>} [config]
 */
export function apply(ctx, config = {}) {
  const settings = {
    claudeCliPath: text(config.claudeCliPath, DEFAULTS.claudeCliPath),
    desktopAppPath: text(config.desktopAppPath, DEFAULTS.desktopAppPath),
    ccSwitchPath: text(config.ccSwitchPath, DEFAULTS.ccSwitchPath),
    permissionMode: normalizeMode(config.permissionMode, DEFAULTS.permissionMode),
    permissionPreset: text(config.permissionPreset, DEFAULTS.permissionPreset).trim() || DEFAULTS.permissionPreset,
    model: text(config.model, DEFAULTS.model).trim(),
    timeoutMs: clamp(Number(config.timeoutMs) || DEFAULTS.timeoutMs, 30_000, 1_800_000),
  }

  const cliCache = { path: '', version: '', checkedAt: 0, error: '' }
  const detectCache = { at: 0, value: null }
  const staticCache = { at: 0, value: null }
  const { jobs, start, serialize } = createJobs()

  const proxyInfo = () => {
    const claudeSettings = readClaudeSettings()
    return { url: claudeSettings.baseUrl, host: '', port: 0, reachable: false, local: true }
  }

  const acceptanceSettingsFile = path.join(dshHome(), 'claude-on-dsh', 'settings.json')
  const acceptanceSettings = {
    autoAcceptance: true,
    manualAcceptance: true,
    autoPrompt: true,
    defaultAction: 'none',
  }
  try {
    Object.assign(
      acceptanceSettings,
      JSON.parse(readFileSync(acceptanceSettingsFile, 'utf8').replace(/^\uFEFF/, '')),
    )
  } catch {}
  if (typeof acceptanceSettings.autoPrompt !== 'boolean') acceptanceSettings.autoPrompt = true
  if (!['claude', 'none'].includes(acceptanceSettings.defaultAction)) {
    acceptanceSettings.defaultAction = 'none'
  }

  const acceptanceOptions = {
    reportDir: (config.acceptance && config.acceptance.reportDir) || '.dsh/acceptance',
    allowedPaths:
      config.acceptance && Array.isArray(config.acceptance.allowedPaths)
        ? config.acceptance.allowedPaths
        : [],
    judgeRetries: Number((config.acceptance && config.acceptance.judgeRetries) ?? 2),
    judgeTimeoutMs: Number((config.acceptance && config.acceptance.judgeTimeoutMs) ?? 180_000),
    judgeInputMaxChars: Number((config.acceptance && config.acceptance.judgeInputMaxChars) ?? 24_000),
  }

  const judgeRunner = async ({ prompt, schema, systemPrompt, cwd, timeoutMs }) => {
    const executable = findCli(settings.claudeCliPath)
    if (!executable) {
      throw userError('没有找到 Claude Code CLI，无法进行验收判定', '请先确认 CLI 可用。', 500)
    }
    const run = startClaudeRun({
      executable,
      prompt,
      cwd,
      schema,
      systemPrompt,
      permissionMode: 'plan',
      model: settings.model,
      timeoutMs,
      proxy: proxyInfo(),
    })
    return run.promise
  }

  // The automatic (1.0.1-style) gate is opt-in via acceptance.legacyGate.
  // Manual acceptance — the panel's "立即验收", /acceptance/run, and
  // /acceptance/claude — always shares the same hooks object, so run/skip/status
  // exist in every mode. When the legacy gate is off we pin its policy to "off"
  // so no turn can trigger it, but manual runs still work.
  const legacyGate = Boolean(config && config.acceptance && config.acceptance.legacyGate === true)
  const gateConfig = legacyGate
    ? config
    : { ...config, acceptance: { ...(config.acceptance || {}), gatePolicy: 'off' } }
  const acceptance = attachAcceptance({
    ctx,
    config: gateConfig,
    runJudge: judgeRunner,
    logger: (line) => {
      try {
        ctx.logger?.info?.(line)
      } catch {
        console.log(line)
      }
    },
  })

  if (legacyGate) acceptance.setAuto(acceptanceSettings.autoAcceptance)

  async function runManualAcceptance(sessionId, opinion = '') {
    const inspected = await ctx.sessionController.inspect(sessionId, AbortSignal.timeout(60_000))
    const workspace = inspected.meta && inspected.meta.cwd
    if (!workspace) throw userError('会话缺少 workspace，无法验收', '', 400)
    return executeAcceptance({
      sessionId,
      meta: inspected.meta,
      events: inspected.events,
      workspace,
      gatePolicy: 'manual',
      runJudge: judgeRunner,
      options: { ...acceptanceOptions, opinion },
      logger: (line) => {
        try {
          ctx.logger?.info?.(`[claude-on-dsh:acceptance] ${line}`)
        } catch {
          console.log(line)
        }
      },
    })
  }

  const ACCEPTANCE_ID = /^session-[A-Za-z0-9-]+$/

  function recentConversation(events, limit = 8) {
    const lines = []
    for (const event of events) {
      if (event.type !== 'user/message' && event.type !== 'assistant/message') continue
      const data = event.data || {}
      if (data.source && data.source.kind && data.source.kind !== 'user' && data.source.kind !== 'claude-on-dsh') {
        continue
      }
      const parts = Array.isArray(data.content) ? data.content : []
      const text = parts
        .filter((part) => part && part.type === 'text')
        .map((part) => part.text)
        .join('\n')
        .trim()
      if (!text) continue
      lines.push(`${event.type === 'user/message' ? '用户' : 'DSH'}：${text.slice(0, 700)}`)
    }
    return lines.slice(-limit).join('\n---\n')
  }

  function lastAssistantText(events) {
    for (let index = events.length - 1; index >= 0; index -= 1) {
      const event = events[index]
      if (!event || event.type !== 'assistant/message') continue
      const data = event.data || {}
      const blocks = Array.isArray(data.content)
        ? data.content
        : Array.isArray(data.message && data.message.content)
          ? data.message.content
          : []
      const text = blocks
        .filter((part) => part && part.type === 'text')
        .map((part) => part.text)
        .join('\n')
        .trim()
      if (text) return text
    }
    return ''
  }

  async function runReview({ sessionId, meta, events, workspace, custom }) {
    const facts = buildFacts({ sessionId, meta, events, workspace })
    const context = [
      `项目目录：${workspace}`,
      `任务全文：${facts.task.summary || '未识别'}`,
      `最近对话：\n${recentConversation(events, 12) || '无'}`,
      `改动文件：${facts.changedFiles.slice(0, 30).map((file) => file.path).join(', ') || '无'}`,
      `测试/验证命令：${
        facts.commands
          .filter((command) => command.kind === 'verification')
          .slice(-8)
          .map(
            (command) =>
              `${command.command} -> ${command.isError ? '失败' : '成功'}${
                command.summary ? ` (${command.summary.slice(0, 300)})` : ''
              }`,
          )
          .join('\n') || '无'
      }`,
      `git：${
        facts.git && facts.git.available
          ? String(facts.git.status || '').slice(0, 1500)
          : '不可用'
      }`,
      `用户验收要求：${custom || '无'}`,
    ].join('\n\n')
    const prompt = [
      '你是独立验收者。请阅读项目与这次 DSH 会话的真实测试记录，给出验收意见。',
      '要求：',
      '- 结论 verdict 只能是 pass / fail / uncertain；',
      '- opinion 用自然语言说明实际验证了什么、哪些没有验证、是否回应了任务目标；',
      '- evidence 是关键证据数组，引用真实命令、输出、文件或 git 状态；',
      '- 无法验证的项必须标 uncertain，禁止猜 pass；',
      '- 如果用户给了验收要求，必须优先对照；',
      '',
      '上下文：',
      context,
      '',
      '输出 JSON { verdict, opinion, evidence }。',
    ].join('\n')
    const schema = {
      type: 'object',
      properties: {
        verdict: { type: 'string', enum: ['pass', 'fail', 'uncertain'] },
        opinion: { type: 'string' },
        evidence: { type: 'array', items: { type: 'string' } },
      },
      required: ['verdict', 'opinion', 'evidence'],
      additionalProperties: false,
    }
    const executable = findCli(settings.claudeCliPath)
    if (!executable) throw userError('没有找到 Claude Code CLI，无法生成验收意见', '', 500)
    const run = startClaudeRun({
      executable,
      prompt,
      cwd: workspace,
      schema,
      permissionMode: 'plan',
      model: 'haiku',
      timeoutMs: 120_000,
      proxy: proxyInfo(),
    })
    const result = await run.promise
    return result.data
  }

  const reviewPrompt = attachReviewPrompt({
    ctx,
    getSettings: () => acceptanceSettings,
    runReview,
    logger: (line) => {
      try {
        ctx.logger?.info?.(line)
      } catch {
        console.log(line)
      }
    },
  })

  async function runFirstQuestion(sessionId, requirement) {
    const inspected = await ctx.sessionController.inspect(sessionId, AbortSignal.timeout(60_000))
    const workspace = inspected.meta && inspected.meta.cwd
    if (!workspace) throw userError('会话缺少 workspace，无法读取项目', '', 400)
    const facts = await buildFacts({
      sessionId,
      meta: inspected.meta,
      events: inspected.events,
      workspace,
    })
    const context = [
      `任务全文：${facts.task.summary || '未识别'}`,
      `最近对话：\n${recentConversation(inspected.events, 8) || '无'}`,
      `改动文件：${facts.changedFiles.slice(0, 20).map((file) => file.path).join(', ') || '无'}`,
      `最近验证命令：${
        facts.commands
          .filter((command) => command.kind === 'verification')
          .slice(-4)
          .map((command) => `${command.command} -> ${command.isError ? '失败' : '成功'}`)
          .join('; ') || '无'
      }`,
      `git：${
        facts.git && facts.git.available
          ? String(facts.git.status || '').slice(0, 1500)
          : '不可用'
      }`,
    ].join('\n\n')
    const prompt = [
      '你在一个已经存在的 DSH 对话中接手。请先根据下面的上下文了解项目和之前的对话，',
      '再根据用户的新要求，生成一条「首问」消息，发回这个 DSH 对话。',
      '不要复述旧任务书，也不要重复最近对话；首问必须针对新要求提出新的、最关键的确认点。',
      '',
      '上下文：',
      context,
      '',
      `用户新要求：${requirement}`,
      '',
      '输出 JSON：',
      '- understanding：2-3 句，说明你从最近对话里了解到的现状（给用户看，不要复述旧任务）',
      '- question：一个最关键、最需要先确认的新问题',
      '- choices：0-4 个候选答案（可为空数组）',
      '- brief：发给 DSH 的完整消息，包含首问与必要背景，1-3 句，直接可回答/执行',
    ].join('\n')
    const schema = {
      type: 'object',
      properties: {
        understanding: { type: 'string' },
        question: { type: 'string' },
        choices: { type: 'array', items: { type: 'string' } },
        brief: { type: 'string' },
      },
      required: ['understanding', 'question', 'brief'],
      additionalProperties: false,
    }
    let understanding = ''
    let question = ''
    let brief = ''
    let choices = []
    const executable = findCli(settings.claudeCliPath)
    if (executable) {
      try {
        const run = startClaudeRun({
          executable,
          prompt,
          cwd: workspace,
          schema,
          permissionMode: 'plan',
          model: settings.model || 'haiku',
          timeoutMs: 120_000,
          proxy: proxyInfo(),
        })
        const result = await run.promise
        understanding = text(result.data.understanding).trim()
        question = text(result.data.question).trim()
        brief = text(result.data.brief).trim()
        choices = Array.isArray(result.data.choices)
          ? result.data.choices.map((choice) => text(choice).trim()).filter(Boolean).slice(0, 4)
          : []
      } catch (error) {
        try {
          ctx.logger?.warn?.(
            `first-question Claude failed: ${error.message}${error.hint ? ` | ${error.hint}` : ''}`,
          )
        } catch {}
        throw userError(
          'Claude 生成首问失败',
          `${error.message}${error.hint ? `：${error.hint}` : ''}`,
          502,
        )
      }
    }
    if (!question) {
      throw userError(
        'Claude 没有返回首问',
        executable ? '请重试；若持续失败，检查 Claude Code 的模型配置。' : '没有找到 Claude Code CLI。',
        502,
      )
    }
    if (!brief) brief = `[Claude 首问]\n${question}\n\n背景：${understanding}`
    return json({
      sessionId,
      understanding,
      question,
      brief,
      choices,
      draft: firstQuestionMessage({
        requirement,
        question,
        answer: '{{answer}}',
        brief,
      }),
      sent: false,
    })
  }

  function firstQuestionMessage({ requirement, question, answer, brief }) {
    const lines = ['[Claude 首问]']
    const request = text(requirement).trim()
    if (request) lines.push(`新要求：${request}`)
    lines.push(`首问：${question}`)
    lines.push(`用户回答：${answer}`)
    const background = text(brief).trim()
    if (background && background !== question.trim()) lines.push(`背景：${background}`)
    lines.push('请据此继续推进；只有遇到无法从上下文推断的阻塞项才提问。')
    return lines.join('\n')
  }

  async function sendFirstQuestionToSession(
    sessionId,
    question,
    answer,
    brief,
    requirement,
    projectDir,
    title,
    editedMessage,
  ) {
    let live = ctx.sessions.get(sessionId)
    if (!live) {
      try {
        await ctx.sessionController.resolveAgent(sessionId)
        live = ctx.sessions.get(sessionId)
      } catch {}
    }
    let permission = 'unchanged'
    if (live) {
      try {
        ctx.permissionPresets.set(live, 'danger-full-access')
        permission = ctx.permissionPresets.current(live)
      } catch {
        permission = 'custom'
      }
    }
    let workspace = expand(projectDir)
    if (!isDir(workspace)) {
      try {
        const inspected = await ctx.sessionController.inspect(sessionId, AbortSignal.timeout(20_000))
        workspace = inspected.meta && inspected.meta.cwd ? inspected.meta.cwd : ''
      } catch {
        workspace = ''
      }
    }
    // The handoff must carry the user's original requirement: the question and
    // answer alone rarely tell DSH what to build. The user can edit the final
    // message in the panel; otherwise compose the standard handoff.
    const message =
      text(editedMessage).trim() ||
      firstQuestionMessage({ requirement, question, answer, brief })
    reviewPrompt.arm(sessionId, {
      workspace,
      title: text(title).trim() || path.basename(workspace || ''),
      source: 'first-question',
    })
    await ctx.sessionController.prompt(
      {
        sessionId,
        requestId: randomUUID(),
        mode: 'queue',
        content: [{ type: 'text', text: message }],
        clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      AbortSignal.timeout(60_000),
    )
    // First-question sessions are real DSH conversations too: record them so
    // the acceptance list and `acceptancePayload` can resolve their workspace
    // after a reload instead of falling back to "no session".
    if (workspace) {
      const record = {
        id: randomUUID(),
        at: Date.now(),
        title: text(title).trim() || path.basename(workspace),
        projectDir: workspace,
        sessionId,
        workspaceId: '',
        engine: 'cli',
        chars: message.length,
        costUsd: null,
        durationMs: null,
        permission,
        source: 'first-question',
      }
      try {
        await appendHistory(record)
      } catch (error) {
        ctx.logger?.warn?.(`[claude-on-dsh] 无法写入首问历史：${messageOf(error)}`)
      }
    }
    return json({ sessionId, sent: true })
  }

  async function readAcceptanceFiles(workspace, sessionId) {
    if (!workspace || !ACCEPTANCE_ID.test(sessionId)) return { report: null, markdown: '', dir: '' }
    const dir = path.join(workspace, '.dsh', 'acceptance')
    try {
      const report = JSON.parse(await readFile(path.join(dir, `${sessionId}.json`), 'utf8'))
      let markdown = ''
      try {
        markdown = await readFile(path.join(dir, `${sessionId}.md`), 'utf8')
      } catch {}
      return { report, markdown, dir }
    } catch {
      return { report: null, markdown: '', dir }
    }
  }

  async function acceptancePayload(sessionId) {
    const state = acceptance.status(sessionId)
    const history = await readHistory()
    const entry = history.find((item) => item.sessionId === sessionId)
    const workspace = (state && state.workspace) || (entry && entry.projectDir) || ''
    const disk = await readAcceptanceFiles(workspace, sessionId)
    const report = (state && state.report) || disk.report
    return {
      sessionId,
      state: state || null,
      gatePolicy: acceptance.gatePolicy,
      workspace,
      report,
      markdown: disk.markdown,
      reportPath: report ? path.join(disk.dir, `${sessionId}.json`) : '',
      markdownPath: report ? path.join(disk.dir, `${sessionId}.md`) : '',
      title: entry ? entry.title : '',
    }
  }

  async function acceptanceList() {
    const history = await readHistory()
    const items = []
    const seen = new Set()
    for (const entry of history) {
      if (!entry.sessionId || !entry.projectDir) continue
      // Re-sending a first question appends another record for the same
      // conversation; the acceptance list is keyed by session, so show it once.
      if (seen.has(entry.sessionId)) continue
      const disk = await readAcceptanceFiles(entry.projectDir, entry.sessionId)
      if (!disk.report) continue
      seen.add(entry.sessionId)
      items.push({
        sessionId: entry.sessionId,
        title: entry.title || entry.projectDir,
        workspace: entry.projectDir,
        overall: disk.report.overall,
        status: disk.report.status,
        gatePolicy: disk.report.gatePolicy,
        generatedAt: disk.report.generatedAt,
        reportPath: path.join(disk.dir, `${entry.sessionId}.json`),
      })
      if (items.length >= 12) break
    }
    return items
  }

  function cliValue() {
    return {
      found: Boolean(cliCache.path),
      path: cliCache.path,
      version: cliCache.version,
      runnable: Boolean(cliCache.path) && /\.exe$/i.test(cliCache.path),
      error: cliCache.error,
    }
  }

  async function cliInfo() {
    const now = Date.now()
    // `findCli` stats a dozen paths and the version probe spawns a process;
    // both are stable for a minute, so reuse the cache without re-discovering.
    if (now - cliCache.checkedAt <= CLI_PROBE_TTL_MS) return cliValue()
    const path = findCli(settings.claudeCliPath)
    cliCache.path = path
    cliCache.checkedAt = now
    cliCache.version = ''
    cliCache.error = ''
    if (path) {
      const probe = await runProcess(path, ['--version'], { timeoutMs: 8_000 })
      const line = text(probe.stdout || probe.stderr)
        .trim()
        .split(/\r?\n/)
        .filter(Boolean)
        .pop()
      cliCache.version = line ?? ''
      if (probe.code !== 0 && !cliCache.version) cliCache.error = tail(probe.stderr, 300)
    }
    return cliValue()
  }

  async function detect() {
    const started = Date.now()
    if (detectCache.value && started - detectCache.at < DETECT_TTL_MS) return detectCache.value
    // Path discovery and settings reads are stable for a long time but touch
    // Program Files and the profile; only probe them once a minute. Live state
    // (proxy reachability, CC Switch attachment, CLI version) keeps the short
    // TTL so the status chips stay truthful.
    if (!staticCache.value || started - staticCache.at >= DETECT_STATIC_TTL_MS) {
      staticCache.value = {
        desktop: findDesktop(settings.desktopAppPath),
        ccSwitch: findCcSwitch(settings.ccSwitchPath),
        claudeSettings: readClaudeSettings(),
      }
      staticCache.at = started
    }
    const { desktop, ccSwitch, claudeSettings } = staticCache.value
    const [cli, proxy] = await Promise.all([cliInfo(), probeProxy(claudeSettings.baseUrl)])
    const liveState = readJsonSafe(ccSwitch.liveStatePath)
    const liveApps = liveState && liveState.apps && typeof liveState.apps === 'object' ? liveState.apps : null
    const appState = liveApps
      ? Object.fromEntries(
          Object.entries(liveApps).map(([key, value]) => [
            key,
            {
              mode: text(value && value.mode),
              attached: Boolean(value && value.attached),
            },
          ]),
        )
      : null
    const value = {
      platform: process.platform,
      node: process.version,
      cli,
      desktop: { found: Boolean(desktop.path), path: desktop.path, source: desktop.source },
      ccSwitch: {
        found: Boolean(ccSwitch.path),
        path: ccSwitch.path,
        liveStatePath: ccSwitch.liveStatePath,
        settingsPath: ccSwitch.settingsPath,
        apps: appState,
      },
      claudeSettings: {
        exists: claudeSettings.exists,
        path: claudeSettings.path,
        baseUrl: claudeSettings.baseUrl,
        hasAuthToken: claudeSettings.hasAuthToken,
        defaultMode: claudeSettings.defaultMode,
        models: claudeSettings.models,
      },
      proxy,
      dsh: {
        home: dshHome(),
        profile: text(process.env.DSH_PROFILE),
        profileDir: text(process.env.DSH_PROFILE_DIR),
      },
      config: {
        permissionMode: settings.permissionMode,
        model: settings.model,
        timeoutMs: settings.timeoutMs,
      },
      now: Date.now(),
    }
    detectCache.at = Date.now()
    detectCache.value = value
    return value
  }

  function beginClaude(kind, payload) {
    const exe = findCli(settings.claudeCliPath)
    if (!exe) {
      throw userError(
        '没有找到 Claude Code CLI',
        '请安装 Claude Code，或在 cordis.patch.yml 的本插件行里把 claudeCliPath 指向 claude.exe。',
      )
    }
    if (!/\.exe$/i.test(exe)) {
      throw userError(
        '找到的 Claude Code 是 .cmd 包装脚本，无法可靠地传递结构化参数',
        `请在配置中把 claudeCliPath 指向原生 claude.exe，例如：${path.join(
          text(process.env.APPDATA),
          'npm',
          'node_modules',
          '@anthropic-ai',
          'claude-code',
          'bin',
          'claude.exe',
        )}`,
      )
    }

    const projectDir = expand(payload.projectDir)
    const cwd = isDir(projectDir) ? projectDir : os.tmpdir()
    // The panel only offers the three read-ish modes. Never let a request body
    // smuggle in bypassPermissions/auto; an operator can still opt into those
    // through the plugin config, which this falls back to.
    const permissionMode = planningPermissionMode(payload.permissionMode, settings.permissionMode)
    const proxy = proxyInfo()
    if (kind === 'brief') {
      const goal = text(payload.goal).trim()
      if (goal.length < 4) throw userError('请先描述项目目标', '目标越具体，首问越准确。', 400)
      return startClaudeRun({
        executable: exe,
        prompt: buildBriefPrompt({
          projectName: text(payload.projectName).trim(),
          projectDir,
          goal,
        }),
        cwd,
        schema: BRIEF_SCHEMA,
        systemPrompt: COMMANDER_SYSTEM,
        permissionMode,
        model: settings.model,
        timeoutMs: settings.timeoutMs,
        proxy,
      })
    }

    const answer = text(payload.answer).trim()
    if (answer.length < 1) throw userError('请先回答 Claude 的首问', '', 400)
    const brief = payload.brief && typeof payload.brief === 'object' ? payload.brief : {}
    return startClaudeRun({
      executable: exe,
      prompt: buildRefinePrompt({
        projectName: text(payload.projectName).trim(),
        projectDir,
        goal: text(payload.goal).trim(),
        brief,
        answer,
      }),
      cwd,
      schema: REFINE_SCHEMA,
      systemPrompt: COMMANDER_SYSTEM,
      permissionMode,
      model: settings.model,
      timeoutMs: settings.timeoutMs,
      proxy,
    })
  }

  async function dispatch(payload) {
    const projectDir = expand(payload.projectDir)
    if (!projectDir) throw userError('缺少项目目录', '新项目需要一个已经存在的目录。', 400)
    if (!isDir(projectDir)) {
      throw userError(`项目目录不存在：${projectDir}`, '请先创建该目录，或在面板里重新选择。', 400)
    }
    const brief = text(payload.brief).trim()
    if (brief.length === 0) throw userError('交接任务为空', '请先生成或粘贴交接书。', 400)

    const title = text(payload.title).trim() || path.basename(projectDir)
    const workspace = await ctx.workspaceRegistry.create(projectDir, title)
    // The Session Controller accepts either a Workspace id or a cwd, never both:
    // the Workspace already owns the canonical project directory, so naming it
    // is what fixes the new Session's cwd.
    const created = await ctx.sessionController.create({ workspaceId: workspace.id })

    // `create` returns a live Session, but resolve the Agent explicitly so the
    // permission knobs and the prompt both address the activated Session.
    let live = ctx.sessions.get(created.sessionId)
    let activated = undefined
    if (!live) {
      const resolved = await ctx.sessionController.resolveAgent(created.sessionId)
      if (resolved && resolved.agent) activated = resolved.agent
      live = ctx.sessions.get(created.sessionId)
    }
    if (!live) {
      throw userError('DSH 已创建会话，但无法激活它', '请重试；若持续出现，请重启 DSH。', 500)
    }

    // Full access = the danger-full-access preset: danger-full-access sandbox
    // plus approval 'never'. Pin it before the first prompt so the first turn
    // already runs without approval prompts.
    let permission = settings.permissionPreset
    let permissionWarning = ''
    try {
      ctx.permissionPresets.set(live, permission)
      permission = ctx.permissionPresets.current(live)
    } catch (error) {
      permissionWarning = messageOf(error)
      try {
        if (!activated) {
          const resolved = await ctx.sessionController.resolveAgent(created.sessionId)
          if (resolved && resolved.agent) activated = resolved.agent
        }
        if (activated) ctx.approval.setPolicy(activated, 'never')
      } catch {}
      try {
        permission = ctx.permissionPresets.current(live)
      } catch {
        permission = 'custom'
      }
    }

    const requestId = randomUUID()
    // Arm before admission so the hook cannot miss the running -> idle edge.
    reviewPrompt.arm(created.sessionId, { workspace: projectDir, title: workspace.title, source: 'dispatch' })
    // prompt's second argument is the required admission AbortSignal.
    try {
      await ctx.sessionController.prompt(
        {
          sessionId: created.sessionId,
          requestId,
          mode: 'queue',
          content: [{ type: 'text', text: brief }],
          clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        AbortSignal.timeout(60_000),
      )
    } catch (error) {
      reviewPrompt.disarm(created.sessionId)
      throw error
    }

    const record = {
      id: randomUUID(),
      at: Date.now(),
      title: workspace.title,
      projectDir,
      sessionId: created.sessionId,
      workspaceId: workspace.id,
      engine: text(payload.engine) === 'desktop' ? 'desktop' : 'cli',
      chars: brief.length,
      costUsd: typeof payload.costUsd === 'number' ? payload.costUsd : null,
      durationMs: typeof payload.durationMs === 'number' ? payload.durationMs : null,
      permission,
    }
    try {
      await appendHistory(record)
    } catch (error) {
      ctx.logger?.warn?.(`[claude-on-dsh] 无法写入历史：${messageOf(error)}`)
    }
    return {
      sessionId: created.sessionId,
      workspaceId: workspace.id,
      workspaceTitle: workspace.title,
      permission,
      permissionWarning,
      record,
    }
  }

  function launchDetached(executable, args = []) {
    const child = spawn(executable, args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    })
    // Detached spawn failures arrive asynchronously; without a listener Node
    // would raise an uncaught exception inside the Host process.
    child.on('error', () => {})
    child.unref()
    return child.pid ?? 0
  }

  function findWt() {
    const local = text(process.env.LOCALAPPDATA)
    const candidate = local ? path.join(local, 'Microsoft', 'WindowsApps', 'wt.exe') : ''
    return candidate && isFile(candidate) ? candidate : ''
  }

  /**
   * Open an interactive Claude Code terminal in the project so the human can
   * watch Claude inspect, run tests, and write a visible acceptance report.
   */
  async function openReviewTerminal({ dir, goal, focus }) {
    const executable = findCli(settings.claudeCliPath)
    if (!executable) {
      throw userError('没有找到 Claude Code CLI，无法启动可见验收', '请先确认 CLI 可用。', 500)
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const reportPath = path.join(dir, '.dsh', 'acceptance', `visible-${stamp}.md`)
    await mkdir(path.dirname(reportPath), { recursive: true })
    const base = path.join(os.tmpdir(), `claude-on-dsh-review-${randomUUID()}`)
    const systemFile = `${base}-system.txt`
    const promptFile = `${base}-prompt.txt`
    const script = `${base}.ps1`
    const system = [
      '你是独立验收员，不参与实现，也不采信执行代理的自我汇报。',
      '只依据项目文件、git 状态和你实际运行的命令输出做判断。',
      '每条 pass/fail 必须给出可定位证据（文件路径 + 行号，或命令 + 输出片段）。',
      '无法验证的项标 uncertain，禁止猜测。',
    ].join('\n')
    const prompt = [
      `请对项目做独立验收：${dir}`,
      '',
      `任务背景 / 目标：${goal || '未提供，请按项目现状判断'}`,
      `验收重点：${focus || '改动是否回应目标、构建/测试/lint 是否通过、是否越权改动无关文件'}`,
      '',
      '执行要求：',
      '1. 阅读项目与 git 状态，列出实际改动文件；',
      '2. 运行可用的构建/测试/lint，记录真实命令、输出与退出码；',
      '3. 逐项给出 pass / fail / uncertain 与证据；无法验证的项必须标 uncertain；',
      '4. 把验收报告写入下面的 Markdown 文件，并在终端打印结论与关键证据：',
      `   ${reportPath}`,
    ].join('\n')
    await writeFile(systemFile, system, 'utf8')
    await writeFile(promptFile, prompt, 'utf8')
    const quote = (value) => `'${String(value).replace(/'/g, "''")}'`
    const ps = [
      "$ErrorActionPreference = 'Continue'",
      `Set-Location -LiteralPath ${quote(dir)}`,
      `$system = Get-Content -LiteralPath ${quote(systemFile)} -Raw -Encoding UTF8`,
      `$prompt = Get-Content -LiteralPath ${quote(promptFile)} -Raw -Encoding UTF8`,
      `& ${quote(executable)} --append-system-prompt $system $prompt`,
      "Write-Host ''",
      "Read-Host '按 Enter 关闭窗口'",
      `Remove-Item -LiteralPath ${[systemFile, promptFile, script].map(quote).join(', ')} -Force -ErrorAction SilentlyContinue`,
    ].join('\n')
    await writeFile(script, ps, 'utf8')
    const wt = findWt()
    const pid = wt
      ? launchDetached(wt, [
          'new-tab',
          '--title',
          'Claude 验收',
          'powershell.exe',
          '-NoExit',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          script,
        ])
      : launchDetached('cmd.exe', [
          '/d',
          '/s',
          '/c',
          'start',
          '""',
          'powershell.exe',
          '-NoExit',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          `"${script}"`,
        ])
    return { pid, script, reportPath, executable }
  }

  async function copyToClipboard(value) {
    // `clip.exe` decodes stdin with the console code page, which garbles
    // non-ASCII text written as UTF-8. Write a UTF-8 file and let PowerShell
    // read it with an explicit encoding instead.
    const file = path.join(os.tmpdir(), `claude-on-dsh-${randomUUID()}.txt`)
    await writeFile(file, value, 'utf8')
    try {
      const powershell = path.join(
        text(process.env.SystemRoot, 'C:\\Windows'),
        'System32',
        'WindowsPowerShell',
        'v1.0',
        'powershell.exe',
      )
      const literal = file.replace(/'/g, "''")
      const script = [
        "$ErrorActionPreference = 'Stop'",
        `$text = Get-Content -LiteralPath '${literal}' -Raw -Encoding UTF8`,
        'Set-Clipboard -Value $text',
      ].join('; ')
      const result = await runProcess(powershell, ['-NoProfile', '-NonInteractive', '-STA', '-Command', script], {
        timeoutMs: 15_000,
      })
      if (result.code !== 0) {
        throw new Error(tail(result.stderr, 300) || `powershell 退出码 ${result.code}`)
      }
    } finally {
      try {
        await unlink(file)
      } catch {}
    }
  }

  function openDesktop() {
    const desktop = findDesktop(settings.desktopAppPath)
    if (!desktop.path) {
      throw userError(
        '没有找到 Claude 桌面版',
        '请在 cordis.patch.yml 的本插件行里设置 desktopAppPath。',
      )
    }
    try {
      return { pid: launchDetached(desktop.path), path: desktop.path }
    } catch (error) {
      // MSIX packages sometimes refuse a direct spawn; the shell `start`
      // activation path still reaches the same executable.
      try {
        return {
          pid: launchDetached('cmd.exe', ['/d', '/s', '/c', 'start', '""', `"${desktop.path}"`]),
          path: desktop.path,
        }
      } catch {
        throw userError('无法启动 Claude 桌面版', messageOf(error))
      }
    }
  }

  function openCcSwitch() {
    const ccSwitch = findCcSwitch(settings.ccSwitchPath)
    if (!ccSwitch.path) {
      throw userError('没有找到 CC Switch', '请在 cordis.patch.yml 里设置 ccSwitchPath。')
    }
    return { pid: launchDetached(ccSwitch.path), path: ccSwitch.path }
  }

  async function readBody(request) {
    const raw = await request.text()
    if (!raw || raw.trim() === '') return {}
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      throw userError('请求体不是合法 JSON', '', 400)
    }
  }

  function endpoint(handler) {
    return async (request) => {
      try {
        return await handler(request)
      } catch (error) {
        const status = Number(error && error.status) || 500
        if (status >= 500) {
          ctx.logger?.warn?.(`[claude-on-dsh] ${messageOf(error)}`)
        }
        return json(
          {
            error: {
              message: messageOf(error),
              hint: text(error && error.hint),
            },
          },
          status,
        )
      }
    }
  }

  const routes = [
    {
      path: '/detect',
      methods: ['GET'],
      handler: endpoint(async () => json(await detect())),
    },
    {
      path: '/jobs',
      methods: ['GET', 'POST'],
      handler: endpoint(async (request) => {
        if (request.method === 'GET') {
          const id = new URL(request.url).searchParams.get('id') ?? ''
          const job = jobs.get(id)
          if (!job) throw userError('任务不存在或已被清理', '', 404)
          return json({ job: serialize(job) })
        }
        const body = await readBody(request)
        const kind = text(body.kind)
        if (kind !== 'brief' && kind !== 'refine') throw userError('未知的任务类型')
        const job = start(kind, () => beginClaude(kind, body))
        return json({ job: serialize(job) })
      }),
    },
    {
      path: '/jobs/cancel',
      methods: ['POST'],
      handler: endpoint(async (request) => {
        const body = await readBody(request)
        const job = jobs.get(text(body.id))
        if (!job) throw userError('任务不存在', '', 404)
        job.cancel?.()
        return json({ ok: true })
      }),
    },
    {
      path: '/dispatch',
      methods: ['POST'],
      handler: endpoint(async (request) => {
        const body = await readBody(request)
        return json(await dispatch(body))
      }),
    },
    {
      path: '/archive',
      methods: ['POST'],
      handler: endpoint(async (request) => {
        const body = await readBody(request)
        const sessionId = text(body.sessionId).trim()
        if (!sessionId) throw userError('缺少会话 id')
        await ctx.workspaceRegistry.archiveSession(sessionId, { stopActivity: true })
        return json({ ok: true })
      }),
    },
    {
      path: '/history',
      methods: ['GET'],
      handler: endpoint(async () => json({ items: await readHistory() })),
    },
    {
      path: '/desktop',
      methods: ['POST'],
      handler: endpoint(async (request) => {
        const body = await readBody(request)
        const brief = text(body.brief)
        let copied = false
        if (brief.trim() !== '') {
          try {
            await copyToClipboard(brief)
            copied = true
          } catch {
            copied = false
          }
        }
        const launched = body.launch === false ? { pid: 0, path: '' } : openDesktop()
        return json({ launched: Boolean(launched.pid), path: launched.path, copied })
      }),
    },
    {
      path: '/cc-switch',
      methods: ['POST'],
      handler: endpoint(async () => json({ launched: true, ...openCcSwitch() })),
    },
    {
      path: '/prompt',
      methods: ['POST'],
      handler: endpoint(async (request) => {
        const body = await readBody(request)
        const prompt = buildDesktopPrompt({
          projectName: text(body.projectName),
          projectDir: text(body.projectDir),
          goal: text(body.goal),
        })
        return json({ prompt })
      }),
    },
    {
      path: '/acceptance',
      methods: ['GET'],
      handler: endpoint(async (request) => {
        const id = new URL(request.url).searchParams.get('id') || ''
        if (!id) throw userError('缺少会话 id')
        return json(await acceptancePayload(id))
      }),
    },
    {
      path: '/acceptance/list',
      methods: ['GET'],
      handler: endpoint(async () => json({ gatePolicy: acceptance.gatePolicy, items: await acceptanceList() })),
    },
    {
      path: '/acceptance/run',
      methods: ['POST'],
      handler: endpoint(async (request) => {
        const body = await readBody(request)
        const sessionId = text(body.sessionId).trim()
        if (!sessionId) throw userError('缺少会话 id')
        // Fire-and-forget: the panel polls /acceptance for state/report.
        acceptance.runManual(sessionId).catch(() => {})
        return json({ started: true, sessionId })
      }),
    },
    {
      path: '/acceptance/skip',
      methods: ['POST'],
      handler: endpoint(async (request) => {
        const body = await readBody(request)
        const sessionId = text(body.sessionId).trim()
        if (!sessionId) throw userError('缺少会话 id')
        acceptance.skip(sessionId)
        return json({ skipped: true, sessionId })
      }),
    },
    {
      path: '/acceptance/terminal',
      methods: ['POST'],      handler: endpoint(async (request) => {
        const body = await readBody(request)
        const dir = expand(body.projectDir)
        if (!dir) throw userError('缺少项目目录', '直接验收需要一个项目目录。', 400)
        if (!isDir(dir)) throw userError(`项目目录不存在：${dir}`, '请先创建或选择目录。', 400)
        let sessionId = text(body.sessionId).trim()
        if (!sessionId) {
          const history = await readHistory()
          const entry = history.find((item) => item.projectDir === dir && item.sessionId)
          if (entry) sessionId = entry.sessionId
        }
        // Claude wrote the first question and the handoff; reuse that task
        // rather than asking the user to retype the context.
        let goal = text(body.goal).trim()
        if (sessionId) {
          const disk = await readAcceptanceFiles(dir, sessionId)
          if (disk.report && disk.report.task && disk.report.task.summary) {
            goal = disk.report.task.summary
          } else {
            try {
              const inspected = await ctx.sessionController.inspect(
                sessionId,
                AbortSignal.timeout(20_000),
              )
              const task = extractTask(inspected.events)
              if (task.summary) goal = task.summary
            } catch {}
          }
        }
        const result = await openReviewTerminal({
          dir,
          goal,
          focus: text(body.focus).trim(),
        })
        return json({ launched: Boolean(result.pid), sessionId, ...result })
      }),
    },
    {
      path: '/acceptance/dispatch',
      methods: ['POST'],
      handler: endpoint(async (request) => {
        const body = await readBody(request)
        const dir = expand(body.projectDir)
        if (!dir) throw userError('缺少项目目录', '交给 DSH 验收需要一个项目目录。', 400)
        if (!isDir(dir)) throw userError(`项目目录不存在：${dir}`, '请先创建或选择目录。', 400)
        let sessionId = text(body.sessionId).trim()
        if (!sessionId) {
          const history = await readHistory()
          const entry = history.find((item) => item.projectDir === dir && item.sessionId)
          if (!entry) {
            throw userError(
              '找不到该项目首问创建的 DSH 会话',
              '请在「验收对象」里选择该项目的派发记录；验收必须回到原会话。',
              400,
            )
          }
          sessionId = entry.sessionId
        }
        let goal = text(body.goal).trim()
        if (sessionId) {
          const payload = await acceptancePayload(sessionId)
          if (payload.report && payload.report.task && payload.report.task.summary) {
            goal = payload.report.task.summary
          } else {
            try {
              const inspected = await ctx.sessionController.inspect(sessionId, AbortSignal.timeout(20_000))
              const task = extractTask(inspected.events)
              if (task.summary) goal = task.summary
            } catch {}
          }
        }
        const opinion = text(body.opinion).trim()
        if (opinion) goal = `${goal}${goal ? '\n\n' : ''}用户验收意见：${opinion}`
        const titleBase = path.basename(dir)
        const reportPath = path.join(dir, '.dsh', 'acceptance', 'dsh-验收.md')
        const executable = findCli(settings.claudeCliPath)
        const schema = {
          type: 'object',
          properties: { title: { type: 'string' }, brief: { type: 'string' } },
          required: ['title', 'brief'],
          additionalProperties: false,
        }
        const prompt = [
          '你是验收指挥。请为下面的项目写一份交给 DSH 执行代理的验收任务书。',
          `项目目录：${dir}`,
          `任务背景：${goal || '未提供，请按项目现状验收'}`,
          '要求 DSH：实际读取项目与 git 状态；运行可用的构建/测试/lint 并记录真实输出；',
          '逐项给出 pass / fail / uncertain 与证据；无法验证的项标 uncertain，禁止猜 pass；',
          `把报告写入 ${reportPath}，并在会话中给出结论。`,
          'brief 必须自包含、可直接执行，不要依赖追问；输出 JSON { title, brief }。',
        ].join('\n')
        let brief = ''
        let title = ''
        if (executable) {
          try {
            const run = startClaudeRun({
              executable,
              prompt,
              cwd: dir,
              schema,
              permissionMode: 'plan',
              model: 'haiku',
              timeoutMs: 120_000,
              proxy: proxyInfo(),
            })
            const result = await run.promise
            brief = text(result.data.brief).trim()
            title = text(result.data.title).trim()
          } catch {}
        }
        if (!brief) {
          title = `验收：${titleBase}`
          brief = [
            `请对项目做独立验收：${dir}`,
            '',
            `任务背景：${goal || '未提供，请按项目现状判断'}`,
            '',
            '要求：',
            '1. 读取项目与 git 状态，列出实际改动文件；',
            '2. 运行可用的构建/测试/lint，记录真实命令、输出与退出码；',
            '3. 逐项给出 pass / fail / uncertain 与证据；无法验证的项标 uncertain，禁止猜 pass；',
            `4. 把验收报告写入 ${reportPath}，并在会话中给出结论与关键证据。`,
          ].join('\n')
        }
        // Acceptance belongs to the ORIGINAL DSH conversation. Show the
        // generated brief for editing first; sending is a separate action.
        return json({
          sessionId,
          workspaceTitle: path.basename(dir),
          title,
          brief,
          reportPath,
          sent: false,
        })
      }),
    },
    {
      path: '/acceptance/dispatch/send',
      methods: ['POST'],
      handler: endpoint(async (request) => {
        const body = await readBody(request)
        const sessionId = text(body.sessionId).trim()
        const message = text(body.message).trim()
        if (!sessionId) throw userError('缺少要验收的 DSH 会话')
        if (!message) throw userError('发送内容为空', '请先生成或填写验收内容。', 400)
        let live = ctx.sessions.get(sessionId)
        let resolvedAgent
        if (!live) {
          try {
            const resolved = await ctx.sessionController.resolveAgent(sessionId)
            if (resolved && resolved.agent) resolvedAgent = resolved.agent
            live = ctx.sessions.get(sessionId)
          } catch {}
        }
        if (live) {
          try {
            ctx.permissionPresets.set(live, 'danger-full-access')
          } catch {}
        } else if (resolvedAgent) {
          try {
            ctx.approval.setPolicy(resolvedAgent, 'never')
          } catch {}
        }
        await ctx.sessionController.prompt(
          {
            sessionId,
            requestId: randomUUID(),
            mode: 'queue',
            content: [{ type: 'text', text: message }],
            clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          AbortSignal.timeout(60_000),
        )
        return json({ sessionId, sent: true })
      }),
    },
    {
      path: '/acceptance/claude',
      methods: ['POST'],
      handler: endpoint(async (request) => {
        const body = await readBody(request)
        const sessionId = text(body.sessionId).trim()
        if (!sessionId) throw userError('缺少会话 id')
        const result = await runManualAcceptance(sessionId, text(body.opinion).trim())
        return json({
          report: result.report,
          paths: result.paths,
          writeError: result.writeError,
        })
      }),
    },
    {
      path: '/sessions',
      methods: ['GET'],
      handler: endpoint(async () => {
        const result = await ctx.sessionController.list({}, AbortSignal.timeout(20_000))
        const items = (result.items || [])
          .filter((item) => item.cwd && !item.origin && !item.blank)
          .map((item) => ({
            sessionId: item.sessionId,
            cwd: item.cwd,
            updatedAt: item.updatedAt,
            running: Boolean(item.running),
          }))
        return json({ items })
      }),
    },
    {
      path: '/session/first-question',
      methods: ['POST'],
      handler: endpoint(async (request) => {
        const body = await readBody(request)
        const sessionId = text(body.sessionId).trim()
        const requirement = text(body.requirement).trim()
        if (!sessionId) throw userError('请选择已有 DSH 对话')
        if (!requirement) throw userError('请填写新要求')
        return runFirstQuestion(sessionId, requirement)
      }),
    },
    {
      path: '/session/first-question/send',
      methods: ['POST'],
      handler: endpoint(async (request) => {
        const body = await readBody(request)
        const sessionId = text(body.sessionId).trim()
        const question = text(body.question).trim()
        const answer = text(body.answer).trim()
        const brief = text(body.brief).trim()
        const requirement = text(body.requirement).trim()
        const projectDir = text(body.projectDir).trim()
        const title = text(body.title).trim()
        const message = text(body.message).trim()
        if (!sessionId) throw userError('请选择已有 DSH 对话')
        if (!question) throw userError('缺少 Claude 的首问')
        if (!answer && !message) throw userError('请先回答 Claude 的首问，或编辑要发送的内容')
        return sendFirstQuestionToSession(
          sessionId,
          question,
          answer,
          brief,
          requirement,
          projectDir,
          title,
          message,
        )
      }),
    },
    {
      path: '/settings',
      methods: ['GET', 'POST'],
      handler: endpoint(async (request) => {
        if (request.method === 'POST') {
          const body = await readBody(request)
          if (typeof body.autoAcceptance === 'boolean') {
            acceptanceSettings.autoAcceptance = body.autoAcceptance
          }
          if (typeof body.manualAcceptance === 'boolean') {
            acceptanceSettings.manualAcceptance = body.manualAcceptance
          }
          if (typeof body.autoPrompt === 'boolean') {
            acceptanceSettings.autoPrompt = body.autoPrompt
          }
          if (body.defaultAction === 'claude' || body.defaultAction === 'none') {
            acceptanceSettings.defaultAction = body.defaultAction
          }
          await mkdir(path.dirname(acceptanceSettingsFile), { recursive: true })
          await writeFile(
            acceptanceSettingsFile,
            `${JSON.stringify(acceptanceSettings, null, 2)}\n`,
            'utf8',
          )
          acceptance.setAuto(legacyGate && acceptanceSettings.autoAcceptance)
        }
        return json(acceptanceSettings)
      }),
    },
  ]

  for (const route of routes) {
    ctx.effect(
      () =>
        ctx.connection.fetch.register({
          path: `${ROUTE}${route.path}`,
          methods: route.methods,
          requestBody: 'buffered',
          fetch: route.handler,
        }),
      `claude-on-dsh: ${route.methods.join('/')} ${route.path}`,
    )
  }
}
