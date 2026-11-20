const MODE_IDS = ['plan', 'execute', 'review']

export const TASK_MODES = Object.freeze({
  plan: Object.freeze({
    id: 'plan',
    label: '规划',
    description: '只读规划，低频监工，不自动验收。',
    manualAcceptance: false,
    autoPrompt: false,
    defaultAction: 'none',
    supervision: Object.freeze({
      enabled: false,
      engine: 'cli',
      cooldownMs: 180000,
      retryBaseMs: 300000,
      maxRetries: 1,
      maxNoProgress: 1,
      maxRounds: 1,
    }),
  }),
  execute: Object.freeze({
    id: 'execute',
    label: '执行',
    description: '交给 DSH 执行，启用有边界的全局监工。',
    manualAcceptance: false,
    autoPrompt: false,
    defaultAction: 'none',
    supervision: Object.freeze({
      enabled: true,
      engine: 'cli',
      cooldownMs: 120000,
      retryBaseMs: 240000,
      maxRetries: 2,
      maxNoProgress: 2,
      maxRounds: 16,
    }),
  }),
  review: Object.freeze({
    id: 'review',
    label: '审查',
    description: '停止自动续跑，保留手动审查入口。',
    manualAcceptance: true,
    autoPrompt: false,
    defaultAction: 'none',
    supervision: Object.freeze({
      enabled: false,
      engine: 'cli',
      cooldownMs: 180000,
      retryBaseMs: 300000,
      maxRetries: 1,
      maxNoProgress: 1,
      maxRounds: 1,
    }),
  }),
})

export function taskModeConfig(id) {
  return TASK_MODES[id] || TASK_MODES.execute
}

export function normalizeTaskMode(id, fallback = 'execute') {
  return MODE_IDS.includes(id) ? id : fallback
}

export function taskModeItems(active = 'execute') {
  return MODE_IDS.map((id) => ({
    ...TASK_MODES[id],
    supervision: { ...TASK_MODES[id].supervision },
    active: id === active,
  }))
}

export function applyTaskMode(current, id) {
  const mode = taskModeConfig(normalizeTaskMode(id))
  return {
    ...current,
    taskMode: mode.id,
    manualAcceptance: mode.manualAcceptance,
    autoPrompt: mode.autoPrompt,
    defaultAction: mode.defaultAction,
    supervision: { ...current.supervision, ...mode.supervision },
  }
}
