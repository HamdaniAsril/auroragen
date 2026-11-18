import type { Scene } from '../scene/types'

export interface History {
  past: Scene[]
  future: Scene[]
  lastKey?: string
  lastAt?: number
}

const COALESCE_MS = 600
const LIMIT = 100

/**
 * Records `prev` as an undo step. Rapid changes with the same key become one step. A gesture key
 * (`path#id`, one id per drag or focus) stays one step for the whole gesture, however long it takes:
 * heavy frames can stall the main thread well past the time window.
 */
export function record(h: History, prev: Scene, key: string | undefined, now: number): History {
  const sameKey = key !== undefined && h.lastKey === key
  const recent = h.lastAt !== undefined && now - h.lastAt < COALESCE_MS
  if (sameKey && (recent || key.includes('#'))) {
    return { ...h, future: [], lastAt: now }
  }
  return { past: [...h.past, prev].slice(-LIMIT), future: [], lastKey: key, lastAt: now }
}
