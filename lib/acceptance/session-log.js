/**
 * Read a persisted Session log without the Host: DSH appends one zstd frame
 * per flush, so decode each frame and concatenate the JSON lines.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { zstdDecompressSync } from 'node:zlib'

const MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd])

export function decodeZstdFrames(buffer) {
  const starts = []
  for (let index = 0; index + 3 < buffer.length; index += 1) {
    if (
      buffer[index] === MAGIC[0] &&
      buffer[index + 1] === MAGIC[1] &&
      buffer[index + 2] === MAGIC[2] &&
      buffer[index + 3] === MAGIC[3]
    ) {
      starts.push(index)
    }
  }
  if (starts.length === 0) {
    return zstdDecompressSync(buffer)
  }
  const chunks = []
  let cursor = 0
  while (cursor < starts.length) {
    let next = cursor + 1
    let decoded = null
    while (next <= starts.length) {
      const end = next < starts.length ? starts[next] : buffer.length
      try {
        decoded = zstdDecompressSync(buffer.subarray(starts[cursor], end))
        break
      } catch {
        next += 1
      }
    }
    if (!decoded) throw new Error(`cannot decode zstd frame at byte ${starts[cursor]}`)
    chunks.push(decoded)
    cursor = next
  }
  return Buffer.concat(chunks)
}

export function findSessionLog(home, sessionId) {
  const sessions = path.join(home, 'sessions')
  if (!existsSync(sessions)) throw new Error(`sessions directory not found: ${sessions}`)
  const candidates = []
  for (const workspaceDir of readdirSync(sessions)) {
    const dir = path.join(sessions, workspaceDir, sessionId)
    if (!existsSync(dir)) continue
    for (const name of readdirSync(dir)) {
      if (/^session\..*\.jsonl(\.zstd)?$/.test(name)) candidates.push(path.join(dir, name))
    }
  }
  if (candidates.length === 0) throw new Error(`session log not found for ${sessionId}`)
  return candidates.sort((left, right) => statSync(right).size - statSync(left).size)[0]
}

export function readSessionLog(file) {
  const raw = readFileSync(file)
  const buffer = file.endsWith('.zstd') ? decodeZstdFrames(raw) : raw
  const lines = buffer.toString('utf8').split(/\r?\n/).filter((line) => line.trim() !== '')
  let meta = null
  const events = []
  for (const line of lines) {
    let record
    try {
      record = JSON.parse(line)
    } catch {
      continue
    }
    if (record.type === 'session') {
      meta = record
      continue
    }
    if (typeof record.type === 'string' && typeof record.seq === 'number') {
      events.push(record)
    }
  }
  if (!meta) throw new Error(`session header missing in ${file}`)
  return { meta, events, file }
}
