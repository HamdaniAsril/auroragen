import { expect, test } from '@playwright/test'
import { defaultScene } from '../src/scene/defaults'
import { renderPixels, type Px } from './helpers'

const W = 320
const H = 180

function auroraOnly() {
  const s = defaultScene()
  s.frame.auroraOnly = true
  s.sky.moon.enabled = true
  return s
}

const alphaAt = (px: Px, x: number, y: number) => px[(y * W + x) * 4 + 3]

test('the full scene is opaque everywhere', async ({ page }) => {
  const px = await renderPixels(page, defaultScene(), 30, W, H, 'export')
  for (let i = 3; i < px.length; i += 4) if (px[i] !== 255) throw new Error(`pixel ${(i - 3) / 4} has alpha ${px[i]}`)
})

test('aurora only leaves land, lake and empty sky transparent', async ({ page }) => {
  const px = await renderPixels(page, auroraOnly(), 30, W, H, 'export')
  // Below the horizon there was lake and land: nothing is left there.
  let below = 0
  for (let y = H - 30; y < H; y++) for (let x = 0; x < W; x++) below = Math.max(below, alphaAt(px, x, y))
  expect(below).toBe(0)
  // Most of the frame is see-through, while the aurora itself is clearly there.
  let clear = 0
  let solid = 0
  for (let i = 3; i < px.length; i += 4) {
    if (px[i] === 0) clear++
    if (px[i] > 120) solid++
  }
  expect(clear / (W * H)).toBeGreaterThan(0.25)
  expect(solid).toBeGreaterThan(200)
})

test('aurora only stores full-strength colour with brightness in alpha', async ({ page }) => {
  const px = await renderPixels(page, auroraOnly(), 30, W, H, 'export')
  let checked = 0
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 40) continue
    expect(Math.max(px[i], px[i + 1], px[i + 2])).toBeGreaterThanOrEqual(250)
    checked++
  }
  expect(checked).toBeGreaterThan(200)
})

test('the exported image keeps the transparency', async ({ page }) => {
  await page.goto('/harness.html')
  await page.waitForFunction(() => 'harness' in window)
  const arr = (await page.evaluate(
    ([j]) => (window as unknown as { harness: { exportPixels: (...a: unknown[]) => Promise<number[]> } }).harness.exportPixels(j, 30, 640, 360),
    [JSON.stringify(auroraOnly())] as const,
  )) as number[]
  let below = 0
  for (let y = 330; y < 360; y++) for (let x = 0; x < 640; x++) below = Math.max(below, arr[(y * 640 + x) * 4 + 3])
  expect(below).toBe(0)
})
