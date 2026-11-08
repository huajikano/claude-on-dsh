import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DEFAULT_KEEP = 16

export function createJobs({ file = '', keep = DEFAULT_KEEP } = {}) {
  const jobs = new Map()
  let persistence = Promise.resolve()

  if (file) {
    try {
      const saved = JSON.parse(readFileSync(file, 'utf8'))
      if (Array.isArray(saved)) {
        for (const item of saved) {
          if (!item || typeof item.id !== 'string') continue
          const job = item.state === 'running'
            ? {
                ...item,
                state: 'interrupted',
                phase: 'Host 重启时任务中断',
                error: 'Host restarted while this task was running',
                finishedAt: Date.now(),
              }
            : item
          jobs.set(job.id, job)
        }
      }
    } catch {}
  }

  function persist() {
    if (!file) return
    const snapshot = [...jobs.values()].map(({ cancel, cancelRequested, ...item }) => item)
    const task = persistence.then(async () => {
      await mkdir(path.dirname(file), { recursive: true })
      const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`
      await writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
      await rename(temporary, file)
    })
    persistence = task.catch(() => {})
  }

  function prune() {
    if (jobs.size <= keep) return
    const finished = [...jobs.values()]
      .filter((job) => job.state !== 'running')
      .sort((left, right) => left.startedAt - right.startedAt)
    while (jobs.size > keep && finished.length > 0) {
      jobs.delete(finished.shift().id)
    }
    persist()
  }

  function list() {
    return [...jobs.values()]
      .sort((left, right) => right.startedAt - left.startedAt)
      .map(serialize)
  }

  function serialize(job) {
    if (!job) return null
    return {
      id: job.id,
      kind: job.kind,
      state: job.state,
      phase: job.phase,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
      result: job.result,
      meta: job.meta,
      error: job.error,
      hint: job.hint,
      payload: job.payload,
    }
  }

  function update(id, patch) {
    const job = jobs.get(id)
    if (!job || job.state !== 'running') return false
    Object.assign(job, patch)
    persist()
    return true
  }

  function initialPhase(kind) {
    return ({
      brief: 'Claude 正在理解需求',
      refine: 'Claude 正在定稿交接书',
      'first-question': 'Claude 正在读取对话并生成首问',
      'acceptance-brief': 'Claude 正在生成验收任务书',
      acceptance: 'Claude 正在独立验收',
      devdoc: 'Claude 正在预审开发文档',
    })[kind] || '正在处理'
  }

  function start(kind, begin, payload) {
    const job = {
      id: randomUUID(),
      kind,
      state: 'running',
      phase: initialPhase(kind),
      startedAt: Date.now(),
      payload,
      cancelRequested: false,
      cancel: null,
    }
    jobs.set(job.id, job)
    persist()

    try {
      const output = begin({
        id: job.id,
        payload: (value) => update(job.id, { payload: value }),
        update: (patch) => update(job.id, patch),
        setCancel: (cancel) => {
          if (typeof cancel !== 'function') return
          if (job.state !== 'running') {
            try { cancel() } catch {}
            return
          }
          if (job.cancelRequested) {
            try { cancel() } catch {}
            return
          }
          job.cancel = cancel
          persist()
        },
      })
      const promise = output && typeof output.then === 'function' ? output : output?.promise
      if (!job.cancel && typeof output?.cancel === 'function') job.cancel = output.cancel
      if (!promise || typeof promise.then !== 'function') {
        throw new TypeError('Job handler must return a promise or { promise, cancel }')
      }
      Promise.resolve(promise).then(
        (value) => {
          if (job.state !== 'running') return
          const result = value && Object.hasOwn(value, 'data') ? value.data : value
          const meta = value && Object.hasOwn(value, 'meta') ? value.meta : undefined
          Object.assign(job, {
            state: 'done',
            phase: '完成',
            result,
            meta,
            finishedAt: Date.now(),
            cancel: null,
          })
          persist()
          prune()
        },
        (error) => {
          if (job.state !== 'running') return
          Object.assign(job, {
            state: error && error.status === 409 ? 'cancelled' : 'error',
            phase: '结束',
            error: error?.message || String(error),
            hint: error?.hint || '',
            finishedAt: Date.now(),
            cancel: null,
          })
          persist()
          prune()
        },
      )
    } catch (error) {
      Object.assign(job, {
        state: 'error',
        phase: '结束',
        error: error?.message || String(error),
        hint: error?.hint || '',
        finishedAt: Date.now(),
        cancel: null,
      })
      persist()
      prune()
    }
    return job
  }

  function retry(id, begin) {
    const previous = jobs.get(id)
    if (!previous) return { ok: false, reason: 'not-found' }
    if (previous.state === 'running') return { ok: false, reason: 'running' }
    const next = start(previous.kind, begin, previous.payload)
    return { ok: true, job: next }
  }

  function cancel(id) {
    const job = jobs.get(id)
    if (!job) return { ok: false, reason: 'not-found' }
    if (job.state !== 'running') return { ok: false, reason: 'not-running', job }
    job.cancelRequested = true
    try {
      job.cancel?.()
    } catch {}
    job.cancel = null
    Object.assign(job, {
      state: 'cancelled',
      phase: '已取消',
      finishedAt: Date.now(),
    })
    persist()
    prune()
    return { ok: true, job }
  }

  return { jobs, start, serialize, list, update, cancel, retry, flush: () => persistence }
}
