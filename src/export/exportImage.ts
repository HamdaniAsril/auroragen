import { Renderer } from '../render/Renderer'
import type { Scene } from '../scene/types'
import type { ExportFormat } from '../state/store'
import { encodeCanvas } from './encode'
import { planTiles } from './tiles'

export interface ExportOptions {
  scene: Scene
  time: number
  width: number
  height: number
  format: ExportFormat
  quality: number
  signal?: AbortSignal
  onProgress?: (p: number) => void
}

const abortError = () => new DOMException('Export cancelled', 'AbortError')

/** Renders the full image tile by tile on its own GPU context and assembles it on a 2D canvas. */
export async function renderToCanvas(o: Omit<ExportOptions, 'format' | 'quality'>): Promise<HTMLCanvasElement> {
  const glCanvas = document.createElement('canvas')
  const renderer = new Renderer(glCanvas)
  try {
    const out = document.createElement('canvas')
    out.width = o.width
    out.height = o.height
    const ctx = out.getContext('2d')!
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, o.width, o.height)
    renderer.renderBloomSource(o.scene, o.time, o.width / o.height, 'export')
    const tiles = planTiles(o.width, o.height)
    for (let i = 0; i < tiles.length; i++) {
      if (o.signal?.aborted) throw abortError()
      const tile = tiles[i]
      renderer.render(o.scene, o.time, { width: o.width, height: o.height, tile, reuseBloom: true }, 'export')
      const px = renderer.readPixels()
      const img = ctx.createImageData(tile.w, tile.h)
      img.data.set(px)
      ctx.putImageData(img, tile.x, tile.y)
      o.onProgress?.((i + 1) / tiles.length)
      await new Promise((r) => setTimeout(r, 0)) // let the UI update and a cancel land
    }
    if (o.signal?.aborted) throw abortError()
    return out
  } finally {
    renderer.dispose()
    glCanvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext()
  }
}

export async function exportImage(o: ExportOptions): Promise<Blob> {
  const canvas = await renderToCanvas(o)
  return encodeCanvas(canvas, o.format, o.quality)
}
