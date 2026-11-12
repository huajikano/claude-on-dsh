import path from 'node:path'

function workspaceKey(cwd) {
  const resolved = path.resolve(cwd)
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved
}

/** Collapse ordinary fork families to their most recently active selectable leaf.
 * Titles never establish identity. Blank rows may connect a chain, but neither
 * blank sessions nor subagents can become its continuation target.
 */
export function latestForkSessions(items) {
  const rows = items.filter((item) => item && typeof item.sessionId === 'string'
    && item.sessionId && typeof item.cwd === 'string' && item.cwd && !item.origin)
  const allById = new Map(items.filter(Boolean).map((item) => [item.sessionId, item]))
  const byKey = new Map()
  const parents = new Map()
  const sets = new Map()
  const keyOf = (row, id = row.sessionId) => `${workspaceKey(row.cwd)}\0${id}`
  for (const row of rows) byKey.set(keyOf(row), row)

  function root(key) {
    if (!sets.has(key)) sets.set(key, key)
    let current = key
    while (sets.get(current) !== current) current = sets.get(current)
    while (key !== current) {
      const next = sets.get(key)
      sets.set(key, current)
      key = next
    }
    return current
  }

  for (const row of rows) {
    const key = keyOf(row)
    root(key)
    if (typeof row.parentSessionId !== 'string' || !row.parentSessionId) continue
    const parent = keyOf(row, row.parentSessionId)
    // A missing parent still connects siblings, without mixing workspaces or subagents.
    const parentRow = allById.get(row.parentSessionId)
    if (parentRow && (parentRow.origin || !parentRow.cwd || workspaceKey(parentRow.cwd) !== workspaceKey(row.cwd))) continue
    parents.set(key, parent)
    sets.set(root(key), root(parent))
  }

  const superseded = new Set()
  for (const row of rows) {
    if (row.blank) continue
    let parent = parents.get(keyOf(row))
    while (parent && !superseded.has(parent)) {
      superseded.add(parent)
      parent = parents.get(parent)
    }
  }

  const groups = new Map()
  for (const [key, row] of byKey) {
    const id = root(key)
    if (!groups.has(id)) groups.set(id, [])
    groups.get(id).push({ key, row })
  }
  const newestFirst = (left, right) => (Number(right.updatedAt) || 0) - (Number(left.updatedAt) || 0)
    || left.sessionId.localeCompare(right.sessionId)
  const selected = []
  for (const family of groups.values()) {
    const eligible = family.filter(({ row }) => !row.blank)
    if (!eligible.length) continue
    const leaves = eligible.filter(({ key }) => !superseded.has(key))
    // Malformed cycles have no leaf: choose deterministically instead of hanging or dropping the family.
    const latest = (leaves.length ? leaves : eligible).map(({ row }) => row).sort(newestFirst)[0]
    selected.push({
      ...latest,
      forkSessionIds: family.map(({ row }) => row.sessionId).sort(),
    })
  }
  return selected.sort(newestFirst)
}
