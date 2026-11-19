import { expect, test, type Page } from '@playwright/test'
import { defaultScene } from '../src/scene/defaults'
import type { Scene } from '../src/scene/types'
import { channelMeans, downsample2x, meanAbsDiff, openHarness, renderPixels } from './helpers'

type H = { harness: Record<string, (...a: unknown[]) => Promise<unknown>> }
const call = async <T,>(page: Page, fn: string, ...args: unknown[]): Promise<T> => {
  await openHarness(page)
  return page.evaluate(([fn, args]) => (window as unknown as H).harness[fn as string](...(args as unknown[])), [fn, args] as const) as Promise<T>
}
const exportBytes = async (page: Page, s: Scene, w: number, h: number, format: string) =>
  Uint8Array.from(await call<number[]>(page, 'export', JSON.stringify(s), 30, w, h, format))
const exportPixels = async (page: Page, s: Scene, w: number, h: number) =>
  Uint8Array.from(await call<number[]>(page, 'exportPixels', JSON.stringify(s), 30, w, h))

test('exports a PNG of the requested size', async ({ page }) => {
  const b = await exportBytes(page, defaultScene(), 640, 360, 'png')
  expect(Array.from(b.slice(0, 4))).toEqual([137, 80, 78, 71])
  const dv = new DataView(b.buffer)
  expect([dv.getUint32(16), dv.getUint32(20)]).toEqual([640, 360])
})

test('export matches the preview at the same aspect', async ({ page }) => {
  const preview = await renderPixels(page, defaultScene(), 30, 160, 90, 'preview')
  const exp = downsample2x(await exportPixels(page, defaultScene(), 320, 180), 320, 180)
  expect(meanAbsDiff(preview, exp)).toBeLessThan(8)
})

test('portrait export matches preview framing', async ({ page }) => {
  const s = { ...defaultScene(), frame: { aspectW: 9, aspectH: 16, auroraOnly: false } }
  const preview = await renderPixels(page, s, 30, 90, 160, 'preview')
  const exp = downsample2x(await exportPixels(page, s, 180, 320), 180, 320)
  expect(meanAbsDiff(preview, exp)).toBeLessThan(8)
  const sky = channelMeans(exp, 90, 160, { x: 0, y: 20, w: 90, h: 50 })
  expect(sky.g).toBeGreaterThan(sky.r)
})

test('cancel stops the export', async ({ page }) => {
  expect(await call<string>(page, 'exportCancel', JSON.stringify(defaultScene()), 30, 1300, 700)).toBe('AbortError')
})

test('webp falls back to the wasm encoder when the browser cannot make webp', async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.toBlob
    HTMLCanvasElement.prototype.toBlob = function (cb, type, q) {
      return orig.call(this, cb, type === 'image/webp' ? 'image/png' : type, q)
    }
  })
  const b = await exportBytes(page, defaultScene(), 320, 180, 'webp')
  expect(new TextDecoder().decode(b.slice(0, 4))).toBe('RIFF')
  expect(new TextDecoder().decode(b.slice(8, 12))).toBe('WEBP')
})

test('a lost GPU context during export fails instead of saving blank tiles', async ({ page }) => {
  expect(await call<string>(page, 'exportLoseMidway', JSON.stringify(defaultScene()), 30, 1300, 700)).toBe('ContextLostError')
})
