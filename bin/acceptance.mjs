#!/usr/bin/env node
/**
 * Manual acceptance entry (equivalent fallback for /acceptance run):
 *
 *   node bin/acceptance.mjs run <sessionId> [--no-judge] [--allow <glob>] [--dir .dsh/acceptance]
 *
 * Reads the persisted Session log, builds the same facts/checkers, asks the
 * local Claude Code CLI for the verdict, and writes the report. The Host hook
 * calls the very same kernel, so both paths share one acceptance contract.
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { executeAcceptance } from '../lib/acceptance/kernel.js'
import { findSessionLog, readSessionLog } from '../lib/acceptance/session-log.js'

function parseArgs(argv) {
  const options = { judge: true, allowedPaths: [], reportDir: '.dsh/acceptance', judgeRetries: 2 }
  const positional = []
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--no-judge') options.judge = false
    else if (arg === '--no-retry') options.judgeRetries = 0
    else if (arg === '--dir') options.reportDir = argv[++index]
    else if (arg === '--allow') options.allowedPaths.push(argv[++index])
    else if (arg.startsWith('--')) throw new Error(`unknown option ${arg}`)
    else positional.push(arg)
  }
  return { options, positional }
}

function findClaude() {
  const appData = process.env.APPDATA || ''
  const candidates = [
    appData ? path.join(appData, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude.exe') : '',
    appData ? path.join(appData, 'npm', 'claude.cmd') : '',
    path.join(os.homedir(), '.local', 'bin', 'claude.exe'),
  ]
  return candidates.find((candidate) => candidate && existsSync(candidate)) || ''
}

function parseResult(raw) {
  const text = raw.trim()
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    const lines = text.split(/\r?\n/).filter(Boolean)
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      try {
        parsed = JSON.parse(lines[index])
        break
      } catch {}
    }
  }
  if (!parsed) throw new Error(`Claude did not return JSON: ${text.slice(0, 300)}`)
  if (parsed.is_error) throw new Error(parsed.result || 'Claude reported an error')
  const data = parsed.structured_output ?? (typeof parsed.result === 'string' ? JSON.parse(parsed.result) : null)
  if (!data) throw new Error('Claude did not return structured_output')
  return { data, meta: { durationMs: parsed.duration_ms, costUsd: parsed.total_cost_usd, models: Object.keys(parsed.modelUsage || {}) } }
}

function runClaude({ prompt, schema, systemPrompt, cwd, timeoutMs }) {
  const executable = findClaude()
  if (!executable) return Promise.reject(new Error('claude.exe not found'))
  return new Promise((resolve, reject) => {
    const args = ['-p', '--output-format', 'json', '--permission-mode', 'plan', '--json-schema', JSON.stringify(schema)]
    if (systemPrompt) args.push('--append-system-prompt', systemPrompt)
    const child = spawn(executable, args, { cwd, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      try {
        child.kill('SIGKILL')
      } catch {}
    }, timeoutMs)
    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      if (timedOut) return reject(new Error('Claude judge timed out'))
      if (code !== 0) return reject(new Error(`Claude exited ${code}: ${stderr.slice(-500) || stdout.slice(-500)}`))
      try {
        resolve(parseResult(stdout))
      } catch (error) {
        reject(error)
      }
    })
    child.stdin.on('error', () => {})
    child.stdin.end(prompt, 'utf8')
  })
}

const { options, positional } = parseArgs(process.argv.slice(2))
if (positional[0] !== 'run' || !positional[1]) {
  console.error('usage: node bin/acceptance.mjs run <sessionId> [--no-judge] [--allow <glob>] [--dir <dir>]')
  process.exit(2)
}
const sessionId = positional[1]
const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
const file = findSessionLog(home, sessionId)
const { meta, events } = readSessionLog(file)
const workspace = meta.cwd
if (!workspace) {
  console.error(`session ${sessionId} has no cwd in its header`)
  process.exit(1)
}
console.log(`session ${sessionId}\nworkspace ${workspace}\nevents ${events.length}\nlog ${file}`)
const result = await executeAcceptance({
  sessionId,
  meta,
  events,
  workspace,
  gatePolicy: 'manual',
  runJudge: runClaude,
  options: {
    judge: options.judge,
    judgeRetries: options.judgeRetries,
    allowedPaths: options.allowedPaths,
    reportDir: options.reportDir,
  },
  logger: (line) => console.log(`[acceptance] ${line}`),
})
const report = result.report
console.log(`\nverdict ${report.overall} status=${report.status} judge=${report.meta.judge.status}`)
for (const check of report.checks) {
  console.log(`- ${check.id}: ${check.conclusion} (${check.evidence.length} evidence)`)
}
console.log(`\njson ${result.paths ? result.paths.jsonPath : '(not written)'}`)
console.log(`md   ${result.paths ? result.paths.mdPath : '(not written)'}`)
if (report.overall !== 'pass' && report.rework.length > 0) {
  console.log('\nrework:')
  for (const item of report.rework) console.log(`- ${item}`)
}
