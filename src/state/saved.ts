import { decodeScene, encodeScene } from '../scene/codec'
import type { Scene } from '../scene/types'

export interface SavedScene {
  id: string
  name: string
  createdAt: number
  data: string
}

const KEY = 'auroragen.saved.v1'
const LIMIT = 50

const listeners = new Set<() => void>()
export const onSavedChange = (cb: () => void): (() => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
const notify = () => listeners.forEach((cb) => cb())

/** localStorage, or null when the browser blocks it (private mode, disabled cookies). */
export function getStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

const isEntry = (e: unknown): e is SavedScene => {
  const o = e as SavedScene
  return !!o && typeof o.id === 'string' && typeof o.name === 'string' && typeof o.createdAt === 'number' && typeof o.data === 'string' && decodeScene(o.data) !== null
}

export function listSaved(storage: Storage | null): SavedScene[] | 'unavailable' {
  if (!storage) return 'unavailable'
  let raw: string | null
  try {
    raw = storage.getItem(KEY)
  } catch {
    return 'unavailable'
  }
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isEntry) : []
  } catch {
    return []
  }
}

function write(storage: Storage, list: SavedScene[]): SavedScene[] | 'unavailable' {
  try {
    storage.setItem(KEY, JSON.stringify(list))
  } catch {
    return 'unavailable'
  }
  notify()
  return list
}

export function addSaved(storage: Storage | null, name: string, scene: Scene): SavedScene[] | 'unavailable' {
  const list = listSaved(storage)
  if (list === 'unavailable' || !storage) return 'unavailable'
  const entry: SavedScene = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    name: name.trim() || new Date().toLocaleString(),
    createdAt: Date.now(),
    data: encodeScene(scene),
  }
  return write(storage, [entry, ...list].slice(0, LIMIT))
}

export function removeSaved(storage: Storage | null, id: string): SavedScene[] | 'unavailable' {
  const list = listSaved(storage)
  if (list === 'unavailable' || !storage) return 'unavailable'
  return write(storage, list.filter((e) => e.id !== id))
}
