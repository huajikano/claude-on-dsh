import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { constants, existsSync, readFileSync, statSync } from 'node:fs'
import { copyFile, link, mkdir, readdir, rename, unlink, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import { redact } from './acceptance/contract.js'
import { validateSupervisionDecision } from './supervision-policy.js'

const execute = promisify(execFile)
export const DESKTOP_MCP_NAME = 'claude-on-dsh-supervisor'
const UUID = /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i
const FILENAME = 'claude_desktop_config.json'
const CONFIG_LIMIT = 4 * 1024 * 1024
const MAIL_LIMIT = 64 * 1024
const FRESH_MS = 45_000
const fail = (message) => Object.assign(new Error(message), { status: 400 })
const isFile = (file) => Boolean(file && statSync(file, { throwIfNoEntry: false })?.isFile())
const readJson = (file, max) => {
  if (statSync(file).size > max) throw fail('本地连接文件超过大小上限。')
  return JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
}
const sign = (key, value) => createHmac('sha256', key).update(JSON.stringify(value)).digest('hex')
function verify(key, value, signature) {
  return Boolean(value && typeof signature === 'string' && /^[a-f\d]{64}$/.test(signature) &&
    timingSafeEqual(Buffer.from(sign(key, value), 'hex'), Buffer.from(signature, 'hex')))
}
async function writeJson(file, value, exclusive = false) {
  const temp = `${file}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`
  try {
    await writeFile(temp, JSON.stringify(value) + '\n', { encoding: 'utf8', flag: 'wx', mode: 0o600 })
    // Publish a complete message, without allowing a second reply to overwrite it.
    if (exclusive) await link(temp, file)
    else await rename(temp, file)
  } finally { await unlink(temp).catch(() => {}) }
}

const desktopPath = /[\\/](?:WindowsApps[\\/]Claude_|AnthropicClaude[\\/]|Programs[\\/]Claude[\\/]|Program Files[\\/]Claude[\\/])/i
const codePath = /[\\/]Claude-3p[\\/]|[\\/]claude-code[\\/]|[\\/]node_modules[\\/]/i
export async function probeClaudeDesktop({ platform = process.platform, run = execute, appPath = '' } = {}) {
  if (platform !== 'win32') return { running: null, processes: [] }
  const script = '[Console]::OutputEncoding = [Text.UTF8Encoding]::new(); $p = @(Get-Process -Name Claude -ErrorAction SilentlyContinue | Select-Object Id,Path,MainWindowTitle); ConvertTo-Json -InputObject $p -Compress'
  try {
    const output = await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { timeout: 5000, windowsHide: true, maxBuffer: 256 * 1024 })
    const rows = JSON.parse(String(output.stdout || '[]').replace(/^\uFEFF/, ''))
    const processes = (Array.isArray(rows) ? rows : []).filter((row) => {
      const executable = row?.Path || ''
      if (!/[\\/]claude\.exe$/i.test(executable) || codePath.test(executable)) return false
      return desktopPath.test(executable) || (appPath && path.normalize(executable).toLowerCase() === path.normalize(appPath).toLowerCase()) || /^Claude(?:\s|$)/i.test(row.MainWindowTitle || '')
    }).map((row) => ({ pid: row.Id, path: row.Path, hasWindow: Boolean(row.MainWindowTitle) }))
    return { running: processes.length > 0, processes }
  } catch { return { running: null, processes: [], note: '无法检测 Claude Desktop 进程。请刷新状态或检查应用。' } }
}
export function desktopConfigCandidates({ appData = process.env.APPDATA, localAppData = process.env.LOCALAPPDATA, appPath = '', explicit = '' } = {}) {
  if (explicit) return [path.resolve(explicit)]
  const standard = appData && path.join(appData, 'Claude', FILENAME)
  const storeMatch = /[\\/]WindowsApps[\\/](Claude)_[^\\/]+__([a-z\d]+)(?:[\\/]|$)/i.exec(appPath)
  const packageName = storeMatch ? `${storeMatch[1]}_${storeMatch[2]}` : 'Claude_pzs8sxrjxfjjc'
  const store = localAppData && path.join(localAppData, 'Packages', packageName, 'LocalCache', 'Roaming', 'Claude', FILENAME)
  // Do not mistake an older non-Store configuration for the active MSIX config.
  return (storeMatch || (!appPath && store && existsSync(path.dirname(store))) ? [store, standard] : [standard, store]).filter(Boolean)
}
export function desktopNodeExecutable(home, explicit = '') {
  const name = process.platform === 'win32' ? 'node.exe' : 'node'
  const candidates = explicit ? [explicit] : [
    path.basename(process.execPath).toLowerCase() === name ? process.execPath : '',
    path.join(home, 'dsh-runtimes', 'dsh-primary-runtime', 'dependencies', 'node', 'bin', name),
    ...String(process.env.PATH || '').split(path.delimiter).filter(Boolean).map((dir) => path.join(dir.replace(/^"|"$/g, ''), name)),
  ]
  return candidates.find((file) => { try { return isFile(file) } catch { return false } }) || ''
}
export function desktopConnectionState({ application, configuration, connection, nodePath, entryPath }) {
  const connected = connection.connected === true
  const running = application.running
  const configured = configuration.configured === true
  const bridgeReady = Boolean(nodePath && entryPath && configuration.configPath)
  return {
    state: connected ? 'connected' : running === true ? 'running-unconnected' : running === false ? 'not-running' : 'unknown',
    connected, applicationRunning: running, mcpConfigured: configured, bridgeReady,
    configPath: configuration.configPath, configError: configuration.error || '', processNote: application.note || '',
    lastHeartbeatAt: connection.lastSeenAt || 0, clientInfo: connected ? connection.clientInfo : null,
    protocolVersion: connected ? connection.protocolVersion : '',
    automaticConversationStart: false, needsReload: configured && !connected,
  }
}

/** Local, user-owned stdio rendezvous. The tools only exchange pending review
 * tasks and decisions; they do not accept file paths, run commands or open chats.
 */
export class DesktopSupervisionBridge {
  constructor({ home, root = path.join(home, 'claude-on-dsh', 'desktop-bridge'), now = Date.now }) {
    this.home = home
    this.root = root
    this.now = now
    this.stateFile = path.join(home, 'claude-on-dsh', 'supervision.json')
    this.outbox = path.join(root, 'outbox')
    this.receipts = path.join(root, 'receipts')
    this.draining = false
    this.installing = false
  }
  async ensure() {
    await mkdir(this.root, { recursive: true, mode: 0o700 })
    try { await writeFile(path.join(this.root, 'bridge.key'), randomBytes(32), { flag: 'wx', mode: 0o600 }) }
    catch (error) { if (error.code !== 'EEXIST') throw error }
    this.key()
    await mkdir(this.outbox, { recursive: true, mode: 0o700 })
    await mkdir(this.receipts, { recursive: true, mode: 0o700 })
  }
  key() {
    const key = readFileSync(path.join(this.root, 'bridge.key'))
    if (key.length !== 32) throw fail('监工连接密钥不可用。')
    return key
  }
  pendingRows() {
    try {
      const state = readJson(this.stateFile, 64 * 1024 * 1024)
      return (state.sessions || []).filter((row) => row.phase === 'awaiting-desktop' && UUID.test(row.pending?.id || ''))
    } catch (error) { if (error.code === 'ENOENT') return []; throw error }
  }
  tasks() {
    return this.pendingRows().slice(-100).reverse().map((row) => ({
      requestId: row.pending.id, sessionId: row.sessionId, objective: row.objective?.slice(0, 600), createdAt: row.pending.createdAt,
    }))
  }
  task(requestId, sessionId) {
    const row = this.pendingRows().find((item) => item.pending.id === requestId && (!sessionId || item.sessionId === sessionId))
    if (!row) throw fail('待审任务已过期、暂停或处理完成。')
    return { requestId, sessionId: row.sessionId, objective: row.objective, prompt: row.pending.prompt, turnKey: row.pending.turnKey }
  }
  async heartbeat(clientInfo, protocolVersion, connectionId) {
    const value = { pid: process.pid, clientInfo: { name: String(clientInfo.name).slice(0, 120), version: String(clientInfo.version).slice(0, 100) },
      protocolVersion, connectionId, lastSeenAt: this.now() }
    await writeJson(path.join(this.root, 'connection.json'), { value, signature: sign(this.key(), value) })
  }
  async disconnect(connectionId) {
    const file = path.join(this.root, 'connection.json')
    try {
      const { value, signature } = readJson(file, MAIL_LIMIT)
      if (value.connectionId === connectionId && verify(this.key(), value, signature)) await unlink(file)
    } catch {}
  }
  connection() {
    try {
      const { value, signature } = readJson(path.join(this.root, 'connection.json'), MAIL_LIMIT)
      if (!verify(this.key(), value, signature)) return { connected: false }
      const age = this.now() - value.lastSeenAt
      let connected = value.connected !== false && Number.isSafeInteger(value.pid) && value.pid > 0 && age >= 0 && age < FRESH_MS
      if (connected) { try { process.kill(value.pid, 0) } catch { connected = false } }
      return { ...value, connected }
    } catch { return { connected: false } }
  }
  async enqueue({ sessionId, requestId, decision }) {
    if (!UUID.test(requestId || '') || typeof sessionId !== 'string' || !sessionId) throw fail('缺少有效的任务或会话 ID。')
    const existing = this.receipt(requestId)
    if (existing.status !== 'pending') return existing
    this.task(requestId, sessionId)
    const valid = validateSupervisionDecision(decision)
    const value = { requestId, sessionId, decision: {
      ...valid, reason: redact(valid.reason), message: redact(valid.message), evidence: valid.evidence.map((item) => redact(item).slice(0, 1200)),
    }, createdAt: this.now() }
    try { await writeJson(path.join(this.outbox, `${requestId}.json`), { value, signature: sign(this.key(), value) }, true) }
    catch (error) { if (error.code !== 'EEXIST') throw error }
    return { requestId, status: 'queued', note: '已排队，尚未确认 DSH 已采取动作。' }
  }
  receipt(requestId) {
    if (!UUID.test(requestId || '')) throw fail('无效的任务 ID。')
    const name = `${requestId}.json`
    try { return readJson(path.join(this.receipts, name), MAIL_LIMIT) }
    catch (error) { if (error.code !== 'ENOENT') throw error }
    if (existsSync(path.join(this.outbox, `${name}.processing`))) {
      return { requestId, status: 'processing-or-uncertain', note: 'Host 正在处理或曾中断。请核对监工记录，勿重复提交。' }
    }
    if (existsSync(path.join(this.outbox, name))) return { requestId, status: 'queued' }
    return { requestId, status: this.pendingRows().some((row) => row.pending.id === requestId) ? 'pending' : 'expired' }
  }
  async drain(submit) {
    if (this.draining || !existsSync(this.outbox)) return
    this.draining = true
    try {
      const names = (await readdir(this.outbox)).filter((name) => name.endsWith('.json') && UUID.test(name.slice(0, -5))).slice(0, 20)
      for (const name of names) {
        const file = path.join(this.outbox, name), claimed = `${file}.processing`, requestId = name.slice(0, -5)
        // A claim without a receipt may have crossed an irreversible Host action.
        // Do not replay it automatically after a restart.
        if (existsSync(claimed)) continue
        try { await rename(file, claimed) } catch (error) { if (error.code === 'ENOENT') continue; throw error }
        let result = { requestId, status: 'rejected', processedAt: this.now() }
        try {
          const { value, signature } = readJson(claimed, MAIL_LIMIT)
          if (!verify(this.key(), value, signature) || value.requestId !== requestId) throw fail('桌面回复签名无效。')
          const age = this.now() - value.createdAt
          if (!Number.isFinite(age) || age < 0 || age > 24 * 60 * 60_000) throw fail('桌面回复已过期。')
          const row = await submit(value.sessionId, requestId, value.decision)
          result = { ...result, status: 'processed', phase: row.phase, note: redact(row.error || row.note || '').slice(0, 4000) }
        } catch (error) { result.error = redact(String(error.message)).slice(0, 4000) }
        await writeJson(path.join(this.receipts, name), result)
        await unlink(claimed)
      }
    } finally { this.draining = false }
  }
  configuration(configPath, nodePath, entryPath) {
    try {
      const saved = readJson(configPath, CONFIG_LIMIT), row = saved?.mcpServers?.[DESKTOP_MCP_NAME]
      return { configPath, configured: Boolean(row && row.command === nodePath && row.args?.[0] === entryPath &&
        row.env?.DSH_HOME === this.home && row.env?.CLAUDE_ON_DSH_BRIDGE_HOME === this.root) }
    } catch (error) {
      return { configPath, configured: false, ...(error.code === 'ENOENT' ? {} : { error: 'Claude Desktop 配置不可读或 JSON 无效，未修改。' }) }
    }
  }
  async install({ configPath, nodePath, entryPath }) {
    if (this.installing) throw fail('正在写入桌面连接配置。')
    if (!configPath || !isFile(nodePath) || !isFile(entryPath)) throw fail('未找到配置文件位置、Node 运行时或 MCP 入口。')
    this.installing = true
    try {
      let saved, backupPath = ''
      try { saved = readJson(configPath, CONFIG_LIMIT) }
      catch (error) { if (error.code === 'ENOENT') saved = {}; else throw fail('Claude Desktop 配置不可读或 JSON 无效，未修改。') }
      const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value)
      if (!isObject(saved) || ('mcpServers' in saved && !isObject(saved.mcpServers))) throw fail('Claude Desktop 配置结构无效，未修改。')
      const old = saved.mcpServers?.[DESKTOP_MCP_NAME]
      if (old && (old.env?.DSH_HOME !== this.home || old.env?.CLAUDE_ON_DSH_BRIDGE_HOME !== this.root ||
        !Array.isArray(old.args) || path.basename(String(old.args[0])) !== 'desktop-supervision-mcp.mjs')) {
        throw fail('已有同名 MCP 服务器，不覆盖。请在 Claude Desktop 核对连接。')
      }
      await this.ensure()
      if (this.configuration(configPath, nodePath, entryPath).configured) return { backupPath, changed: false }
      await mkdir(path.dirname(configPath), { recursive: true, mode: 0o700 })
      if (existsSync(configPath)) {
        backupPath = `${configPath}.claude-on-dsh-${this.now()}-${randomBytes(4).toString('hex')}.bak`
        await copyFile(configPath, backupPath, constants.COPYFILE_EXCL)
      }
      saved.mcpServers = { ...saved.mcpServers, [DESKTOP_MCP_NAME]: { command: nodePath, args: [entryPath],
        env: { DSH_HOME: this.home, CLAUDE_ON_DSH_BRIDGE_HOME: this.root } } }
      await writeJson(configPath, saved)
      return { backupPath, changed: true }
    } finally { this.installing = false }
  }
}
