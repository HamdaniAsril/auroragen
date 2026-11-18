// Dev-only page that lets Playwright drive the renderer directly.
import { clampScene } from '../scene/clamp'
import { defaultScene } from '../scene/defaults'
import { Renderer, type Quality, type TileRect } from '../render/Renderer'

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
