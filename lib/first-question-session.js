/**
 * The "first question asked inside a Claude session" path (L2).
 *
 * The default first question is a one-shot call: a prompt goes out, a JSON
 * document comes back, and nothing is written to any conversation. That is the
 * right default — planning should not leave an empty Session behind.
 *
 * This module is the opt-in alternative. The prompt is sent as an ordinary
 * message into a real Session whose agent preset is Claude, so the reader can
 * watch Claude think, and the answer arrives as prose rather than as a schema.
 * Two consequences follow, and both are handled here rather than in index.js:
 *
 *   1. The instruction asks for a fixed Markdown shape, because a conversation
 *      has no `outputFormat` to enforce one.
 *   2. The reply has to be read back out of the transcript, which means parsing
 *      that shape and degrading honestly when the model ignored it — never
 *      inventing a question the model did not ask.
 *
 * Everything here is pure: the Session work lives in index.js.
 */
import { eventText, extractAssistantFinal } from './acceptance/facts.js'

/** The headings the instruction asks for, in the order they must appear. */
export const SECTION_HEADINGS = {
  understanding: ['理解', '对目标的理解', 'understanding'],
  question: ['首问', '第一个问题', 'opening question', 'first question'],
  choices: ['候选答案', '候选', 'options', 'choices'],
  brief: ['交接书', '任务书', 'handoff', 'brief'],
}

/** Longest reply we will look at; a runaway transcript is not a first question. */
const MAX_REPLY_CHARS = 24_000

/**
 * The instruction sent as the Session's first message.
 *
 * It states the output shape three times in three ways on purpose — a heading
 * block, a worked skeleton, and a "do not" line — because this is prose the model
 * has to follow without a schema behind it.
 */
export function buildSessionPrompt({ projectName = '', projectDir = '', goal = '', requirement = '' } = {}) {
  const lines = [
    '你是本项目的「Claude 指挥官」，只负责三件事：理解需求、提出一个决定方案走向的首问、写一份可以直接执行的交接书。',
    '你不写代码、不修改文件、不执行命令、不调用工具。',
    '',
    '## 项目信息',
    `- 项目名称：${projectName || '（未填）'}`,
    `- 项目目录：${projectDir || '（未填）'}`,
    '- 用户目标：',
    goal || '（未填）',
  ]
  if (requirement) {
    lines.push('', '## 补充要求', requirement)
  }
  lines.push(
    '',
    '## 回答格式（必须严格遵守）',
    '只输出下面四个二级标题，顺序不变，不要写别的内容：',
    '',
    '## 理解',
    '用 3-6 句说明你对目标的理解，点明隐含约束与成功标准。',
    '',
    '## 首问',
    '只提出 1 个最关键的问题。它的不同答案必须会实质改变技术方案、范围或验收标准；不要问能从目标里推断的信息。',
    '',
    '## 候选答案',
    '给出 2-4 条可直接点选的短答案，每条一行，以「- 」开头。',
    '',
    '## 交接书',
    '一份自包含的任务书：背景、目标、范围、交付物、验收标准、约束。尚未确认的点标为「待确认」，不要虚构用户偏好。',
    '',
    '## 约束',
    '- 全部使用简体中文（用户使用其他语言时跟随用户语言）。',
    '- 不修改任何文件、不执行命令、不调用工具。',
    '- 不要输出 JSON，不要输出代码块，不要复述这段指令。',
  )
  return lines.join('\n')
}

/** Split a reply into `heading -> body` by the headings we recognise. */
function splitSections(reply) {
  const text = String(reply || '').replace(/\r\n/g, '\n')
  const sections = new Map()
  let current = null
  let buffer = []
  const flush = () => {
    if (current) sections.set(current, buffer.join('\n').trim())
    buffer = []
  }
  for (const line of text.split('\n')) {
    const heading = line.match(/^\s{0,3}#{1,6}\s*(.+?)\s*$/)
    const label = heading ? heading[1].toLowerCase() : ''
    const matched = label
      ? Object.entries(SECTION_HEADINGS).find(([, names]) =>
          names.some((name) => label.includes(name.toLowerCase())),
        )
      : undefined
    if (matched) {
      flush()
      current = matched[0]
      continue
    }
    if (current) buffer.push(line)
  }
  flush()
  return sections
}

/** `- one` / `1. one` / `* one` → ['one']. */
export function readChoiceLines(body) {
  return String(body || '')
    .split('\n')
    .map((line) => line.match(/^\s{0,3}(?:[-*+]|\d+[.)])\s+(.+?)\s*$/))
    .filter(Boolean)
    .map((match) => match[1].replace(/^`|`$/g, '').trim())
    .filter(Boolean)
    .slice(0, 4)
}

/**
 * Read a conversational reply into the same four fields the one-shot path
 * returns. `complete` is false when the model ignored the shape: the caller then
 * decides whether to keep the partial answer or fall back to the dialog, but it
 * never gets a fabricated question.
 */
export function parseSessionAnswer(reply) {
  const text = String(reply || '').slice(0, MAX_REPLY_CHARS).trim()
  if (!text) return { understanding: '', question: '', choices: [], brief: '', complete: false }

  const sections = splitSections(text)
  const understanding = (sections.get('understanding') || '').trim()
  let question = (sections.get('question') || '').trim()
  const choices = readChoiceLines(sections.get('choices'))
  const brief = (sections.get('brief') || '').trim()

  // A question heading that holds a paragraph is still the question; take the
  // first sentence that actually asks something, so the dialog has something to
  // show even when the model skipped the heading.
  if (!question) {
    const sentences = text.split(/[\n。]/).map((line) => line.trim()).filter(Boolean)
    question = sentences.find((line) => /[?？]/.test(line)) || ''
    if (question) question = question.slice(question.search(/[^，。；、\s]/))
  }

  const complete = Boolean(question && brief)
  return {
    understanding,
    question,
    choices,
    brief: brief || (complete ? '' : text),
    complete,
  }
}

/**
 * The last thing Claude said in a Session, as plain text.
 *
 * Read straight off the last `assistant/message` event rather than through
 * `extractAssistantFinal`, which clips to 2000 characters for the acceptance
 * prompt: a handoff book is longer than that, and a truncated one parses into a
 * truncated brief.
 */
export function lastAssistantText(events) {
  const list = Array.isArray(events) ? events : []
  for (let index = list.length - 1; index >= 0; index -= 1) {
    const event = list[index]
    if (!event || event.type !== 'assistant/message') continue
    const text = eventText(event.data || {}).trim()
    if (text) return text
  }
  try {
    const fallback = extractAssistantFinal(list)
    return typeof fallback === 'object' && fallback ? String(fallback.text || '').trim() : ''
  } catch {
    return ''
  }
}
