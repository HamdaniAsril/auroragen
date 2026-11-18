import { compressToEncodedURIComponent } from 'lz-string'
import { expect, test } from 'vitest'
import { decodeScene, encodeScene } from './codec'
import { defaultScene } from './defaults'
import { RENDERER_VERSION } from './types'

test('round-trips the default scene', () => expect(decodeScene(encodeScene(defaultScene()))).toEqual(defaultScene()))

test('keeps frame aspect and renderer version', () => {
  const s = { ...defaultScene(), frame: { aspectW: 9, aspectH: 16 } }
  const d = decodeScene(encodeScene(s))!
  expect(d.frame).toEqual({ aspectW: 9, aspectH: 16 })
  expect(d.renderer).toBe(RENDERER_VERSION)
})

test('link stays short', () => expect(encodeScene(defaultScene()).length).toBeLessThan(1500))

test('rejects garbage and future versions', () => {
  for (const g of ['', 'abc', '1.%%%', '1.' + 'A'.repeat(50)]) expect(decodeScene(g)).toBeNull()
  expect(decodeScene('99.' + encodeScene(defaultScene()).slice(2))).toBeNull()
})

test('clamps hand-edited values', () => {
  const raw = { ...defaultScene(), camera: { pitch: 300, yaw: 0, lens: 17 } }
  const enc = '1.' + compressToEncodedURIComponent(JSON.stringify(raw))
  expect(decodeScene(enc)!.camera.pitch).toBe(90)
})
