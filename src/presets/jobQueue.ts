type Job = { run: () => Promise<unknown>; resolve: (v: unknown) => void; reject: (e: unknown) => void }

/** Runs async jobs one at a time. Urgent jobs go ahead of the ones still waiting. */
export function createJobQueue() {
  const waiting: Job[] = []
  let busy = false

  const pump = async () => {
    if (busy) return
    busy = true
    let job: Job | undefined
    while ((job = waiting.shift())) {
      try {
        job.resolve(await job.run())
      } catch (e) {
        job.reject(e)
      }
    }
    busy = false
  }

  return {
    add<T>(run: () => Promise<T>, opts: { urgent?: boolean } = {}): Promise<T> {
      return new Promise<T>((resolve, reject) => {
        const job: Job = { run, resolve: resolve as (v: unknown) => void, reject }
        if (opts.urgent) waiting.unshift(job)
        else waiting.push(job)
        void pump()
      })
    },
  }
}
