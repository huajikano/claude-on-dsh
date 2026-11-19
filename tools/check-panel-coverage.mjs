import { readFileSync } from 'node:fs'

const client = readFileSync('D:/XiangMu/claude-on-dsh-2.1.4/client.js', 'utf8')
const css = readFileSync('D:/XiangMu/claude-on-dsh-2.1.4/tools/panel.css', 'utf8')

const used = new Set()
for (const match of client.matchAll(/['"`](cc-[A-Za-z0-9_-]+)/g)) used.add(match[1])

const styled = new Set()
for (const match of css.matchAll(/\.(cc-[A-Za-z0-9_-]+)/g)) styled.add(match[1])

const missing = [...used].filter((name) => !styled.has(name)).sort()
const unused = [...styled].filter((name) => !used.has(name) && !name.startsWith('cc-spin')).sort()

console.log(`classes in markup: ${used.size}`)
console.log(`classes styled:    ${styled.size}`)
console.log(`missing styles (${missing.length}): ${missing.join(', ') || 'none'}`)
console.log(`styled but unused (${unused.length}): ${unused.join(', ') || 'none'}`)
