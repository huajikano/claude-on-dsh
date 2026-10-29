/**
 * Report rendering and durable output: <workspace>/.dsh/acceptance/<id>.{json,md}
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { clip } from './contract.js'

function bulletList(items) {
  const list = items.filter((item) => typeof item === 'string' && item.trim() !== '')
  return list.length === 0 ? '_none_' : list.map((item) => `- ${item}`).join('\n')
}

export function renderMarkdown(report) {
  const lines = []
  lines.push(`# 验收报告 · ${report.sessionId}`)
  lines.push('')
  lines.push(`- 总结论：**${report.overall.toUpperCase()}**`)
  lines.push(`- 状态：${report.status}`)
  lines.push(`- 策略：${report.gatePolicy}`)
  lines.push(`- Workspace：\`${report.workspace}\``)
  lines.push(`- 生成时间：${report.generatedAt}`)
  lines.push(`- 取证时间：${report.meta.fetchedAt || report.generatedAt}`)
  lines.push(`- 会话事件数：${report.meta.eventCount ?? 'unknown'}`)
  lines.push(`- 判定模型：${report.meta.judge.model || 'unknown'}（${report.meta.judge.status}，尝试 ${report.meta.judge.attempts ?? 0} 次）`)
  lines.push('')
  lines.push('## 任务')
  lines.push('')
  lines.push(report.task.summary || '_会话中没有可识别的用户任务消息。_')
  lines.push('')
  lines.push('## 总结')
  lines.push('')
  lines.push(report.meta.summary || '_none_')
  lines.push('')
  lines.push('## 检查项')
  lines.push('')
  lines.push('| 检查项 | 结论 | 证据定位 | 说明 |')
  lines.push('|---|---|---|---|')
  for (const check of report.checks) {
    const locators = check.evidence.map((item) => item.locator).join('<br>') || '_无_'
    lines.push(`| ${check.name} (\`${check.id}\`) | **${check.conclusion}** | ${locators} | ${check.note.replace(/\|/g, '\\|')} |`)
  }
  lines.push('')
  lines.push('## 证据（可按此逐条复核）')
  lines.push('')
  if (report.checks.every((check) => check.evidence.length === 0)) {
    lines.push('_没有可定位证据；所有结论不应被当作 pass。_')
  }
  for (const check of report.checks) {
    for (const item of check.evidence) {
      lines.push(`### ${item.id} · ${item.type}`)
      lines.push('')
      lines.push(`- locator：\`${item.locator}\``)
      if (item.path) lines.push(`- path：\`${item.path}\``)
      if (item.command) lines.push(`- command：\`${item.command}\``)
      if (item.lines) lines.push(`- lines：${item.lines[0]}–${item.lines[1]}`)
      lines.push('')
      lines.push('```text')
      lines.push(clip(item.excerpt, 1200))
      lines.push('```')
      lines.push('')
    }
  }
  lines.push('## 返工建议')
  lines.push('')
  lines.push(bulletList(report.rework))
  lines.push('')
  lines.push('## 缺失判据')
  lines.push('')
  lines.push(bulletList(report.missing))
  lines.push('')
  lines.push('## 元信息')
  lines.push('')
  lines.push('```json')
  lines.push(JSON.stringify(report.meta, null, 2))
  lines.push('```')
  lines.push('')
  return `${lines.join('\n')}\n`
}

export async function writeReports(workspace, report, options = {}) {
  const reportDir = options.reportDir || '.dsh/acceptance'
  const root = path.resolve(workspace)
  const target = path.resolve(root, reportDir)
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    throw new Error(`reportDir escapes the workspace: ${reportDir}`)
  }
  await mkdir(target, { recursive: true })
  const base = path.join(target, report.sessionId)
  const jsonPath = `${base}.json`
  const mdPath = `${base}.md`
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  await writeFile(mdPath, renderMarkdown(report), 'utf8')
  return { jsonPath, mdPath, dir: target }
}
