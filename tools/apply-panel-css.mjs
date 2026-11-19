#!/usr/bin/env node
/**
 * Install tools/panel.css as the panel's stylesheet inside client.js.
 *
 * The panel's whole stylesheet lives in one template literal (`const CSS = \`…\``),
 * which is also why CSS and JS have to be kept apart: a backtick or a `${` inside
 * that CSS silently ends the template. This script therefore (1) refuses to write
 * a stylesheet containing either, (2) parses it with postcss before touching the
 * file, and (3) swaps it in whole, so the CSS can be authored as a real .css file
 * with an editor that understands it.
 *
 *   node tools/apply-panel-css.mjs [--check]
 */
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { createRequire } from 'node:module'

/**
 * postcss is a dev convenience, not a dependency of this plugin (the shipped
 * bundle has none). When it is not installed the stylesheet is still checked for
 * the two characters that would break the template, and the parse step is simply
 * skipped — `node --check client.js` after the write is the real backstop.
 */
function loadPostcss() {
  const require = createRequire(import.meta.url)
  for (const specifier of ['postcss', 'D:/XiangMu/upstream-dsh-claude-style/node_modules/postcss/lib/postcss.mjs']) {
    try {
      return require(specifier)
    } catch {}
  }
  return null
}

const postcss = loadPostcss()

const CLIENT = 'D:/XiangMu/claude-on-dsh-2.1.4/client.js'
const CSS_FILE = 'D:/XiangMu/claude-on-dsh-2.1.4/tools/panel.css'
const BACKUP = `${CLIENT}.bak-panelcss`
const check = process.argv.includes('--check')

const css = readFileSync(CSS_FILE, 'utf8')

for (const [bad, why] of [['`', 'a backtick would end the JS template'], ['${', 'a template expression would be evaluated by JS']]) {
  if (css.includes(bad)) throw new Error(`panel.css contains ${JSON.stringify(bad)}: ${why}`)
}

if (postcss) {
  try {
    const root = postcss.parse(css, { from: CSS_FILE })
    let rules = 0
    root.walkRules(() => { rules += 1 })
    console.log(`panel.css parses: ${rules} rules, ${css.length} chars`)
  } catch (error) {
    throw new Error(`panel.css does not parse: ${error.message}`)
  }
} else {
  console.log(`panel.css: ${css.length} chars (postcss not installed; parse step skipped)`)
}

const source = readFileSync(CLIENT, 'utf8')
const anchor = source.indexOf('const CSS = `')
if (anchor < 0) throw new Error('the `const CSS = ' + '`' + '` template is gone; client.js moved')
const start = source.indexOf('`', anchor) + 1
const end = source.indexOf('`', start)
if (end < 0) throw new Error('could not find the end of the stylesheet template')

const current = source.slice(start, end)
const next = `\n${css.replace(/\s+$/, '')}\n`
const changed = current !== next
console.log(`stylesheet: ${current.length} -> ${next.length} chars (${changed ? 'changed' : 'identical'})`)
if (check) process.exit(changed ? 1 : 0)
if (!changed) process.exit(0)

if (!existsSync(BACKUP)) copyFileSync(CLIENT, BACKUP)
writeFileSync(CLIENT, source.slice(0, start) + next + source.slice(end), 'utf8')
console.log(`wrote ${CLIENT}`)
