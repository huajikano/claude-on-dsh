/**
 * Checker registry. Each checker is a pure function of normalized facts and
 * returns {id, name, conclusion, evidence, note}; the judge may refine the
 * conclusion but must cite the same evidence ids.
 */
import { clip } from './contract.js'

export function createEvidenceBag() {
  const items = []
  let counter = 0
  return {
    add(prefix, item) {
      counter += 1
      const evidence = { id: `${prefix}-${counter}`, ...item }
      items.push(evidence)
      return evidence
    },
    all: () => items,
  }
}

function commandEvidence(bag, command) {
  const detail = command.summary || command.outputTail || command.output
  return bag.add('cmd', {
    type: command.kind === 'verification' ? 'test' : 'command',
    command: command.command,
    locator: `tool/call#${command.callSeq} → tool/result#${command.resultSeq}`,
    excerpt: detail && detail.trim() !== '' ? clip(detail, 500) : '(empty output)',
  })
}

function fileEvidence(bag, file) {
  return bag.add('file', {
    type: 'file',
    path: file.path,
    locator: file.source === 'git' || file.source === 'git-diff' ? 'git status' : `tool/call#${file.seq ?? '?'}`,
    excerpt: clip(`${file.status} ${file.path}`, 300),
  })
}

function globToRegExp(pattern) {
  const normalized = pattern.replace(/\\/g, '/').replace(/^\.\//, '')
  let source = ''
  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index]
    if (char === '*') {
      if (normalized[index + 1] === '*') {
        source += '.*'
        index += 1
      } else {
        source += '[^/]*'
      }
    } else if (char === '?') source += '.'
    else source += char.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${source}$`, 'i')
}

export function isAllowedPath(filePath, workspace, allowedPaths = []) {
  const normalizedRoot = workspace.replace(/\\/g, '/').replace(/\/$/, '')
  let normalizedFile = filePath.replace(/\\/g, '/')
  // git status and write/edit arguments often carry workspace-relative paths.
  if (!/^[A-Za-z]:|^\//.test(normalizedFile)) normalizedFile = `${normalizedRoot}/${normalizedFile}`
  const inside = normalizedFile.toLowerCase().startsWith(`${normalizedRoot.toLowerCase()}/`)
  if (inside) {
    const relative = normalizedFile.slice(normalizedRoot.length + 1)
    if (allowedPaths.length === 0) return true
    return allowedPaths.some((pattern) => globToRegExp(pattern).test(relative))
  }
  return allowedPaths.some((pattern) => /^[A-Za-z]:|^\//.test(pattern.replace(/\\/g, '/')) && globToRegExp(pattern).test(normalizedFile))
}

function tokensOf(value) {
  const text = typeof value === 'string' ? value.toLowerCase() : ''
  const latin = text.match(/[a-z0-9_-]{2,}/g) ?? []
  const cjk = text.match(/[\u4e00-\u9fff]{2,}/g) ?? []
  const grams = []
  for (const chunk of cjk) {
    for (let index = 0; index < chunk.length - 1; index += 1) grams.push(chunk.slice(index, index + 2))
  }
  return new Set([...latin, ...grams])
}

export function overlapCount(left, right) {
  let count = 0
  for (const token of left) if (right.has(token)) count += 1
  return count
}

/** Check 1: did the change address the task goal? */
export const goalChecker = {
  id: 'goal-response',
  name: '改动是否回应任务目标',
  run(facts, _options, bag) {
    const evidence = []
    if (facts.task.text === '') {
      return { id: this.id, name: this.name, conclusion: 'uncertain', evidence, note: '会话中没有可识别的用户任务消息。' }
    }
    evidence.push(
      bag.add('ev', {
        type: 'event',
        locator: `user/message#${facts.task.sourceSeq}`,
        excerpt: clip(facts.task.summary, 500),
      }),
    )
    if (facts.assistant.text !== '') {
      evidence.push(
        bag.add('ev', {
          type: 'event',
          locator: `assistant/message#${facts.assistant.sourceSeq}`,
          excerpt: clip(facts.assistant.text, 500),
        }),
      )
    }
    for (const file of facts.changedFiles.slice(0, 8)) evidence.push(fileEvidence(bag, file))
    if (facts.changedFiles.length === 0 && facts.assistant.text === '') {
      return { id: this.id, name: this.name, conclusion: 'uncertain', evidence, note: '没有改动文件，也没有最终回复，无法判断是否回应目标。' }
    }
    const taskTokens = tokensOf(facts.task.text)
    const responseText = [facts.assistant.text, ...facts.changedFiles.map((file) => file.path)].join('\n')
    const overlap = overlapCount(taskTokens, tokensOf(responseText))
    const conclusion = overlap >= 3 ? 'pass' : overlap === 0 ? 'fail' : 'uncertain'
    return {
      id: this.id,
      name: this.name,
      conclusion,
      evidence,
      note: `机器初判：任务与改动/回复的关键词重合 ${overlap} 个；最终结论由 Claude 复核。`,
    }
  },
}

/** Check 2: did captured build/test/lint output pass? */
export const verificationChecker = {
  id: 'verification',
  name: '构建 / 测试 / lint 是否通过',
  run(facts, _options, bag) {
    const relevant = facts.commands
      .filter((command) => command.kind === 'verification')
      .sort((left, right) => left.resultSeq - right.resultSeq)
    if (relevant.length === 0) {
      return {
        id: this.id,
        name: this.name,
        conclusion: 'uncertain',
        evidence: [],
        note: '没有捕获到 build / test / lint 命令及其输出。',
      }
    }
    // Final state, not history: a later passing run supersedes an earlier
    // failure of the same work. The report still names the superseded runs in
    // its note so a human can review the timeline.
    const last = relevant[relevant.length - 1]
    const evidence = [commandEvidence(bag, last)]
    const failed = last.isError || last.failedMarkers
    if (failed) {
      return {
        id: this.id,
        name: this.name,
        conclusion: 'fail',
        evidence,
        note: `最后一次构建/测试命令失败或包含失败标记（共捕获 ${relevant.length} 次验证运行）。`,
      }
    }
    const hasSignal = (last.summary && last.summary.trim() !== '') || last.outputLength > 0
    if (!hasSignal) {
      return {
        id: this.id,
        name: this.name,
        conclusion: 'uncertain',
        evidence,
        note: '最后一次验证命令以成功状态结束但输出为空，按规则不能判 pass。',
      }
    }
    return {
      id: this.id,
      name: this.name,
      conclusion: 'pass',
      evidence,
      note: `最后一次验证运行（\`${clip(last.command, 160)}\`）未发现失败标记${
        relevant.length > 1 ? `；此前 ${relevant.length - 1} 次运行仅作时间线参考` : ''
      }。`,
    }
  },
}

/** Check 3: did the session touch only allowed paths? */
export const scopeChecker = {
  id: 'scope',
  name: '是否越权改动无关文件',
  run(facts, options, bag) {
    const allowedPaths = options.allowedPaths ?? []
    const evidence = []
    // A clean worktree is still evidence. Emitting an item even when `git
    // status` is empty keeps a `pass` verdict legal under the report contract,
    // instead of forcing the whole report into the assembly-failure fallback.
    const gitEvidence = facts.git.available
      ? bag.add('cmd', {
          type: 'command',
          command: 'git status --porcelain=v1 --untracked-files=all',
          locator: `git@${facts.git.head || (facts.git.hasHead === false ? 'no-head' : 'unknown')}`,
          excerpt:
            facts.git.statusOutput !== ''
              ? clip(facts.git.statusOutput, 500)
              : '(clean worktree: no changes)',
        })
      : null
    if (facts.changedFiles.length === 0) {
      if (gitEvidence) evidence.push(gitEvidence)
      return {
        id: this.id,
        name: this.name,
        conclusion: facts.git.available ? 'pass' : 'uncertain',
        evidence,
        note: facts.git.available
          ? `git 工作区干净，没有改动文件${facts.git.hasHead === false ? '（仓库尚无提交，按未跟踪文件判断）' : ''}。`
          : 'git 不可用，且没有捕获到文件写入。',
      }
    }
    const violations = []
    for (const file of facts.changedFiles.slice(0, 30)) {
      const item = fileEvidence(bag, file)
      evidence.push(item)
      if (!isAllowedPath(file.path, facts.workspace, allowedPaths)) violations.push(file)
    }
    if (gitEvidence) evidence.push(gitEvidence)
    if (violations.length > 0) {
      return {
        id: this.id,
        name: this.name,
        conclusion: 'fail',
        evidence,
        note: `${violations.length} 个改动文件不在允许路径内（允许：${allowedPaths.length > 0 ? allowedPaths.join(', ') : '工作区内任意路径'}）。`,
      }
    }
    return {
      id: this.id,
      name: this.name,
      conclusion: 'pass',
      evidence,
      note: `${facts.changedFiles.length} 个改动文件全部位于允许路径内。`,
    }
  },
}

export const DEFAULT_CHECKERS = [goalChecker, verificationChecker, scopeChecker]

export function runCheckers(facts, options = {}) {
  const bag = createEvidenceBag()
  const checks = DEFAULT_CHECKERS.map((checker) => checker.run(facts, options, bag))
  return { checks, evidence: bag.all() }
}
