import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildSessionPrompt,
  lastAssistantText,
  parseSessionAnswer,
  readChoiceLines,
} from '../../lib/first-question-session.js'

const REPLY = `## 理解
这是一个要做番茄钟网页的请求，隐含约束是手机端可用、数据要能本地保存。

## 首问
本地存储用 localStorage 还是 IndexedDB？

## 候选答案
- localStorage，简单够用
- IndexedDB，将来要存更多
- 先 localStorage，留出迁移接口

## 交接书
背景：做一个极简番茄钟。
目标：支持任务清单与本地存储。
验收：手机端可用。
`

test('the instruction asks for the four sections it will parse', () => {
  const prompt = buildSessionPrompt({ projectName: '番茄钟', projectDir: 'D:/p', goal: '做一个番茄钟' })
  for (const heading of ['## 理解', '## 首问', '## 候选答案', '## 交接书']) {
    assert.ok(prompt.includes(heading), `${heading} must be asked for`)
  }
  assert.ok(prompt.includes('做一个番茄钟'))
  assert.ok(prompt.includes('D:/p'))
  // A conversation has no schema behind it, so the shape has to be spelled out.
  assert.ok(prompt.includes('不要输出 JSON'))
})

test('a well-shaped reply becomes the four fields', () => {
  const parsed = parseSessionAnswer(REPLY)
  assert.equal(parsed.complete, true)
  assert.match(parsed.understanding, /番茄钟/)
  assert.equal(parsed.question, '本地存储用 localStorage 还是 IndexedDB？')
  assert.deepEqual(parsed.choices, [
    'localStorage，简单够用',
    'IndexedDB，将来要存更多',
    '先 localStorage，留出迁移接口',
  ])
  assert.match(parsed.brief, /验收：手机端可用/)
})

test('an unshaped reply still yields a question, and says it is incomplete', () => {
  const parsed = parseSessionAnswer('我想先确认一下：这个番茄钟离线也要能用吗？其余按你说的来。')
  assert.equal(parsed.complete, false)
  assert.match(parsed.question, /离线也要能用/)
  assert.equal(parsed.brief.length > 0, true)
})

test('a reply with no question at all is reported, not invented', () => {
  const parsed = parseSessionAnswer('好的，我明白了。')
  assert.equal(parsed.question, '')
  assert.equal(parsed.complete, false)
})

test('an empty reply is not an answer', () => {
  for (const value of ['', '   ', null, undefined]) {
    const parsed = parseSessionAnswer(value)
    assert.equal(parsed.question, '')
    assert.equal(parsed.complete, false)
  }
})

test('choice lines survive three bullet styles and lose their backticks', () => {
  assert.deepEqual(readChoiceLines('- 一\n1. 二\n* `三`'), ['一', '二', '三'])
  assert.deepEqual(readChoiceLines('没有条目'), [])
})

test('choices are capped at four', () => {
  const body = ['- a', '- b', '- c', '- d', '- e', '- f'].join('\n')
  assert.equal(readChoiceLines(body).length, 4)
})

test('the last assistant text is read from a transcript', () => {
  const events = [
    { type: 'user/message', data: { content: [{ type: 'text', text: '问：做点什么' }] } },
    { type: 'assistant/message', data: { content: [{ type: 'text', text: '## 理解\n先理解目标' }] } },
  ]
  assert.match(lastAssistantText(events), /先理解目标/)
  assert.equal(lastAssistantText(null), '')
  assert.equal(lastAssistantText([]), '')
})

test('the read is not clipped at the acceptance prompt length', () => {
  const long = '交接书正文。'.repeat(600)
  const events = [{ type: 'assistant/message', data: { content: [{ type: 'text', text: long }] } }]
  assert.equal(lastAssistantText(events).length, long.length)
})
