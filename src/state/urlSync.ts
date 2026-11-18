import { reduceAspect, SIZE_PRESETS } from '../export/sizes'
import { decodeScene, encodeScene } from '../scene/codec'
import type { Frame, Scene } from '../scene/types'

/** Reads `#s=<encoded>`. The payload may contain '+', so it is not parsed as form data. */
export function readSceneFromHash(hash: string): { scene: Scene } | { error: 'invalid' } | null {
  const m = /[#&]s=([^&]*)/.exec(hash)
  if (!m) return null
  let payload = m[1]
  try {
    payload = decodeURIComponent(payload) // some apps escape '$' and '+' when passing links on
  } catch {
    // not escaped; use as is
  }
  const scene = decodeScene(payload)
  return scene ? { scene } : { error: 'invalid' }
}

let timer: ReturnType<typeof setTimeout> | undefined

/** Mirrors the scene into the URL without adding history entries. Debounced unless immediate. */
export function writeSceneToHash(scene: Scene, o: { immediate?: boolean } = {}): void {
  clearTimeout(timer)
  const write = () => history.replaceState(history.state, '', `#s=${encodeScene(scene)}`)
  if (o.immediate) write()
  else timer = setTimeout(write, 400)
}

/**
 * The export size for a frame: a matching preset (the one nearest `prefer`'s long side, else the first),
 * otherwise the frame scaled to `prefer`'s long side, or 3840.
 */
export function exportSizeForFrame(frame: Frame, prefer?: { w: number; h: number }): { w: number; h: number } {
  const matches = SIZE_PRESETS.filter((p) => {
    const a = reduceAspect(p.w, p.h)
    return a.aspectW === frame.aspectW && a.aspectH === frame.aspectH
  })
  const want = prefer ? Math.max(prefer.w, prefer.h) : undefined
  if (matches.length) {
    const best = want === undefined ? matches[0] : matches.reduce((a, b) => (Math.abs(Math.max(b.w, b.h) - want) < Math.abs(Math.max(a.w, a.h) - want) ? b : a))
    return { w: best.w, h: best.h }
  }
  const side = Math.min(want ?? 3840, 7680)
  const a = frame.aspectW / frame.aspectH
  return a >= 1 ? { w: side, h: Math.round(side / a) } : { w: Math.round(side * a), h: side }
}

/** Keeps `size` when it already has the frame's aspect, else picks a size that does. */
export function sizeInStepWith(frame: Frame, size: { w: number; h: number }): { w: number; h: number } {
  const a = reduceAspect(size.w, size.h)
  return a.aspectW === frame.aspectW && a.aspectH === frame.aspectH ? size : exportSizeForFrame(frame, size)
}
