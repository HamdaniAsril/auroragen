// Dev-only page that lets Playwright drive the renderer directly.
import { clampScene } from '../scene/clamp'
import { defaultScene } from '../scene/defaults'
import { encodeCanvas } from '../export/encode'
import { renderToCanvas } from '../export/exportImage'
import { Renderer, type Quality, type TileRect } from '../render/Renderer'
import type { ExportFormat } from '../state/store'

const canvas = document.createElement('canvas')
document.body.append(canvas)
const renderer = new Renderer(canvas)
const parse = (json: string) => clampScene(JSON.parse(json))
// The extension can't be fetched while the context is lost, so keep it from the start.
const loseExt = canvas.getContext('webgl2')!.getExtension('WEBGL_lose_context')!

const harness = {
  async render(json: string, t: number, w: number, h: number, q: Quality): Promise<number[]> {
    renderer.render(parse(json), t, { width: w, height: h }, q)
    return Array.from(renderer.readPixels())
  },
  async renderTile(json: string, t: number, w: number, h: number, tile: TileRect): Promise<number[]> {
    renderer.render(parse(json), t, { width: w, height: h, tile }, 'export')
    return Array.from(renderer.readPixels())
  },
  async export(json: string, t: number, w: number, h: number, format: ExportFormat): Promise<number[]> {
    const c = await renderToCanvas({ scene: parse(json), time: t, width: w, height: h })
    const blob = await encodeCanvas(c, format, 0.9)
    return Array.from(new Uint8Array(await blob.arrayBuffer()))
  },
  async exportPixels(json: string, t: number, w: number, h: number): Promise<number[]> {
    const c = await renderToCanvas({ scene: parse(json), time: t, width: w, height: h })
    return Array.from(c.getContext('2d')!.getImageData(0, 0, w, h).data)
  },
  async exportCancel(json: string, t: number, w: number, h: number): Promise<string> {
    const ac = new AbortController()
    try {
      await renderToCanvas({ scene: parse(json), time: t, width: w, height: h, signal: ac.signal, onProgress: () => ac.abort() })
      return 'finished'
    } catch (e) {
      return (e as Error).name
    }
  },
  async exportLoseMidway(json: string, t: number, w: number, h: number): Promise<string> {
    const own = document.createElement('canvas')
    let lost = false
    try {
      await renderToCanvas({
        scene: parse(json),
        time: t,
        width: w,
        height: h,
        canvas: own,
        onProgress: () => {
          if (lost) return
          lost = true
          own.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext()
        },
      })
      return 'finished'
    } catch (e) {
      return (e as Error).name
    }
  },
  loseContext(): void {
    loseExt.loseContext()
  },
  async restoreContext(): Promise<void> {
    const restored = new Promise<void>((resolve) => {
      const off = renderer.onRestored(() => {
        off()
        resolve()
      })
    })
    loseExt.restoreContext()
    await restored
  },
}
// ?view=1 animates a scene for checking by eye; harness.setView(json) swaps the scene shown.
let viewScene = defaultScene()
Object.assign(window, {
  harness: {
    ...harness,
    setView(json: string) {
      viewScene = parse(json)
    },
  },
})

if (new URLSearchParams(location.search).has('view')) {
  const start = performance.now()
  const loop = () => {
    const a = viewScene.frame.aspectW / viewScene.frame.aspectH
    renderer.render(viewScene, viewScene.time + (performance.now() - start) / 1000, { width: Math.round(540 * a), height: 540 }, 'preview')
    requestAnimationFrame(loop)
  }
  loop()
}
