import { expect, test } from 'vitest'
import { clampScene } from './clamp'
import { defaultScene } from './defaults'

test('default scene is already valid', () => expect(clampScene(defaultScene())).toEqual(defaultScene()))

test('fills missing fields', () => expect(clampScene({ camera: { pitch: 20 } }).land).toEqual(defaultScene().land))

test('clamps and rounds numbers', () => {
  const s = clampScene({ camera: { pitch: 400, yaw: -999, lens: 3 }, layers: [{ seed: 12345.7 }] })
  expect(s.camera).toEqual({ pitch: 90, yaw: -180, lens: 12 })
  expect(s.layers[0].seed).toBe(9999)
})

test('caps layers at 4 and never returns zero layers', () => {
  expect(clampScene({ layers: Array(7).fill({}) }).layers).toHaveLength(4)
  expect(clampScene({ layers: [] }).layers).toHaveLength(1)
})

test('rejects bad enums, hex and frame', () => {
  const s = clampScene({
    layers: [{ type: 'laser', colors: { bottom: 'red' } }],
    land: { type: 'ocean' },
    frame: { aspectW: -1, aspectH: 0 },
  })
  expect(s.layers[0].type).toBe('tirai')
  expect(s.layers[0].colors.bottom).toBe('#38FF73')
  expect(s.land.type).toBe('mountains')
  expect(s.frame).toEqual({ aspectW: 16, aspectH: 9 })
})

test('never throws on garbage', () => {
  for (const g of [null, 42, 'x', [], { layers: 'no' }]) expect(() => clampScene(g)).not.toThrow()
})
