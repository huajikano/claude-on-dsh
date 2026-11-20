import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
  SDK_PACKAGE,
  buildSdkOptions,
  createSdkLoader,
  needsSkipPermissions,
  normalizeEngine,
  parseStructuredText,
  readSdkResult,
  sdkCandidates,
  sdkEntry,
  sdkPermissionMode,
  startSdkRun,
} from '../../lib/engine/sdk.js'

/** A temporary directory holding one fake SDK package. */
function fakeSdkPackage(main = 'sdk.mjs') {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'cc-sdk-'))
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: SDK_PACKAGE, main }))
  writeFileSync(path.join(dir, main), 'export const query = () => null\n')
  return dir
}

/** A fake `query()` that yields the given messages and records its options. */
function fakeQuery(messages) {
  const calls = []
  const query = (params) => {
    calls.push(params)
    return (async function* stream() {
      for (const message of messages) yield message
    })()
  }
  return { query, calls }
}

test('a panel permission mode maps onto the SDK modes', () => {
  assert.equal(sdkPermissionMode('plan'), 'plan')
  assert.equal(sdkPermissionMode('acceptEdits'), 'acceptEdits')
  assert.equal(sdkPermissionMode('dontAsk'), 'dontAsk')
  assert.equal(sdkPermissionMode('bypassPermissions'), 'bypassPermissions')
  // `auto` is the panel's own word; the SDK's standard behaviour is `default`.
  assert.equal(sdkPermissionMode('auto'), 'default')
  assert.equal(sdkPermissionMode('nonsense'), 'plan')
  assert.equal(sdkPermissionMode('nonsense', 'acceptEdits'), 'acceptEdits')
})

test('bypass asks the SDK for its own acknowledgement', () => {
  assert.equal(needsSkipPermissions('bypassPermissions'), true)
  assert.equal(needsSkipPermissions('plan'), false)
})

test('the schema travels as outputFormat, not as an argument', () => {
  const schema = { type: 'object', properties: { question: { type: 'string' } } }
  const options = buildSdkOptions({ cwd: 'C:/proj', schema, permissionMode: 'plan' })
  assert.deepEqual(options.outputFormat, { type: 'json_schema', schema })
  assert.equal(options.permissionMode, 'plan')
  assert.deepEqual(options.settingSources, ['user', 'project', 'local'])
})

test('a turn without a schema sends no outputFormat', () => {
  const options = buildSdkOptions({ cwd: 'C:/proj' })
  assert.equal('outputFormat' in options, false)
})

test('the system prompt is appended to the Claude Code preset', () => {
  const options = buildSdkOptions({ cwd: 'C:/proj', systemPrompt: '只说中文' })
  assert.deepEqual(options.systemPrompt, { type: 'preset', preset: 'claude_code', append: '只说中文' })
})

test('a resume id and a model reach the options only when given', () => {
  const bare = buildSdkOptions({ cwd: 'C:/proj' })
  assert.equal('resume' in bare, false)
  assert.equal('model' in bare, false)
  const full = buildSdkOptions({ cwd: 'C:/proj', resume: 'abc', model: 'sonnet', forkSession: true })
  assert.equal(full.resume, 'abc')
  assert.equal(full.forkSession, true)
  assert.equal(full.model, 'sonnet')
})

test('bypass permissions carries the danger acknowledgement', () => {
  const options = buildSdkOptions({ cwd: 'C:/proj', permissionMode: 'bypassPermissions' })
  assert.equal(options.allowDangerouslySkipPermissions, true)
})

test('structured_output wins over the prose fallback', () => {
  const { data, meta } = readSdkResult(
    {
      type: 'result',
      subtype: 'success',
      structured_output: { question: '选哪一个？' },
      result: '这句话不该被读到',
      duration_ms: 1200,
      total_cost_usd: 0.03,
      num_turns: 2,
      session_id: 'sess-1',
      modelUsage: { 'claude-sonnet': {} },
    },
    { schema: { type: 'object' } },
  )
  assert.deepEqual(data, { question: '选哪一个？' })
  assert.equal(meta.sessionId, 'sess-1')
  assert.equal(meta.costUsd, 0.03)
  assert.deepEqual(meta.models, ['claude-sonnet'])
})

test('fenced JSON in the prose is read as the answer', () => {
  const { data } = readSdkResult(
    { type: 'result', subtype: 'success', result: '好的：\n```json\n{"question":"继续吗"}\n```' },
    { schema: { type: 'object' } },
  )
  assert.deepEqual(data, { question: '继续吗' })
})

test('a failed subtype is an error, not an empty answer', () => {
  assert.throws(
    () => readSdkResult({ type: 'result', subtype: 'error_max_turns', result: 'hit the cap' }),
    (error) => error.status === 502 && /error_max_turns/.test(`${error.message} ${error.hint}`),
  )
})

test('a structured answer that never arrived is an error', () => {
  assert.throws(
    () => readSdkResult({ type: 'result', subtype: 'success', result: '没给 JSON' }, { schema: {} }),
    (error) => error.status === 502,
  )
})

test('parseStructuredText recovers JSON wrapped in prose', () => {
  assert.deepEqual(parseStructuredText('前缀 {"a":1} 后缀'), { a: 1 })
  assert.equal(parseStructuredText('没有对象'), undefined)
  assert.equal(parseStructuredText(''), undefined)
})

test('a missing SDK names the install route', async () => {
  const dshHome = mkdtempSync(path.join(os.tmpdir(), 'cc-home-'))
  const error = await createSdkLoader({ dshHome, importModule: async () => { throw new Error('nope') } })()
    .then(() => null, (caught) => caught)
  assert.ok(error instanceof Error)
  assert.match(error.hint, /profile/)
})

test('one fake SDK package is enough for the loader to resolve by path', async () => {
  const dir = fakeSdkPackage()
  const loader = createSdkLoader({ sdkPath: dir })
  const sdk = await loader()
  assert.equal(typeof sdk.query, 'function')
  assert.equal(loader.from, path.join(dir, 'sdk.mjs'))
})

test('the loader reads a package main that is not sdk.mjs', () => {
  const dir = fakeSdkPackage('entry.mjs')
  writeFileSync(path.join(dir, 'entry.mjs'), 'export const query = () => null\n')
  assert.equal(sdkEntry(dir), path.join(dir, 'entry.mjs'))
})

test('a profile install is one of the candidates', () => {
  const home = mkdtempSync(path.join(os.tmpdir(), 'cc-home-'))
  const installed = path.join(home, 'profiles', 'desktop', 'node_modules', SDK_PACKAGE)
  mkdirSync(installed, { recursive: true })
  const candidates = sdkCandidates({ dshHome: home })
  assert.deepEqual(candidates, [installed])
})

test('a turn streams to one result and reports its data', async () => {
  const { query, calls } = fakeQuery([
    { type: 'system', subtype: 'init' },
    { type: 'assistant', message: {} },
    { type: 'result', subtype: 'success', structured_output: { ok: true }, session_id: 's-9' },
  ])
  const run = startSdkRun({ prompt: '你好', cwd: 'C:/proj', loadSdk: async () => ({ query }) })
  const result = await run.promise
  assert.deepEqual(result.data, { ok: true })
  assert.equal(result.meta.sessionId, 's-9')
  assert.equal(calls.length, 1)
  assert.equal(calls[0].prompt, '你好')
  assert.equal(calls[0].options.cwd, 'C:/proj')
})

test('cancel rejects with the caller\'s cancel error', async () => {
  let release
  const gate = new Promise((resolve) => { release = resolve })
  const query = () => (async function* stream() {
    await gate
    yield { type: 'result', subtype: 'success', result: '{"a":1}' }
  })()
  const run = startSdkRun({ prompt: 'x', cwd: 'C:/p', loadSdk: async () => ({ query }) })
  run.cancel()
  release()
  const error = await run.promise.then(() => null, (caught) => caught)
  assert.ok(error)
  assert.equal(error.status, 409)
})

test('a timeout rejects with the caller\'s timeout error', async () => {
  const query = () => (async function* stream() {
    await new Promise((resolve) => setTimeout(resolve, 50))
    yield { type: 'result', subtype: 'success', result: '{"a":1}' }
  })()
  const run = startSdkRun({
    prompt: 'x',
    cwd: 'C:/p',
    timeoutMs: 5,
    loadSdk: async () => ({ query }),
    makeTimeoutError: () => Object.assign(new Error('超时了'), { status: 504 }),
  })
  const error = await run.promise.then(() => null, (caught) => caught)
  assert.equal(error.status, 504)
})

test('the engine word is one of three', () => {
  assert.equal(normalizeEngine('sdk'), 'sdk')
  assert.equal(normalizeEngine('CLI'), 'cli')
  assert.equal(normalizeEngine('auto'), 'auto')
  assert.equal(normalizeEngine('whatever'), 'auto')
  assert.equal(normalizeEngine('whatever', 'cli'), 'cli')
})

test('a planning deny list reaches the SDK options', () => {
  const options = buildSdkOptions({ cwd: 'C:/proj', disallowedTools: ['Write', 'Bash'] })
  assert.deepEqual(options.disallowedTools, ['Write', 'Bash'])
})

test('an empty deny list is left out entirely', () => {
  const options = buildSdkOptions({ cwd: 'C:/proj', disallowedTools: [] })
  assert.equal('disallowedTools' in options, false)
})

test('the deny list travels with the turn it starts', async () => {
  const { query, calls } = fakeQuery([
    { type: 'result', subtype: 'success', structured_output: { ok: true } },
  ])
  const run = startSdkRun({
    prompt: 'x',
    cwd: 'C:/p',
    schema: { type: 'object' },
    disallowedTools: ['Write'],
    loadSdk: async () => ({ query }),
  })
  await run.promise
  assert.deepEqual(calls[0].options.disallowedTools, ['Write'])
  assert.equal(calls[0].options.outputFormat.type, 'json_schema')
})

test('supervisor SDK calls expose only read tools and disable inherited MCP servers', () => {
  const options = buildSdkOptions({ cwd: 'C:/project', readOnly: true })
  assert.deepEqual(options.tools, ['Read', 'Glob', 'Grep']); assert.deepEqual(options.mcpServers, {}); assert.equal(options.strictMcpConfig, true)
  assert.equal('tools' in buildSdkOptions({ cwd: 'C:/project' }), false)
})
