// Dev-only page that lets Playwright drive the renderer directly.
import { clampScene } from '../scene/clamp'
import { defaultScene } from '../scene/defaults'
import { Renderer, type Quality, type TileRect } from '../render/Renderer'

const canvas = document.createElement('canvas')
document.body.append(canvas)
const renderer = new Renderer(canvas)
const parse = (json: string) => clampScene(JSON.parse(json))

const harness = {
  async render(json: string, t: number, w: number, h: number, q: Quality): Promise<number[]> {
    renderer.render(parse(json), t, { width: w, height: h }, q)
    return Array.from(renderer.readPixels())
  },
  async renderTile(json: string, t: number, w: number, h: number, tile: TileRect): Promise<number[]> {
    renderer.render(parse(json), t, { width: w, height: h, tile }, 'export')
    return Array.from(renderer.readPixels())
  },
  loseContext(): void {
    canvas.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.loseContext()
  },
  async restoreContext(): Promise<void> {
    const restored = new Promise<void>((resolve) => {
      const off = renderer.onRestored(() => {
        off()
        resolve()
      })
    })
    canvas.getContext('webgl2')!.getExtension('WEBGL_lose_context')!.restoreContext()
    await restored
  },
}
Object.assign(window, { harness })

// ?view=1 shows the default scene animating, to compare against the prototype by eye.
if (new URLSearchParams(location.search).has('view')) {
  const scene = defaultScene()
  const start = performance.now()
  const loop = () => {
    renderer.render(scene, 30 + (performance.now() - start) / 1000, { width: 960, height: 540 }, 'preview')
    requestAnimationFrame(loop)
  }
  loop()
}
