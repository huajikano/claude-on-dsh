import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

// Load the browser bundle without a DOM or React install. The fake createElement
// invokes function components recursively, so a broken render path throws here.
let snapshot = null
globalThis.window = {
  __ModuleLoader__: {
    load(module) {
      globalThis.__capturedModule = module
    },
  },
  sessionStorage: {
    getItem: () => snapshot,
    setItem: () => {},
  },
  location: { hash: '', pathname: '', origin: 'http://127.0.0.1:65136' },
}
globalThis.document = {
  querySelector: () => null,
  createElement: () => ({ dataset: {}, remove() {} }),
  head: { appendChild() {} },
}

const source = await readFile(new URL('../../client.js', import.meta.url), 'utf8')
await import('../../client.js')

const FakeFragment = Symbol('Fragment')
function createElement(type, props, ...children) {
  if (type === FakeFragment) return children
  const merged = { ...(props || {}), children }
  if (typeof type === 'function') return type(merged)
  return { type, props: merged }
}
const React = {
  Fragment: FakeFragment,
  createElement,
  useCallback: (fn) => fn,
  useEffect: () => {},
  useMemo: (fn) => fn(),
  useRef: (value) => ({ current: value }),
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
}

const module = globalThis.__capturedModule.factory((name) => {
  assert.equal(name, 'react')
  return React
})

const dictionaries = {}
let panel = null
let mainOptions = null
const ctx = {
  effect(callback) {
    const disposer = callback()
    return typeof disposer === 'function' ? disposer : () => {}
  },
  locale: {
    register(namespace, value) {
      dictionaries[namespace] = value
      return () => {}
    },
    bind(namespace) {
      return (key) => (dictionaries[namespace] && dictionaries[namespace].zh[key]) || key
    },
  },
  slots: {
    inject(name, callback) {
      callback()
    },
    register(options, component) {
      if (options.name === 'main') {
        panel = component
        mainOptions = options
      }
      return () => {}
    },
  },
  sessions: {},
  uiWorkspace: {},
}
module.apply(ctx)
assert.ok(panel, 'main panel was registered')

const props = {
  panelId: 'claude-on-dsh',
  t: (key) => key,
  pickDirectory: async () => null,
  refreshSessions: async () => {},
  openSession: () => {},
  dispatchTask: async () => ({}),
  archiveTask: async () => {},
  acceptanceStatus: async () => ({}),
  acceptanceList: async () => ({ items: [] }),
  runAcceptance: async () => ({}),
  skipAcceptance: async () => ({}),
  reviewTerminal: async () => ({}),
  dispatchAcceptance: async () => ({}),
  runClaudeAcceptance: async () => ({}),
  askFirstQuestion: async () => ({}),
  sendFirstQuestion: async () => ({}),
  listSessions: async () => ({ items: [] }),
  currentSessionId: () => 'session-current',
  getSettings: async () => ({ autoAcceptance: true }),
  saveSettings: async () => ({}),
}

function contains(node, text) {
  if (node === null || node === undefined) return false
  if (typeof node === 'string') return node.includes(text)
  if (Array.isArray(node)) return node.some((child) => contains(child, text))
  if (typeof node === 'object') {
    if (Array.isArray(node.children) && node.children.some((child) => contains(child, text))) return true
    if (node.props && Array.isArray(node.props.children)) {
      return node.props.children.some((child) => contains(child, text))
    }
  }
  return false
}

function render(snapshotValue) {
  snapshot = snapshotValue === null ? null : JSON.stringify(snapshotValue)
  return panel(props)
}

test('every tt() key exists in both dictionaries', () => {
  const zh = Object.keys(dictionaries['claude-on-dsh'].zh)
  const en = Object.keys(dictionaries['claude-on-dsh'].en)
  assert.deepEqual([...zh].sort(), [...en].sort(), 'zh and en dictionaries must have the same keys')
  const keys = new Set([...source.matchAll(/tt\('([^']+)'/g)].map((match) => match[1]))
  keys.add('stepSetup')
  keys.add('stepAsk')
  keys.add('stepHandoff')
  for (const key of keys) {
    assert.ok(zh.includes(key), `missing zh key: ${key}`)
    assert.ok(en.includes(key), `missing en key: ${key}`)
  }
})

test('setup phase renders', () => {
  assert.ok(contains(render(null), '从一个目标开始'))
})

test('refined phase focuses on the handoff and folds the setup away', () => {
  const tree = render({
    v: 1,
    savedAt: Date.now(),
    phase: 'refined',
    refined: {
      projectTitle: 'Refined Project',
      summary: 'summary',
      plan: [],
      acceptance: [],
      risks: [],
      dshPrompt: 'prompt',
    },
    promptText: 'prompt',
  })
  assert.ok(contains(tree, 'Refined Project'))
  assert.ok(contains(tree, '项目设定'))
  assert.ok(contains(tree, '派发给 DSH 执行'))
})

test('dispatched phase surfaces the acceptance card above the collapse', () => {
  const tree = render({
    v: 1,
    savedAt: Date.now(),
    phase: 'dispatched',
    dispatch: { state: 'done', sessionId: 'session-x', title: 'Done Project', permission: 'danger-full-access' },
  })
  assert.ok(contains(tree, '已派发，DSH 开始执行'))
  assert.ok(contains(tree, 'Claude 验收'))
  assert.ok(contains(tree, '立即验收'))
})

test('requests carry a timeout signal and map aborts to a readable error', async () => {
  const originalFetch = globalThis.fetch
  let init
  globalThis.fetch = async (_url, options) => {
    init = options
    return { ok: true, status: 200, text: async () => '{"ok":true}' }
  }
  try {
    await mainOptions.inject().dispatchTask({ brief: 'x' })
    assert.ok(init.signal)
    assert.equal(typeof init.signal.aborted, 'boolean')
    globalThis.fetch = async () => {
      throw Object.assign(new Error('aborted'), { name: 'TimeoutError' })
    }
    await assert.rejects(() => mainOptions.inject().acceptanceStatus('session-x'), /请求超时/)
  } finally {
    globalThis.fetch = originalFetch
  }
})
