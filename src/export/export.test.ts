import { expect, test } from 'vitest'
import { defaultScene } from '../scene/defaults'
import { cssSnippet, exportFilename } from './naming'
import { checkSize, maxExportPixels, reduceAspect, SIZE_PRESETS } from './sizes'
import { planTiles } from './tiles'

test('aspect reduces', () => expect(reduceAspect(1290, 2796)).toEqual({ aspectW: 215, aspectH: 466 }))

test('nine size presets from the spec', () =>
  expect(SIZE_PRESETS.map((s) => `${s.w}x${s.h}`)).toEqual([
    '1920x1080', '2560x1440', '3840x2160', '5120x2880', '3440x1440', '1290x2796', '1440x3200', '2048x2048', '2560x1280',
  ]))

test('iPhone and iPad cap pixels', () => {
  expect(maxExportPixels({ userAgent: 'iPhone', platform: 'iPhone', maxTouchPoints: 5 })).toBe(16_777_216)
  expect(maxExportPixels({ userAgent: 'Mac', platform: 'MacIntel', maxTouchPoints: 5 })).toBe(16_777_216)
  expect(maxExportPixels({ userAgent: 'Mac', platform: 'MacIntel', maxTouchPoints: 0 })).toBe(7680 * 4320)
})

test('oversized export is refused with a reason', () => {
  expect(checkSize(7680, 4320, 16_777_216)).toEqual({ ok: false, reason: 'tooLarge' })
  expect(checkSize(9000, 1000, 1e9)).toEqual({ ok: false, reason: 'longSide' })
  expect(checkSize(200, 1000, 1e9)).toEqual({ ok: false, reason: 'tooSmall' })
  expect(checkSize(5120, 2880, 16_777_216)).toEqual({ ok: true })
})

test('tiles cover the image exactly once', () => {
  const W = 1300
  const H = 700
  const hits = new Uint8Array(W * H)
  for (const t of planTiles(W, H)) {
    expect(t.x + t.w).toBeLessThanOrEqual(W)
    expect(t.y + t.h).toBeLessThanOrEqual(H)
    for (let y = t.y; y < t.y + t.h; y++) for (let x = t.x; x < t.x + t.w; x++) hits[y * W + x]++
  }
  expect(hits.every((n) => n === 1)).toBe(true)
})

test('file name and css', () => {
  expect(exportFilename(defaultScene(), 3840, 2160, 'png')).toBe('aurora-tirai-3840x2160.png')
  expect(exportFilename(defaultScene(), 1290, 2796, 'jpg')).toBe('aurora-tirai-1290x2796.jpg')
  expect(cssSnippet('a.webp')).toBe('background: #02040a url("a.webp") center / cover no-repeat;')
})
