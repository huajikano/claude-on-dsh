export const workspace = 'C:\\tmp\\ws'

export function sampleEvents() {
  return [
    {
      type: 'user/message',
      seq: 1,
      data: { role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: '实现登录功能并运行测试' }] },
    },
    {
      type: 'tool/call',
      seq: 2,
      data: { turn: 1, step: 1, callId: 'c1', name: 'pwsh', arguments: JSON.stringify({ command: 'node --test' }) },
    },
    {
      type: 'tool/result',
      seq: 3,
      data: {
        turn: 1,
        step: 1,
        message: {
          role: 'tool',
          toolCallId: 'c1',
          content: [{ type: 'text', text: '# pass 3\n# fail 0' }],
          isError: false,
        },
      },
    },
    {
      type: 'tool/call',
      seq: 4,
      data: { turn: 1, step: 1, callId: 'c2', name: 'write', arguments: JSON.stringify({ file_path: 'src/login.js' }) },
    },
    {
      type: 'tool/result',
      seq: 5,
      data: { turn: 1, step: 1, message: { role: 'tool', toolCallId: 'c2', content: [], isError: false } },
    },
    {
      type: 'assistant/message',
      seq: 6,
      data: { message: { role: 'assistant', content: [{ type: 'text', text: '已实现登录功能并补充测试。' }] } },
    },
    { type: 'turn/end', seq: 7, data: { turn: 1, reason: { kind: 'completed' } } },
  ]
}

export function sampleFacts(overrides = {}) {
  return {
    sessionId: 'session-test',
    workspace,
    meta: { id: 'session-test', cwd: workspace },
    now: 1_700_000_000_000,
    task: { summary: '实现登录功能并运行测试', sourceSeq: 1, text: '实现登录功能并运行测试' },
    assistant: { text: '已实现登录功能并补充测试。', sourceSeq: 6 },
    commands: [
      {
        tool: 'pwsh',
        command: 'node --test',
        output: '# pass 3',
        outputLength: 8,
        isError: false,
        callSeq: 2,
        resultSeq: 3,
        kind: 'verification',
        failedMarkers: false,
      },
    ],
    fileOps: [{ path: 'src/login.js', tool: 'write', isError: false, seq: 4 }],
    git: { available: true, head: 'abc123', files: [{ path: 'src/login.js', status: 'M', source: 'git' }], statusOutput: ' M src/login.js', error: '' },
    changedFiles: [{ path: 'src/login.js', status: 'M', source: 'git' }],
    end: { status: 'completed', turns: 1, lastSeq: 7 },
    missing: [],
    eventCount: 7,
    ...overrides,
  }
}

export function sampleReport(overrides = {}) {
  return {
    schemaVersion: '1.0',
    sessionId: 'session-test',
    workspace,
    generatedAt: '2026-10-29T00:00:00.000Z',
    status: 'completed',
    gatePolicy: 'auto',
    task: { summary: '实现登录功能并运行测试', sourceSeq: 1 },
    checks: [
      {
        id: 'goal-response',
        name: '改动是否回应任务目标',
        conclusion: 'pass',
        evidence: [
          {
            id: 'ev-1',
            type: 'event',
            locator: 'user/message#1',
            excerpt: '实现登录功能并运行测试',
          },
        ],
        note: 'ok',
      },
    ],
    overall: 'pass',
    rework: [],
    missing: [],
    meta: {
      durationMs: 10,
      evidenceCount: 1,
      judge: { status: 'completed', attempts: 1 },
    },
    ...overrides,
  }
}
