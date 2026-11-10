import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEV_DOC_ROLES, devDocTemplate, analyzeDevDocInput, preserveUserBrief,
  buildDevDocReviewPrompt, normalizeDevDoc, devDocApprovalIssues,
} from '../../lib/devdoc.js'

const goalHint = '谁来用、要解决什么问题、希望实现什么结果。'
const featureHint = '一条一行，可区分“必须做”和“最好有”。'
const resourceHint = '已有代码、技术栈、接口、数据、素材或设备；没有可写“无”，技术未定可写“请 Claude 推荐”。'
const filled = () => devDocTemplate({ projectName: 'Demo', projectDir: 'D:\\Projects\\demo' })
  .replace(goalHint, '为同事管理合同，提前看到即将到期的合同。')
  .replace(featureHint, '必须：导入合同清单、按到期日筛选。')
  .replace(resourceHint, '无，请 Claude 推荐技术。')
const plan = () => `# Demo 开发文档

## 一、用户需求
### 1. 项目名称
Demo
### 2. 目标与使用场景
管理合同
### 3. 需要的功能
导入合同
### 4. 已有技术与资源
无

## 二、开发方案
| 功能编号 | 功能与边界 | 优先级 | 验收编号与通过条件 | 验证方式及所需证据 |
|---|---|---|---|---|
| F1 | 导入合同清单 | 必须 | A1：三条合同导入后数量正确 | 操作导入并截图记录条目数 |

## 三、美术与交互方案
沿用现有风格，确认关键页面后再扩展；交付时检查实际运行效果。

## 四、评审与交付
用户确认：待确认
`
const approved = () => ({
  verdict: 'approved', summary: '方案可实施', questions: [], blockers: [],
  departments: DEV_DOC_ROLES.map(([id, name, , kind]) => ({
    id, name,
    decision: kind === 'conditional' ? 'not_applicable' : 'approve',
    reason: kind === 'conditional' ? '纯本机静态页面，无敏感数据、不打包或部署。' : '范围和验证方法已明确。',
  })),
})
const normalize = (data = approved(), content = plan()) => normalizeDevDoc(data, {
  title: 'Demo', projectDir: 'D:\\Projects\\demo', content, sourceContent: filled(),
})

test('new template matches the approved concise design and pre-fills project information', () => {
  const template = devDocTemplate({ projectName: 'Demo', projectDir: 'D:\\Projects\\demo', goal: '合同提醒' })
  assert.match(template, /项目目录：D:\\Projects\\demo/)
  assert.match(template, /【用户填写】合同提醒/)
  assert.doesNotMatch(template, /\{\{|国企|政府|采购|财务/)
  assert.match(template, /美术 \/ 交互组/)
  assert.match(template, /原型或效果供用户确认/)
  assert.match(template, /实际运行的截图或录屏/)
  assert.match(template, /Claude 不代填确认结果/)
  assert.equal(DEV_DOC_ROLES.length, 7)
  assert.equal(DEV_DOC_ROLES.some(([id]) => id === 'user'), false)
})

test('empty exported template rejects unchanged hint text and accepts no resources', () => {
  const empty = analyzeDevDocInput(devDocTemplate())
  assert.equal(empty.valid, false)
  assert.deepEqual(empty.missing, ['目标与使用场景', '需要的功能', '已有技术与资源'])
  assert.equal(analyzeDevDocInput(filled()).valid, true)
  assert.equal(analyzeDevDocInput(filled().replace('无，请 Claude 推荐技术。', '无')).valid, true)
  assert.equal(analyzeDevDocInput(filled().replace('无，请 Claude 推荐技术。', '')).valid, false)
})

test('legacy long bracketed answers are accepted without substring false positives', () => {
  const answer = '我需要开发的功能包括移动端连接电脑并使用项目工具。'.repeat(10)
  const old = `# Demo\n## 一、用户需求简报（只填这里）\n### 2. 我想做什么\n【用户填写】{{${answer}}}\n### 3. 需要开发的功能\n【用户填写】{{在手机上操作电脑中的项目}}\n### 4. 已有技术、代码和资源\n【用户填写】{{自行在市场或 GitHub 调研}}\n`
  const result = analyzeDevDocInput(old)
  assert.equal(result.valid, true)
  assert.match(result.content, /我需要开发的功能/)
  assert.doesNotMatch(result.content, /\{\{/)
  const blank = analyzeDevDocInput(old.replace(answer, '需求描述'))
  assert.equal(blank.valid, false)
  assert.deepEqual(blank.placeholders, ['{{需求描述}}'])
})

test('template expressions in code and plain-form legacy documents still import', () => {
  const doc = filled().replace('必须：导入合同清单、按到期日筛选。', '必须：支持 Vue {{ title }} 插值和自定义组件。')
  const result = analyzeDevDocInput(doc)
  assert.equal(result.valid, true)
  assert.match(result.content, /\{\{ title \}\}/)
  assert.equal(analyzeDevDocInput('# 项目\n目标：合同提醒\n功能：列表\n资源：无').valid, true)
})

test('missing or duplicate numbered required fields do not count as filled', () => {
  const doc = filled().replace('### 3. 需要的功能（必填）', '### 可选功能')
  assert.equal(analyzeDevDocInput(doc).valid, false)
  assert.equal(analyzeDevDocInput(filled().replace('### 5. 参考项目与界面风格（可选）', '### 3. 重复功能')).valid, false)
})

test('review preserves the user brief rather than accepting rewritten requirements', () => {
  const original = filled()
  const generated = plan()
  const preserved = preserveUserBrief(generated, original)
  const rawBrief = original.slice(original.indexOf('## 一、用户需求'), original.indexOf('## 二、开发方案')).trim()
  assert.ok(preserved.includes(rawBrief))
  assert.match(preserved, /## 三、美术与交互方案/)
  assert.equal(analyzeDevDocInput(preserved).valid, true)
})

test('prompt carries F/A mapping, user-only confirmation, and practical design checks', () => {
  const prompt = buildDevDocReviewPrompt({ projectDir: 'D:\\demo', projectName: 'Demo', content: filled() })
  assert.match(prompt, /A 验收编号/)
  assert.match(prompt, /字体\/间距\/组件\/素材/)
  assert.match(prompt, /用户确认状态只能是“待确认”/)
  assert.match(prompt, /预审不能声称成品已经通过验收/)
  assert.match(prompt, /questions 只列阻塞开工/)
})

test('only complete, reasoned role review with concrete acceptance conditions passes', () => {
  const doc = normalize()
  assert.equal(doc.status, 'approved')
  assert.deepEqual(devDocApprovalIssues(doc), [])
  assert.equal(normalize(approved(), plan().replace('A1：三条合同导入后数量正确', 'A1：')).status, 'needs_info')
  assert.equal(normalize(approved(), '# 不完整文档').status, 'needs_info')
})

test('missing optional role, duplicate role and empty reason cannot silently pass', () => {
  const missing = approved()
  missing.departments = missing.departments.filter((row) => row.id !== 'security')
  assert.equal(normalize(missing).status, 'needs_info')
  const duplicate = approved()
  duplicate.departments.push({ ...duplicate.departments[0] })
  assert.equal(normalize(duplicate).status, 'needs_info')
  const emptyReason = approved()
  emptyReason.departments[0].reason = ''
  assert.equal(normalize(emptyReason).status, 'needs_info')
})

test('reported blockers or unresolved questions prevent approved verdicts', () => {
  assert.equal(normalize({ ...approved(), blockers: ['缺少接口契约'] }).status, 'needs_info')
  assert.equal(normalize({ ...approved(), questions: ['是否需要离线？'] }).status, 'needs_info')
  const rejected = approved()
  rejected.departments[0].decision = 'reject'
  assert.equal(normalize(rejected).status, 'rejected')
})

test('a content change invalidates approval while valid earlier role documents remain readable', () => {
  const doc = normalize()
  assert.ok(devDocApprovalIssues({ ...doc, content: doc.content + '\n修改' }).length)
  const legacy = { ...doc, reviewVersion: undefined }
  legacy.departments.push({ id: 'user', decision: 'approve', reason: '按旧规则' })
  assert.deepEqual(devDocApprovalIssues(legacy), [])
})
