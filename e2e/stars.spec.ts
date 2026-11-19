import { expect, test, type Page } from '@playwright/test'
import { defaultScene } from '../src/scene/defaults'
import type { Scene } from '../src/scene/types'
import { downsample2x, renderPixels, type Px } from './helpers'

// Stars only: no aurora, land, lake or photo effects, so every bright pixel is a star.
function starSky(): Scene {
  const s = defaultScene()
  s.layers[0].brightness = 0
  s.land.type = 'none'
  s.land.water.enabled = false
  s.sky.starDensity = 1
  s.camera.pitch = 40
  s.effects = { exposure: 0, bloom: 0, saturation: 1, grain: 0, vignette: 0 }
  return s
}

const luma = (px: Px, w: number, x: number, y: number) => {
  const i = (y * w + x) * 4
  return 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]
}

/** Local maxima clearly above the sky around them. */
function findStars(px: Px, w: number, h: number, above: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  for (let y = 2; y < h - 2; y++)
    for (let x = 2; x < w - 2; x++) {
      const v = luma(px, w, x, y)
      const bg = Math.min(luma(px, w, x - 2, y), luma(px, w, x + 2, y), luma(px, w, x, y - 2), luma(px, w, x, y + 2))
      if (v - bg < above) continue
      let peak = true
      for (let dy = -1; dy <= 1 && peak; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && luma(px, w, x + dx, y + dy) > v) peak = false
      if (peak) out.push({ x, y })
    }
  return out
}

async function render(page: Page, t: number, w: number, h: number) {
  return renderPixels(page, starSky(), t, w, h, 'export')
}

test('stars stay in place when the preview renders at a lower resolution', async ({ page }) => {
  const hi = downsample2x(await render(page, 30, 960, 540), 960, 540)
  const lo = await render(page, 30, 480, 270)
  const stars = findStars(hi, 480, 270, 12)
  expect(stars.length).toBeGreaterThan(30)
  const found = stars.filter(({ x, y }) => {
    let best = 0
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) best = Math.max(best, luma(lo, 480, x + dx, y + dy) - luma(lo, 480, x + dx + 3, y + dy))
    return best > 4
  })
  expect(found.length / stars.length).toBeGreaterThan(0.85)
})

test('only some stars twinkle, and only gently', async ({ page }) => {
  const W = 960
  const H = 540
  const frames = [await render(page, 30, W, H), await render(page, 30.4, W, H), await render(page, 31.1, W, H), await render(page, 32.3, W, H)]
  const stars = findStars(frames[0], W, H, 25)
  expect(stars.length).toBeGreaterThan(40)
  let twinkling = 0
  let strongest = 0
  for (const { x, y } of stars) {
    const v = frames.map((f) => luma(f, W, x, y))
    const lo = Math.min(...v)
    const hiV = Math.max(...v)
    if (hiV - lo >= 2) twinkling++
    strongest = Math.max(strongest, (hiV - lo) / hiV)
  }
  const share = twinkling / stars.length
  expect(share).toBeGreaterThan(0.1)
  expect(share).toBeLessThan(0.6)
  expect(strongest).toBeLessThan(0.4)
})
