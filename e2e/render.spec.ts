import { expect, test } from '@playwright/test'
import { defaultScene } from '../src/scene/defaults'
import { channelMeans, crop, meanAbsDiff, meanLuma, renderPixels, renderTile } from './helpers'

test('default scene draws green aurora above a dark lake', async ({ page }) => {
  const px = await renderPixels(page, defaultScene(), 30, 320, 180, 'export')
  const sky = channelMeans(px, 320, 180, { x: 0, y: 20, w: 320, h: 60 })
  expect(sky.g).toBeGreaterThan(sky.r)
  expect(sky.g).toBeGreaterThan(20)
  expect(meanLuma(px, 320, 180, { x: 0, y: 170, w: 320, h: 10 })).toBeLessThan(sky.luma)
})

test('same scene and time give the same pixels', async ({ page }) => {
  const a = await renderPixels(page, defaultScene(), 30, 160, 90, 'export')
  const b = await renderPixels(page, defaultScene(), 30, 160, 90, 'export')
  expect(meanAbsDiff(a, b)).toBe(0)
})

test('a tile equals the same region of the full frame', async ({ page }) => {
  const full = await renderPixels(page, defaultScene(), 30, 256, 144, 'export')
  const tile = await renderTile(page, defaultScene(), 30, 256, 144, { x: 128, y: 0, w: 128, h: 72 })
  expect(meanAbsDiff(tile, crop(full, 256, 144, { x: 128, y: 0, w: 128, h: 72 }))).toBeLessThan(1)
})
