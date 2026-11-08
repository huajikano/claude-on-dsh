import assert from 'node:assert/strict'
import test from 'node:test'
import { eventText, extractAssistantFinal, extractCriteria, extractTask, recentConversation } from '../../lib/acceptance/facts.js'

test('message helpers support direct and nested content', () => {
  const events = [
    {
      type: 'user/message',
      seq: 1,
      data: { source: { kind: 'user' }, content: [{ type: 'text', text: '原始目标' }] },
    },
    {
      type: 'assistant/message',
      seq: 2,
      data: { message: { content: [{ type: 'text', text: 'DSH 已完成第一步' }] } },
    },
    {
      type: 'user/message',
      seq: 3,
      data: { source: { kind: 'user-approval' }, content: [{ type: 'text', text: '不要计入' }] },
    },
  ]

  assert.equal(eventText(events[1].data), 'DSH 已完成第一步')
  assert.equal(extractTask(events).sourceSeq, 1)
  assert.equal(extractAssistantFinal(events).text, 'DSH 已完成第一步')
  assert.match(recentConversation(events, 8), /用户：原始目标/)
  assert.match(recentConversation(events, 8), /DSH：DSH 已完成第一步/)
  assert.doesNotMatch(recentConversation(events, 8), /不要计入/)
})

test('extractTask keeps the first real user request as the historical goal', () => {
  const result = extractTask([
    { type: 'user/message', seq: 4, data: { source: { kind: 'system' }, content: [{ type: 'text', text: 'system' }] } },
    { type: 'user/message', seq: 5, data: { source: { kind: 'user' }, content: [{ type: 'text', text: '首个任务' }] } },
    { type: 'user/message', seq: 6, data: { source: { kind: 'user' }, content: [{ type: 'text', text: '后续要求' }] } },
  ])
  assert.equal(result.sourceSeq, 5)
  assert.equal(result.text, '首个任务')
})

test('acceptance criteria receive stable ids from the original task', () => {
  const events = [{
    type: 'user/message',
    seq: 10,
    data: {
      source: { kind: 'user' },
      content: [{ type: 'text', text: '项目需求\n验收标准：\n1. npm test 全部通过\n2. 手机屏幕上没有横向滚动\n' }],
    },
  }]
  assert.deepEqual(extractCriteria(events), [
    { id: 'A1', text: 'npm test 全部通过' },
    { id: 'A2', text: '手机屏幕上没有横向滚动' },
  ])
})
