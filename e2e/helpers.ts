import type { Page } from '@playwright/test'
import type { Scene } from '../src/scene/types'

export type Px = Uint8Array
export type Quality = 'preview' | 'refine' | 'export'
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

type HarnessWindow = Window & { harness: Record<string, (...a: unknown[]) => Promise<unknown>> }

export async function openHarness(page: Page): Promise<void> {
  if (!page.url().includes('/harness.html')) {
    await page.goto('/harness.html')
    await page.waitForFunction(() => 'harness' in window)
  }
}

export async function renderPixels(page: Page, scene: Scene, time: number, w: number, h: number, q: Quality = 'export'): Promise<Px> {
  await openHarness(page)
  const arr = await page.evaluate(
    ([j, t, w, h, q]) => (window as unknown as HarnessWindow).harness.render(j, t, w, h, q),
    [JSON.stringify(scene), time, w, h, q] as const,
  )
  return Uint8Array.from(arr as number[])
}

export async function renderTile(page: Page, scene: Scene, time: number, w: number, h: number, tile: Rect): Promise<Px> {
  await openHarness(page)
  const arr = await page.evaluate(
    ([j, t, w, h, tile]) => (window as unknown as HarnessWindow).harness.renderTile(j, t, w, h, tile),
    [JSON.stringify(scene), time, w, h, tile] as const,
  )
  return Uint8Array.from(arr as number[])
}

export function channelMeans(px: Px, w: number, h: number, rect: Rect = { x: 0, y: 0, w, h }) {
  let r = 0
  let g = 0
  let b = 0
  for (let y = rect.y; y < rect.y + rect.h; y++)
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      const i = (y * w + x) * 4
      r += px[i]
      g += px[i + 1]
      b += px[i + 2]
    }
  const n = rect.w * rect.h
  r /= n
  g /= n
  b /= n
  return { r, g, b, luma: 0.2126 * r + 0.7152 * g + 0.0722 * b }
}

export const meanLuma = (px: Px, w: number, h: number, rect?: Rect) => channelMeans(px, w, h, rect).luma

/** Mean absolute difference over RGB, ignoring alpha. */
export function meanAbsDiff(a: Px, b: Px): number {
  if (a.length !== b.length) throw new Error(`size mismatch ${a.length} vs ${b.length}`)
  let s = 0
  for (let i = 0; i < a.length; i += 4) s += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2])
  return s / ((a.length / 4) * 3)
}

export function crop(px: Px, w: number, _h: number, r: Rect): Px {
  const out = new Uint8Array(r.w * r.h * 4)
  for (let y = 0; y < r.h; y++) out.set(px.subarray(((r.y + y) * w + r.x) * 4, ((r.y + y) * w + r.x + r.w) * 4), y * r.w * 4)
  return out
}

export function downsample2x(px: Px, w: number, h: number): Px {
  const W = w >> 1
  const H = h >> 1
  const out = new Uint8Array(W * H * 4)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      for (let c = 0; c < 4; c++) {
        const i = (yy: number, xx: number) => ((2 * y + yy) * w + 2 * x + xx) * 4 + c
        out[(y * W + x) * 4 + c] = (px[i(0, 0)] + px[i(0, 1)] + px[i(1, 0)] + px[i(1, 1)]) / 4
      }
  return out
}
