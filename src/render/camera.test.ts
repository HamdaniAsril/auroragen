import { expect, test } from 'vitest'
import { dragCamera, fovFromLens, pinchLens, wheelLens } from './camera'

test('landscape and portrait share the diagonal field of view', () => {
  const a = fovFromLens(17, 16 / 9)
  const b = fovFromLens(17, 9 / 16)
  expect(Math.hypot(a.tanHalfX, a.tanHalfY)).toBeCloseTo(Math.hypot(b.tanHalfX, b.tanHalfY), 6)
  expect(a.tanHalfX).toBeCloseTo(b.tanHalfY, 6)
  expect(a.tanHalfX).toBeCloseTo(1.109, 2)
})

test('drag right turns left, drag down looks up', () => {
  const c = dragCamera({ pitch: 14, yaw: 0, lens: 17 }, 100, 50, 1600, 900)
  expect(c.yaw).toBeLessThan(0)
  expect(c.pitch).toBeGreaterThan(14)
})

test('yaw wraps, pitch clamps', () => {
  expect(dragCamera({ pitch: 89, yaw: -179, lens: 17 }, 400, 900, 1600, 900).pitch).toBe(90)
  const y = dragCamera({ pitch: 0, yaw: -179, lens: 17 }, 200, 0, 1600, 900).yaw
  expect(y).toBeGreaterThanOrEqual(-180)
  expect(y).toBeLessThan(180)
})

test('wheel and pinch stay inside 12–50 mm', () => {
  expect(wheelLens(17, -100)).toBeGreaterThan(17)
  expect(wheelLens(50, -1e5)).toBe(50)
  expect(pinchLens(17, 100, 1)).toBe(12)
})
