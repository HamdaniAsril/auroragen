import { Renderer } from '../render/Renderer'
import { encodeScene } from '../scene/codec'
import type { Scene } from '../scene/types'
import { createJobQueue } from './jobQueue'

let renderer: Renderer | null = null
const queue = createJobQueue()
const cache = new Map<string, Promise<string>>()

const nextIdle = () => new Promise<void>((r) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(() => r(), { timeout: 300 }) : setTimeout(r, 16)))

async function draw(scene: Scene, W: number, H: number): Promise<string> {
  await nextIdle()
  renderer ??= new Renderer(document.createElement('canvas'))
  renderer.render(scene, scene.time, { width: W, height: H }, 'refine')
  const px = renderer.readPixels()
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(W, H)
  img.data.set(px)
  ctx.putImageData(img, 0, 0)
  // A cut-out keeps its transparency; everything else is a small JPEG.
  const blob = await new Promise<Blob | null>((r) => (scene.frame.auroraOnly ? c.toBlob(r, 'image/png') : c.toBlob(r, 'image/jpeg', 0.85)))
  if (!blob) throw new Error('thumbnail encode failed')
  return URL.createObjectURL(blob)
}

/**
 * A small picture of the scene (16:9 unless a size is given). Renders one at a time on a shared
 * hidden renderer, cached. `urgent` goes ahead of pictures still waiting, such as the library's.
 */
export function getThumbnail(scene: Scene, size: { w: number; h: number } = { w: 192, h: 108 }, opts: { urgent?: boolean } = {}): Promise<string> {
  const key = `${size.w}x${size.h}:${encodeScene(scene)}`
  const hit = cache.get(key)
  if (hit) return hit
  const p = queue.add(() => draw(scene, size.w, size.h), opts)
  cache.set(key, p)
  return p
}
