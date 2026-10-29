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
  if (!baseUrl) return { url: '', host: '', port: 0, reachable: false, local: true }
  let parsed
  try {
    parsed = new URL(baseUrl)
  } catch {
    return { url: baseUrl, host: '', port: 0, reachable: false, local: true }
  }
  const host = parsed.hostname
  const local = host === '127.0.0.1' || host === 'localhost' || host === '::1'
  const port = parsed.port ? Number(parsed.port) : parsed.protocol === 'https:' ? 443 : 80
  const reachable = local ? await probeTcp(host, port) : false
  return { url: baseUrl, host, port, reachable, local }
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
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry === 'object') : []
  } catch {
    return []
  }
}

async function appendHistory(entry) {
  const list = await readHistory()
  list.unshift(entry)
  const trimmed = list.slice(0, HISTORY_KEEP)
  const file = historyFile()
  await mkdir(path.dirname(file), { recursive: true })
  const temporary = `${file}.${process.pid}.tmp`
  await writeFile(temporary, `${JSON.stringify(trimmed, null, 2)}\n`, 'utf8')
  await rename(temporary, file)
  return trimmed
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
  const { jobs, start, serialize } = createJobs()

  const proxyInfo = () => {
    const claudeSettings = readClaudeSettings()
    return { url: claudeSettings.baseUrl, host: '', port: 0, reachable: false, local: true }
  }

  // Acceptance Gate: the hook only observes armed sessions and never throws
  // into the Session lifecycle. The judge reuses the same unattended CLI run
  // in read-only plan mode, so acceptance can never modify the project.
  const acceptance = attachAcceptance({
    ctx,
    config,
    runJudge: async ({ prompt, schema, systemPrompt, cwd, timeoutMs }) => {
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
    },
    logger: (line) => {
      try {
        ctx.logger?.info?.(line)
      } catch {
        console.log(line)
      }
    },
  })

  async function cliInfo() {
    const path = findCli(settings.claudeCliPath)
    if (path !== cliCache.path || Date.now() - cliCache.checkedAt > CLI_PROBE_TTL_MS) {
      cliCache.path = path
      cliCache.checkedAt = Date.now()
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
    }
    return {
      found: Boolean(path),
      path,
      version: cliCache.version,
      runnable: Boolean(path) && /\.exe$/i.test(path),
      error: cliCache.error,
    }
  }

  async function detect() {
    if (detectCache.value && Date.now() - detectCache.at < DETECT_TTL_MS) return detectCache.value
    const cli = await cliInfo()
    const desktop = findDesktop(settings.desktopAppPath)
    const ccSwitch = findCcSwitch(settings.ccSwitchPath)
    const liveState = readJsonSafe(ccSwitch.liveStatePath)
    const claudeSettings = readClaudeSettings()
    const proxy = await probeProxy(claudeSettings.baseUrl)
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
    const permissionMode = normalizeMode(payload.permissionMode, settings.permissionMode)
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
    acceptance.arm(created.sessionId, { workspace: projectDir, title: workspace.title, source: 'dispatch' })
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
      acceptance.disarm(created.sessionId)
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
