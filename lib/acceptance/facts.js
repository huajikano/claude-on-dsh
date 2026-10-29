/**
 * Evidence normalization: turn a Session event stream + the workspace's git
 * state into a stable, model-readable facts object. No conclusions live here.
 */
import { execFileSync } from 'node:child_process'
import { clip, redact } from './contract.js'

const COMMAND_TOOLS = new Set(['bash', 'pwsh', 'shell', 'exec'])
const WRITE_TOOLS = new Set(['write', 'edit'])
const BUILD_TEST_RE =
  /(?:^|\s)(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?(?:test|build|lint|typecheck)|\bnode\s+--test\b|\bnode\s+--check\b|\b(?:pytest|go\s+test|cargo\s+test|dotnet\s+test|mvn\s+test|gradle\s+test)\b|\b(?:tsc|eslint|oxlint|ruff|mypy)\b/i
const FAILURE_RE = /\b(?:FAIL(?:ED)?|AssertionError|error\s+TS\d+|Traceback|not ok)\b/

export function textOfContent(content) {
  if (!Array.isArray(content)) return ''
  return content
    .filter((part) => part && part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('\n')
}

export function extractTask(events) {
  for (const event of events) {
    if (event.type !== 'user/message') continue
    const data = event.data ?? {}
    if (data.source && data.source.kind !== 'user') continue
    const text = textOfContent(data.content).trim()
    if (text.length === 0) continue
    return { summary: clip(text, 4000), sourceSeq: event.seq, text }
  }
  return { summary: '', sourceSeq: null, text: '' }
}

export function extractAssistantFinal(events) {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]
    if (event.type !== 'assistant/message') continue
    const text = textOfContent(event.data && event.data.message && event.data.message.content).trim()
    if (text.length > 0) return { text: clip(text, 2000), sourceSeq: event.seq }
  }
  return { text: '', sourceSeq: null }
}

function parseArguments(raw) {
  if (typeof raw !== 'string') return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function extractCommands(events) {
  const calls = new Map()
  for (const event of events) {
    if (event.type === 'tool/call') calls.set(event.data.callId, event)
  }
  const commands = []
  for (const event of events) {
    if (event.type !== 'tool/result') continue
    const data = event.data ?? {}
    const message = data.message ?? {}
    const call = calls.get(message.toolCallId)
    if (!call) continue
    if (!COMMAND_TOOLS.has(call.data.name)) continue
    const args = parseArguments(call.data.arguments)
    const command = typeof args.command === 'string' ? args.command : ''
    if (command.trim() === '') continue
    const output = textOfContent(message.content)
    const summaryLines = output
      .split(/\r?\n/)
      .filter((line) => /^\s*(?:[ℹ#]\s*(?:tests|pass|fail|cancelled|skipped|todo|duration_ms)|Tests?:|Test Suites?:|\d+\s+passing|\d+\s+failing)/i.test(line))
    commands.push({
      tool: call.data.name,
      command: redact(command),
      output: clip(output, 1200),
      outputTail: clip(output.slice(-1000), 1000),
      summary: clip(summaryLines.slice(-8).join('\n'), 800),
      outputLength: output.length,
      isError: Boolean(message.isError),
      callSeq: call.seq,
      resultSeq: event.seq,
      turn: call.data.turn,
      step: call.data.step,
      kind: BUILD_TEST_RE.test(command) ? 'verification' : 'other',
      failedMarkers: FAILURE_RE.test(output),
    })
  }
  return commands
}

export function extractFileOps(events) {
  const results = new Map()
  for (const event of events) {
    if (event.type === 'tool/result') {
      const message = event.data && event.data.message
      if (message) results.set(message.toolCallId, Boolean(message.isError))
    }
  }
  const ops = []
  for (const event of events) {
    if (event.type !== 'tool/call') continue
    if (!WRITE_TOOLS.has(event.data.name)) continue
    const args = parseArguments(event.data.arguments)
    const filePath = typeof args.file_path === 'string' ? args.file_path : ''
    if (filePath.trim() === '') continue
    ops.push({
      path: filePath,
      tool: event.data.name,
      isError: results.get(event.data.callId) ?? null,
      seq: event.seq,
      turn: event.data.turn,
    })
  }
  return ops
}

function git(workspace, args) {
  return execFileSync('git', ['-C', workspace, ...args], {
    encoding: 'utf8',
    timeout: 15_000,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function unquote(value) {
  const trimmed = value.trim()
  return trimmed.startsWith('"') && trimmed.endsWith('"') ? trimmed.slice(1, -1).replace(/\\"/g, '"') : trimmed
}

export function readGit(workspace) {
  try {
    const status = git(workspace, ['status', '--porcelain=v1', '--untracked-files=all'])
    const diff = git(workspace, ['diff', '--name-status', 'HEAD'])
    const head = git(workspace, ['rev-parse', 'HEAD']).trim()
    const files = []
    for (const line of status.split(/\r?\n/)) {
      if (line.trim() === '') continue
      const code = line.slice(0, 2)
      let rest = line.slice(3)
      if (rest.includes(' -> ')) rest = rest.split(' -> ').pop()
      files.push({ path: unquote(rest), status: code.trim() || '??', source: 'git' })
    }
    for (const line of diff.split(/\r?\n/)) {
      if (line.trim() === '') continue
      const [code, ...rest] = line.split('\t')
      if (rest.length === 0) continue
      const filePath = unquote(rest[rest.length - 1])
      if (!files.some((entry) => entry.path === filePath)) {
        files.push({ path: filePath, status: code.trim(), source: 'git-diff' })
      }
    }
    return { available: true, head, files, statusOutput: clip(status, 2000), error: '' }
  } catch (error) {
    return { available: false, head: '', files: [], statusOutput: '', error: redact(error.message) }
  }
}

export function buildFacts({ sessionId, meta, events, workspace, now = Date.now() }) {
  const task = extractTask(events)
  const assistant = extractAssistantFinal(events)
  const commands = extractCommands(events)
  const fileOps = extractFileOps(events)
  const gitState = readGit(workspace)
  const turnEnds = events.filter((event) => event.type === 'turn/end')
  const lastTurn = turnEnds.length > 0 ? turnEnds[turnEnds.length - 1] : undefined
  const missing = []
  if (!gitState.available) missing.push('git-state-unavailable')
  if (task.text === '') missing.push('task-goal-missing')
  if (!commands.some((command) => command.kind === 'verification')) missing.push('build-test-output-missing')
  const changed = new Map()
  for (const file of gitState.files) changed.set(file.path, file)
  for (const op of fileOps) {
    if (!changed.has(op.path)) changed.set(op.path, { path: op.path, status: op.tool, source: 'tool', seq: op.seq })
  }
  return {
    sessionId,
    workspace,
    meta,
    now,
    task,
    assistant,
    commands,
    fileOps,
    git: gitState,
    changedFiles: [...changed.values()],
    end: {
      status: lastTurn ? (lastTurn.data && lastTurn.data.reason && lastTurn.data.reason.kind) || 'unknown' : 'unknown',
      turns: turnEnds.length,
      lastSeq: events.length > 0 ? events[events.length - 1].seq : null,
    },
    missing,
    eventCount: events.length,
  }
}
