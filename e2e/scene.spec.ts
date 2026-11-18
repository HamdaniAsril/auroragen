import { expect, test, type Page } from '@playwright/test'
import { defaultLayer, defaultScene } from '../src/scene/defaults'
import { AURORA_TYPES, type Scene } from '../src/scene/types'
import { meanAbsDiff, meanLuma, renderPixels } from './helpers'

const W = 160
const H = 90
const sky = { x: 0, y: 0, w: W, h: 54 }
const shot = (page: Page, s: Scene, w = W, h = H) => renderPixels(page, s, 30, w, h, 'export')

test('two layers are brighter than one', async ({ page }) => {
  const one = defaultScene()
  const two = defaultScene()
  two.layers.push({ ...defaultLayer('tirai'), seed: 4321, distance: 3.5, azimuth: 25 })
  expect(meanLuma(await shot(page, two), W, H, sky)).toBeGreaterThan(meanLuma(await shot(page, one), W, H, sky))
})

test('each aurora type renders something different', async ({ page }) => {
  const shots = []
  for (const type of AURORA_TYPES) {
    const s = defaultScene()
    s.layers = [defaultLayer(type)]
    s.camera.pitch = 30
    shots.push(await shot(page, s))
  }
  for (let i = 0; i < shots.length; i++)
    for (let j = i + 1; j < shots.length; j++) expect(meanAbsDiff(shots[i], shots[j]), `${AURORA_TYPES[i]} vs ${AURORA_TYPES[j]}`).toBeGreaterThan(2)
})

test('land type changes the horizon', async ({ page }) => {
  const none = defaultScene()
  none.land.type = 'none'
  const mountains = defaultScene()
  mountains.land.height = 1
  const band = (px: Uint8Array) => px.slice(90 * 160 * 4, 120 * 160 * 4)
  expect(meanAbsDiff(band(await shot(page, none, 160, 160)), band(await shot(page, mountains, 160, 160)))).toBeGreaterThan(2)
})

test('water off removes the reflection', async ({ page }) => {
  const off = defaultScene()
  off.land.water.enabled = false
  const bottom = { x: 0, y: 72, w: W, h: 18 }
  expect(meanLuma(await shot(page, defaultScene()), W, H, bottom)).toBeGreaterThan(meanLuma(await shot(page, off), W, H, bottom))
})

test('moon brightens the sky near it', async ({ page }) => {
  const on = defaultScene()
  on.sky.moon = { enabled: true, azimuth: 0, elevation: 20, brightness: 1 }
  const near = { x: 75, y: 32, w: 10, h: 10 }
  expect(meanLuma(await shot(page, on), W, H, near)).toBeGreaterThan(meanLuma(await shot(page, defaultScene()), W, H, near) + 5)
})

test('bloom spreads light', async ({ page }) => {
  const off = defaultScene()
  off.effects.bloom = 0
  const on = defaultScene()
  on.effects.bloom = 1
  expect(meanLuma(await shot(page, on), W, H, sky)).toBeGreaterThan(meanLuma(await shot(page, off), W, H, sky))
})

test('renders again after context loss', async ({ page }) => {
  const before = await shot(page, defaultScene())
  await page.evaluate(() => (window as unknown as { harness: { loseContext(): void } }).harness.loseContext())
  await page.evaluate(() => (window as unknown as { harness: { restoreContext(): Promise<void> } }).harness.restoreContext())
  const after = await shot(page, defaultScene())
  expect(meanAbsDiff(before, after)).toBe(0)
})
