import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
import { apply } from '../../index.js'
import { DEV_DOC_ROLES, normalizeDevDoc } from '../../lib/devdoc.js'

// Exercise the exact Host routes with isolated state. No real Claude call or user Session.
test('export, validation, review gate, revision confirmation and new/existing delivery work together', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'claude-devdoc-routes-'))
  const previousHome = process.env.DSH_HOME
  const home = path.join(root, 'home')
  const project = path.join(root, 'demo')
  await mkdir(project, { recursive: true })
  process.env.DSH_HOME = home
  const routes = new Map()
  const prompts = []
  const releases = []
  let creates = 0
  const ctx = {
    effect(callback) { const dispose = callback(); if (typeof dispose === 'function') releases.push(dispose); return () => {} },
    on() { return () => {} }, get() {},
    logger: { info() {}, warn() {}, error() {} },
    connection: { fetch: { register(route) { for (const method of route.methods) routes.set(`${method} ${route.path}`, route.fetch); return () => {} } } },
    workspaceRegistry: { async create() { return { id: 'workspace-demo', title: 'Demo' } } },
    sessionController: {
      async inspect() { return { meta: { cwd: project }, events: [] } },
      async create() { creates += 1; return { sessionId: 'session-new' } },
      async prompt(request) { prompts.push(request); return { accepted: true } },
      async resolveAgent() { return { agent: { id: 'session-demo' } } },
      async list() { return { items: [] } },
    },
    sessions: { get() { return { id: 'session-demo' } } },
    agents: { get() { return { id: 'session-demo' } } },
    permissionPresets: { set() {}, current() { return 'danger-full-access' } },
    approval: { setPolicy() {} }, userQuestions: { async ask() { throw new Error('No user questions expected') } },
  }
  const call = async (method, endpoint, body) => {
    const request = new Request(`http://127.0.0.1/api/claude-on-dsh${endpoint}`, {
      method,
      ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
    })
    const response = await routes.get(`${method} /api/claude-on-dsh${endpoint.split('?')[0]}`)(request)
    return { status: response.status, body: await response.json() }
  }
  try {
    apply(ctx, { acceptance: { legacyGate: false, gatePolicy: 'off' } })
    const exported = await call('GET', '/devdoc/template?projectDir=' + encodeURIComponent(project) + '&projectName=Demo')
    assert.equal(exported.status, 200)
    assert.match(exported.body.content, /美术 \/ 交互组/)
    assert.doesNotMatch(exported.body.content, /\{\{/)
    const blank = await call('POST', '/devdoc/validate', { content: exported.body.content })
    assert.equal(blank.body.valid, false)
    assert.equal(blank.body.missing.length, 3)
    const failedReview = await call('POST', '/devdoc/refine', { projectDir: project, content: exported.body.content })
    assert.equal(failedReview.status, 400)
    const unapproved = await call('POST', '/devdoc/send', { projectDir: project })
    assert.equal(unapproved.status, 409)

    const content = `# Demo\n## 一、用户需求\n### 2. 目标与使用场景\n合同提醒\n### 3. 需要的功能\n查看清单\n### 4. 已有技术与资源\n无\n## 二、开发方案\n| F1 | 查看合同 | 必须 | A1：显示三条合同 | 操作页面并记录条目数 |\n## 三、美术与交互方案\n关键页面先确认，适配桌面。\n## 四、评审与交付\n用户确认：待确认\n`
    const doc = normalizeDevDoc({
      verdict: 'approved', questions: [], blockers: [], summary: '可实施',
      departments: DEV_DOC_ROLES.map(([id, name, , kind]) => ({ id, name,
        decision: kind === 'conditional' ? 'not_applicable' : 'approve', reason: '本机演示，范围与验证方式明确。' })),
    }, { projectDir: project, title: 'Demo', content })
    assert.equal(doc.status, 'approved')
    const key = createHash('sha256').update(project).digest('hex')
    const docFile = path.join(home, 'claude-on-dsh', 'devdocs', key + '.json')
    await writeFile(docFile, JSON.stringify(doc))
    const noConfirmation = await call('POST', '/devdoc/send', { projectDir: project, sessionId: 'session-demo' })
    assert.equal(noConfirmation.status, 409)
    const staleConfirmation = await call('POST', '/devdoc/send', { projectDir: project, confirmedHash: 'stale' })
    assert.equal(staleConfirmation.status, 409)
    assert.equal(prompts.length, 0)
    const sent = await call('POST', '/devdoc/send', { projectDir: project, sessionId: 'session-demo', confirmedHash: doc.approvedHash })
    assert.equal(sent.status, 200)
    assert.equal(sent.body.existing, true)
    assert.match(prompts[0].content[0].text, /方案预审通过不表示成品已经通过验收/)
    assert.match(prompts[0].content[0].text, /A 编号标准/)
    const newSession = await call('POST', '/devdoc/send', { projectDir: project, confirmedHash: doc.approvedHash })
    assert.equal(newSession.status, 200)
    assert.equal(newSession.body.existing, false)
    assert.equal(creates, 1)

    const saved = await call('POST', '/devdoc', { projectDir: project, content: content + '\n新增需求' })
    assert.equal(saved.body.doc.status, 'draft')
    const altered = await call('POST', '/devdoc/send', { projectDir: project, confirmedHash: doc.approvedHash })
    assert.equal(altered.status, 409)
    assert.equal(JSON.parse(await readFile(docFile, 'utf8')).status, 'draft')
  } finally {
    for (const dispose of releases.reverse()) await dispose()
    if (previousHome === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = previousHome
    await rm(root, { recursive: true, force: true })
  }
})
