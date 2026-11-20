#!/usr/bin/env node
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { createInterface } from 'node:readline'
import { DesktopSupervisionBridge } from '../lib/desktop-supervision-bridge.js'
import { SUPERVISION_SCHEMA } from '../lib/supervision-policy.js'

const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
const bridge = new DesktopSupervisionBridge({ home, ...(process.env.CLAUDE_ON_DSH_BRIDGE_HOME ? { root: process.env.CLAUDE_ON_DSH_BRIDGE_HOME } : {}) })
const connectionId = randomUUID()
let initialized = false, offeredClient, protocolVersion = '2025-06-18', heartbeatTimer
const object = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false })
const identity = { requestId: { type: 'string', description: 'Exact pending request id returned by the list tool' }, sessionId: { type: 'string' } }
const tools = [
  { name: 'list_pending_reviews', description: '列出 DSH Host 已准备的 Claude 监工待审任务，不启动新项目。', inputSchema: object({}), annotations: { readOnlyHint: true } },
  { name: 'get_review_task', description: '读取一个待审任务的原始目标、进度和证据提示词。仅能读取 Host 创建的待审任务，不能读取任意文件。', inputSchema: object(identity, ['requestId']), annotations: { readOnlyHint: true } },
  { name: 'submit_review_decision', description: '把 continue/complete/wait 决策提交给原 DSH 监工任务；Host 会重新核对轮次和目标，不会立即盲目执行。调用状态工具确认是否已处理。', inputSchema: object({ ...identity, decision: SUPERVISION_SCHEMA }, ['requestId', 'sessionId', 'decision']), annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true } },
  { name: 'get_review_status', description: '查询一次已提交判断是否已被 DSH Host 处理。queued 不表示 DSH 已续跑。', inputSchema: object({ requestId: identity.requestId }, ['requestId']), annotations: { readOnlyHint: true } },
]
const emit = (message) => process.stdout.write(`${JSON.stringify(message)}\n`)
async function call(name, args = {}) {
  if (name === 'list_pending_reviews') return { tasks: bridge.tasks(), note: '连接不会自行发起桌面对话。请按用户要求检查待审任务；没有任务时不要编造任务或判断。' }
  if (name === 'get_review_task') return bridge.task(args.requestId, args.sessionId)
  if (name === 'submit_review_decision') return bridge.enqueue(args)
  if (name === 'get_review_status') return bridge.receipt(args.requestId)
  throw Object.assign(new Error('Unknown tool'), { code: -32601 })
}
async function handle(message) {
  if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') throw Object.assign(new Error('Invalid JSON-RPC request'), { code: -32600 })
  const hasId = Object.hasOwn(message, 'id')
  if (message.method === 'initialize') {
    const offered = message.params?.protocolVersion, info = message.params?.clientInfo
    if (!hasId || offeredClient || typeof offered !== 'string' || typeof info?.name !== 'string' || !info.name || typeof info.version !== 'string') {
      throw Object.assign(new Error('Invalid MCP initialization'), { code: -32602 })
    }
    bridge.key()
    protocolVersion = ['2024-11-05', '2025-03-26', '2025-06-18', '2025-11-25'].includes(offered) ? offered : '2025-06-18'
    offeredClient = info
    return { protocolVersion, capabilities: { tools: { listChanged: false } },
      serverInfo: { name: 'claude-on-dsh-supervisor', title: 'Claude on DSH 项目监工', version: '1.0.0' },
      instructions: '使用监工工具读取待审任务并回传 JSON 决策。只读分析项目，不修改项目。没有任务则等待用户下一步要求。本连接不能主动发起 Claude Desktop 对话。' }
  }
  if (message.method === 'notifications/initialized') {
    if (hasId || !offeredClient || initialized) return
    await bridge.heartbeat(offeredClient, protocolVersion, connectionId)
    initialized = true
    heartbeatTimer = setInterval(() => bridge.heartbeat(offeredClient, protocolVersion, connectionId).catch((error) => process.stderr.write(`${error.message}\n`)), 10_000)
    heartbeatTimer.unref()
    return
  }
  if (message.method === 'ping') return {}
  if (!hasId) return
  if (!initialized) throw Object.assign(new Error('MCP session is not initialized'), { code: -32002 })
  if (message.method === 'tools/list') return { tools }
  if (message.method === 'tools/call') {
    try { return { content: [{ type: 'text', text: JSON.stringify(await call(message.params?.name, message.params?.arguments)) }] } }
    catch (error) { return { isError: true, content: [{ type: 'text', text: error.message }] } }
  }
  throw Object.assign(new Error('Method not found'), { code: -32601 })
}
const input = createInterface({ input: process.stdin, crlfDelay: Infinity })
try {
  for await (const line of input) {
    if (!line.trim()) continue
    let message
    try {
      if (line.length > 1024 * 1024) throw new Error('Message too large')
      message = JSON.parse(line)
      const result = await handle(message)
      if (Object.prototype.hasOwnProperty.call(message, 'id')) emit({ jsonrpc: '2.0', id: message.id, result: result || {} })
    } catch (error) {
      if (!message || Object.prototype.hasOwnProperty.call(message, 'id')) emit({ jsonrpc: '2.0', id: message?.id ?? null, error: { code: error.code || -32700, message: error.message } })
    }
  }
} finally {
  clearInterval(heartbeatTimer)
  if (initialized) await bridge.disconnect(connectionId)
}
