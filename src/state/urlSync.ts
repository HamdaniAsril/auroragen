import { reduceAspect, SIZE_PRESETS } from '../export/sizes'
import { decodeScene, encodeScene } from '../scene/codec'
import type { Frame, Scene } from '../scene/types'

/** Reads `#s=<encoded>`. The payload may contain '+', so it is not parsed as form data. */
export function readSceneFromHash(hash: string): { scene: Scene } | { error: 'invalid' } | null {
  const m = /[#&]s=([^&]*)/.exec(hash)
  if (!m) return null
  const scene = decodeScene(m[1])
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

/** The export size to use for a frame from a link: a matching preset, else long side 3840. */
export function exportSizeForFrame(frame: Frame): { w: number; h: number } {
  const match = SIZE_PRESETS.find((p) => {
    const a = reduceAspect(p.w, p.h)
    return a.aspectW === frame.aspectW && a.aspectH === frame.aspectH
  })
  if (match) return { w: match.w, h: match.h }
  const a = frame.aspectW / frame.aspectH
  return a >= 1 ? { w: 3840, h: Math.round(3840 / a) } : { w: Math.round(3840 * a), h: 3840 }
}
