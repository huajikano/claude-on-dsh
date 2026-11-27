#!/usr/bin/env node
/**
 * Report which `cc-*` classes the panel's markup emits versus which panel.css
 * styles. Exits 1 when markup uses a class nothing styles — that is the only
 * condition worth gating a release on; a styled-but-unused rule is printed as
 * information.
 *
 * Three things this has to get right to be worth running:
 *
 *   1. The panel's stylesheet is inlined into client.js as `const CSS = \`…\``.
 *      Scanning client.js whole therefore finds every styled class in the
 *      "markup" too, and the check passes no matter what is missing. The CSS
 *      region is cut out before the scan.
 *   2. Class names are assembled at runtime — `cc-claudeStatus-${status}`,
 *      `cc-reviewBadge ${verdict}`. A name that runs into a `${` is a prefix,
 *      not a class: it expands against the stylesheet, so every styled class
 *      under it counts as used. Treating it as a class produced a phantom
 *      "missing cc-claudeStatus-" and four phantom "unused" entries.
 *   3. A few classes are composition modifiers that ride on a base class and are
 *      meant to have no rule of their own (`cc-textarea cc-promptEditor`). They
 *      are listed with the base they rely on, so the exemption is reviewable
 *      instead of a blanket ignore.
 *
 *   node tools/check-panel-coverage.mjs [--json]
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const CLIENT = fileURLToPath(new URL('../client.js', import.meta.url))
const CSS_FILE = fileURLToPath(new URL('./panel.css', import.meta.url))

/** Not panel classes: animation names the stylesheet owns alone. */
const NOT_MARKUP = [/^cc-spin/]

/**
 * Composition modifiers: always written next to a styled base class, so they
 * carry no rule of their own. Value is the base class that supplies the look.
 */
const COMPOSITION = new Map([
  ['cc-promptEditor', 'cc-textarea'],
  ['cc-devDocEditor', 'cc-textarea'],
  ['cc-draft', 'cc-textarea'],
  ['cc-pre', 'cc-prose'],
  ['cc-draftField', 'cc-field'],
  ['cc-devDocEntry', 'cc-recordItem'],
  ['cc-sessionWorkspace', 'cc-card'],
  ['cc-emptyCard', 'cc-card'],
])

/** Drop the inlined stylesheet so its selectors are not counted as markup. */
export function markupOnly(source) {
  const anchor = source.indexOf('const CSS = `')
  if (anchor < 0) return source
  const start = source.indexOf('`', anchor) + 1
  const end = source.indexOf('`', start)
  if (end < 0) return source
  return source.slice(0, anchor) + source.slice(end + 1)
}

/**
 * Split markup class names into whole names and template prefixes.
 * `cc-dot${on}` is a prefix; `cc-btn ${variant}` contributes the whole `cc-btn`.
 */
export function classesIn(source) {
  const names = new Set()
  const prefixes = new Set()
  for (const match of source.matchAll(/cc-[A-Za-z0-9_-]+/g)) {
    const after = source.slice(match.index + match[0].length, match.index + match[0].length + 2)
    if (after === '${') prefixes.add(match[0])
    else names.add(match[0])
  }
  return { names, prefixes }
}

export function styledIn(css) {
  const found = new Set()
  for (const match of css.matchAll(/\.(cc-[A-Za-z0-9_-]+)/g)) found.add(match[1])
  return found
}

export function compare({ names, prefixes }, styled) {
  const underPrefix = (name) => [...prefixes].some((prefix) => name.startsWith(prefix))
  const missing = [...names].filter((name) => {
    if (styled.has(name) || underPrefix(name)) return false
    if (COMPOSITION.has(name)) return !styled.has(COMPOSITION.get(name))
    return !NOT_MARKUP.some((re) => re.test(name))
  }).sort()
  const unused = [...styled].filter((name) => {
    if (NOT_MARKUP.some((re) => re.test(name))) return false
    if (names.has(name) || underPrefix(name)) return false
    for (const base of COMPOSITION.values()) if (base === name) return false
    return true
  }).sort()
  return { missing, unused }
}

const client = readFileSync(CLIENT, 'utf8')
const css = readFileSync(CSS_FILE, 'utf8')

const markup = classesIn(markupOnly(client))
const styled = styledIn(css)
const { missing, unused } = compare(markup, styled)

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({
    names: markup.names.size,
    prefixes: [...markup.prefixes].sort(),
    styled: styled.size,
    missing,
    unused,
  }, null, 2))
} else {
  console.log(`classes in markup: ${markup.names.size} (+${markup.prefixes.size} template prefixes)`)
  console.log(`classes styled:    ${styled.size}`)
  console.log(`missing styles (${missing.length}): ${missing.join(', ') || 'none'}`)
  console.log(`styled but unused (${unused.length}): ${unused.join(', ') || 'none'}`)
}

process.exitCode = missing.length > 0 ? 1 : 0
