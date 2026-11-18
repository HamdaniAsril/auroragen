import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { clampScene } from './clamp'
import { SCENE_VERSION, type Scene } from './types'

export function encodeScene(scene: Scene): string {
  return `${scene.v}.${compressToEncodedURIComponent(JSON.stringify(scene))}`
}

/** Upgrades a raw scene object from an older format. Returns null for versions this build can't read. */
export function migrate(raw: unknown, fromVersion: number): unknown | null {
  if (!Number.isInteger(fromVersion) || fromVersion < 1 || fromVersion > SCENE_VERSION) return null
  return raw
}

export function decodeScene(s: string): Scene | null {
  try {
    const dot = s.indexOf('.')
    if (dot < 1) return null
    const version = Number(s.slice(0, dot))
    const json = decompressFromEncodedURIComponent(s.slice(dot + 1))
    if (!json) return null
    const parsed: unknown = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const migrated = migrate(parsed, version)
    return migrated === null ? null : clampScene(migrated)
  } catch {
    return null
  }
}
