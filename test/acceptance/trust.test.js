import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { ensureClaudeTrust } from '../../index.js'

test('ensureClaudeTrust writes a missing project trust record', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cod-trust-'))
  const previous = process.env.CLAUDE_CONFIG_DIR
  process.env.CLAUDE_CONFIG_DIR = dir
  try {
    const file = path.join(dir, '.claude.json')
    fs.writeFileSync(
      file,
      JSON.stringify({
        projects: {
          'D:/XiangMu/TrustTest': { hasTrustDialogAccepted: false, custom: 1 },
        },
        models: { 'model[1M]': 1, 'model[1m]': 2 },
      }),
    )
    const first = await ensureClaudeTrust('D:\\XiangMu\\TrustTest')
    assert.equal(first.changed, true)
    const saved = JSON.parse(fs.readFileSync(file, 'utf8'))
    assert.equal(saved.projects['D:/XiangMu/TrustTest'].hasTrustDialogAccepted, true)
    assert.equal(saved.projects['D:/XiangMu/TrustTest'].custom, 1)
    assert.equal(saved.models['model[1M]'], 1)
    assert.equal(saved.models['model[1m]'], 2)
    const second = await ensureClaudeTrust('D:\\XiangMu\\TrustTest')
    assert.equal(second.changed, false)
  } finally {
    if (previous === undefined) delete process.env.CLAUDE_CONFIG_DIR
    else process.env.CLAUDE_CONFIG_DIR = previous
    fs.rmSync(dir, { recursive: true, force: true })
  }
})
