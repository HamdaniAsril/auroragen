import type { Scene } from '../scene/types'

export interface History {
  past: Scene[]
  future: Scene[]
  lastKey?: string
  lastAt?: number
}

const COALESCE_MS = 600
const LIMIT = 100

/** Records `prev` as an undo step. Rapid changes with the same key (a slider drag) become one step. */
export function record(h: History, prev: Scene, key: string | undefined, now: number): History {
  if (key !== undefined && h.lastKey === key && h.lastAt !== undefined && now - h.lastAt < COALESCE_MS) {
    return { ...h, future: [], lastAt: now }
  }
  return { past: [...h.past, prev].slice(-LIMIT), future: [], lastKey: key, lastAt: now }
}
