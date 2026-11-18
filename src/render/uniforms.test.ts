import { expect, test } from 'vitest'
import { defaultScene } from '../scene/defaults'
import { sceneToUniforms } from './uniforms'

test('packs one layer and zeroes the rest', () => {
  const u = sceneToUniforms(defaultScene(), 30, 16 / 9)
  expect(u.uLayerCount).toBe(1)
  expect(u.uLayerType[0]).toBe(0)
  expect(Array.from(u.uLayerMisc.slice(4))).toEqual(Array(12).fill(0))
})

test('aurora seed and land seed are independent', () => {
  const a = sceneToUniforms(defaultScene(), 0, 1)
  const s = defaultScene()
  s.land.seed = 42
  const b = sceneToUniforms(s, 0, 1)
  expect(b.uLayerSeed[0]).toBe(a.uLayerSeed[0])
  expect(b.uLand[1]).not.toBe(a.uLand[1])
})

test('converts hex to linear light', () => {
  const s = defaultScene()
  s.layers[0].colors.bottom = '#FFFFFF'
  expect(Array.from(sceneToUniforms(s, 0, 1).uLayerColBottom.slice(0, 3))).toEqual([1, 1, 1])
  s.layers[0].colors.bottom = '#808080'
  expect(sceneToUniforms(s, 0, 1).uLayerColBottom[0]).toBeCloseTo(0.2159, 3)
})

test('camera uses diagonal lens', () => expect(sceneToUniforms(defaultScene(), 0, 16 / 9).uCam[2]).toBeCloseTo(1.109, 2))
