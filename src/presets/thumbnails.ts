import { Renderer } from '../render/Renderer'
import { encodeScene } from '../scene/codec'
import type { Scene } from '../scene/types'

const W = 192
const H = 108
let renderer: Renderer | null = null
let queue: Promise<unknown> = Promise.resolve()
const cache = new Map<string, Promise<string>>()

const nextIdle = () => new Promise<void>((r) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(() => r(), { timeout: 300 }) : setTimeout(r, 16)))

async function draw(scene: Scene): Promise<string> {
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
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', 0.85))
  if (!blob) throw new Error('thumbnail encode failed')
  return URL.createObjectURL(blob)
}

/** A small 16:9 picture of the scene. Renders one at a time on a shared hidden renderer, cached. */
export function getThumbnail(scene: Scene): Promise<string> {
  const key = encodeScene(scene)
  const hit = cache.get(key)
  if (hit) return hit
  const p = queue.then(() => draw(scene))
  queue = p.catch(() => undefined)
  cache.set(key, p)
  return p
}
