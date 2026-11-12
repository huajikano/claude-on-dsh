import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { PROMPT_DEFINITIONS, createPromptStore, renderPrompt, validatePrompt } from '../../lib/prompts.js'
import { buildDevDocReviewPrompt, devDocTemplate } from '../../lib/devdoc.js'
import { judgeAcceptance } from '../../lib/acceptance/judge.js'
import { runCheckers } from '../../lib/acceptance/checkers.js'
import { sampleFacts } from './fixtures.js'

test('default templates retain their required context and render user braces in one pass', () => {
  for (const entry of PROMPT_DEFINITIONS) assert.equal(validatePrompt(entry.id, entry.defaultValue), entry.defaultValue)
  assert.match(renderPrompt('brief', { goal: 'Use Vue {{answer}} and literal $&' }), /Vue \{\{answer\}\} and literal \$&/)
  assert.throws(() => validatePrompt('brief', '只管编写代码'), /goal/)
  assert.throws(() => validatePrompt('brief', '{{goal}} {{typo}}'), /typo/)
  assert.throws(() => validatePrompt('brief', ' '), /不能为空/)
  assert.throws(() => validatePrompt('brief', '{{goal}}' + 'x'.repeat(40000)), /不能超过/)
  assert.throws(() => validatePrompt('__proto__', 'x'), /未知/)
})

test('save, concurrent updates, reload and per-prompt reset preserve the latest defaults', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cod-prompts-'))
  const file = path.join(root, 'prompts.json')
  try {
    const store = createPromptStore(file)
    await Promise.all([
      store.save({ id: 'brief', value: 'Custom brief {{goal}}' }),
      store.save({ id: 'desktop', value: 'Custom desktop {{goal}}' }),
    ])
    const reloaded = createPromptStore(file)
    assert.equal(reloaded.render('brief', { goal: 'Goal' }), 'Custom brief Goal')
    assert.equal(reloaded.render('desktop', { goal: 'Goal' }), 'Custom desktop Goal')
    assert.equal(reloaded.list().find((entry) => entry.id === 'brief').customized, true)
    await reloaded.save({ id: 'brief', reset: true })
    const afterReset = createPromptStore(file)
    assert.equal(afterReset.value('brief'), PROMPT_DEFINITIONS.find((entry) => entry.id === 'brief').defaultValue)
    assert.equal(afterReset.value('desktop'), 'Custom desktop {{goal}}')
    assert.equal(JSON.parse(await readFile(file, 'utf8')).overrides.brief, undefined)
    assert.throws(() => afterReset.save({ id: 'desktop', value: 'missing goal' }), /goal/)
    assert.equal(afterReset.value('desktop'), 'Custom desktop {{goal}}')
    await writeFile(file, JSON.stringify({ overrides: { brief: 'invalid', desktop: 'Valid {{goal}}', unknown: 'x' } }))
    assert.equal(createPromptStore(file).value('desktop'), 'Valid {{goal}}')
    assert.equal(createPromptStore(file).value('brief'), afterReset.value('brief'))
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('a failed disk write does not claim that a prompt was saved', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cod-prompt-write-failure-'))
  try {
    const blockedParent = path.join(root, 'not-a-directory')
    await writeFile(blockedParent, 'block')
    const store = createPromptStore(path.join(blockedParent, 'prompts.json'))
    const original = store.value('brief')
    await assert.rejects(store.save({ id: 'brief', value: 'CUSTOM {{goal}}' }))
    assert.equal(store.value('brief'), original)
    assert.equal(store.list().find((entry) => entry.id === 'brief').customized, false)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('saved document rules and review instructions reach both template export and pre-review', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cod-doc-prompts-'))
  try {
    const store = createPromptStore(path.join(root, 'prompts.json'))
    await store.save({ id: 'devdocRules', value: 'Custom design rule: inspect the key page first.' })
    await store.save({ id: 'devdocReview', value: 'REVIEW {{rules}}\n{{roles}}\n{{content}}' })
    const exported = devDocTemplate({ projectName: 'Demo', projectDir: 'D:\\demo', rules: store.value('devdocRules') })
    assert.match(exported, /项目目录：D:/)
    assert.match(exported, /Custom design rule/)
    assert.doesNotMatch(exported.slice(exported.indexOf('## 五、固定指令')), /常规实现细节/)
    const prompt = buildDevDocReviewPrompt({ projectDir: root, projectName: 'Demo', content: 'Original {{answer}}' }, store.render)
    assert.match(prompt, /^REVIEW Custom design rule/)
    assert.match(prompt, /design｜美术/)
    assert.match(prompt, /Original \{\{answer\}\}/)
  } finally { await rm(root, { recursive: true, force: true }) }
})

test('formal acceptance uses saved judge instructions while still validating the verdict', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cod-judge-prompts-'))
  try {
    const store = createPromptStore(path.join(root, 'prompts.json'))
    await store.save({ id: 'judge', value: 'JUDGE {{opinion}} {{evidencePacket}}' })
    await store.save({ id: 'judgeSystem', value: 'CUSTOM JUDGE SYSTEM' })
    const facts = sampleFacts()
    const { checks, evidence } = runCheckers(facts)
    let calls = 0
    const result = await judgeAcceptance({ facts, checks, evidence, options: { renderPrompt: store.render, opinion: 'Focus' }, runJudge: async ({ prompt, systemPrompt }) => {
      calls++
      assert.match(prompt, /^JUDGE Focus/)
      assert.match(prompt, /machineChecks/)
      assert.equal(systemPrompt, 'CUSTOM JUDGE SYSTEM')
      return { overall: 'uncertain', summary: 'Review', checks: checks.map((item) => ({ id: item.id, conclusion: 'uncertain', evidenceIds: [], note: 'Need evidence' })), missing: [], rework: [] }
    } })
    assert.equal(calls, 1)
    assert.equal(result.status, 'completed')
  } finally { await rm(root, { recursive: true, force: true }) }
})
