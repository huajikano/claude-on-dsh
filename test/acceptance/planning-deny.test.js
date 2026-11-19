import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_PLANNING_DENY_TOOLS,
  claudePresetList,
  normalizePresetRows,
  planningDenyTools,
  shouldPinPermission,
} from '../../index.js'

test('the shipped deny list blocks every writing and running tool', () => {
  for (const tool of ['Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'Bash', 'BashOutput', 'KillShell']) {
    assert.ok(DEFAULT_PLANNING_DENY_TOOLS.includes(tool), `${tool} must be denied`)
  }
  // Reading is the planner's whole job; nothing read-only may be caught here.
  for (const tool of ['Read', 'Grep', 'Glob', 'WebFetch']) {
    assert.equal(DEFAULT_PLANNING_DENY_TOOLS.includes(tool), false, `${tool} must stay available`)
  }
})

test('an operator list replaces the default', () => {
  assert.deepEqual(planningDenyTools(['Write']), ['Write'])
})

test('an empty or malformed list falls back to the default', () => {
  assert.equal(planningDenyTools([]), DEFAULT_PLANNING_DENY_TOOLS)
  assert.equal(planningDenyTools(undefined), DEFAULT_PLANNING_DENY_TOOLS)
  assert.equal(planningDenyTools('Write'), DEFAULT_PLANNING_DENY_TOOLS)
  assert.equal(planningDenyTools([null, '  ']), DEFAULT_PLANNING_DENY_TOOLS)
})

test('blank entries are dropped from a gave list', () => {
  assert.deepEqual(planningDenyTools(['Write', ' ', 'Bash']), ['Write', 'Bash'])
})

test('a row array is the shape the picker expects', () => {
  const rows = normalizePresetRows([
    { id: 'standard', name: 'Standard', description: '默认', isDefault: true },
    { id: 'claude', name: 'Claude' },
  ])
  assert.deepEqual(rows.map((row) => row.id), ['standard', 'claude'])
  assert.equal(rows[0].isDefault, true)
  assert.equal(rows[1].description, '')
})

test('a map of id to row is read too', () => {
  const rows = normalizePresetRows({ claude: { description: 'Claude Code 运行时' }, minimal: {} })
  assert.deepEqual(rows.map((row) => row.id).sort(), ['claude', 'minimal'])
  assert.equal(rows.find((row) => row.id === 'claude').name, 'claude')
})

test('a Map and a bare id list both work', () => {
  assert.deepEqual(normalizePresetRows(new Map([['code', { name: 'Code' }]])).map((row) => row.id), ['code'])
  assert.deepEqual(normalizePresetRows(['standard', 'claude']).map((row) => row.id), ['standard', 'claude'])
})

test('a broken preset is left out, and duplicates collapse', () => {
  const rows = normalizePresetRows([
    { id: 'claude' },
    { id: 'claude', name: 'second' },
    { id: 'gone', broken: 'entry-local' },
  ])
  assert.deepEqual(rows.map((row) => row.id), ['claude'])
  assert.equal(rows[0].name, 'claude')
})

test('an unreadable roster is not a crash', () => {
  assert.deepEqual(normalizePresetRows(undefined), [])
  assert.deepEqual(normalizePresetRows('nonsense'), [])
  assert.deepEqual(normalizePresetRows([null, 42]), [])
})

test('a Claude session keeps its own permission mode', () => {
  // `auto` steps aside for a preset that owns the decision.
  assert.equal(shouldPinPermission({ configured: 'auto', agentPreset: 'claude', claudePresetIds: ['claude'] }), false)
})

test('a DSH-default preset still gets the access pin', () => {
  assert.equal(shouldPinPermission({ configured: 'auto', agentPreset: 'standard', claudePresetIds: ['claude'] }), true)
  assert.equal(shouldPinPermission({ configured: 'auto', agentPreset: '', claudePresetIds: ['claude'] }), true)
})

test('an explicit preset name is pinned whatever the agent preset is', () => {
  assert.equal(shouldPinPermission({ configured: 'danger-full-access', agentPreset: 'claude', claudePresetIds: ['claude'] }), true)
})

test('an empty preset name means never pin', () => {
  assert.equal(shouldPinPermission({ configured: '', agentPreset: 'standard', claudePresetIds: ['claude'] }), false)
})

test('the Claude preset list survives a malformed config', () => {
  assert.deepEqual(claudePresetList(['claude', ' claude-dev ']), ['claude', 'claude-dev'])
  assert.deepEqual(claudePresetList([]), ['claude'])
  assert.deepEqual(claudePresetList('claude'), ['claude'])
})
