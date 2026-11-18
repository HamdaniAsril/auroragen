import { expect, test } from 'vitest'
import { AdaptiveScaler } from './adaptive'

test('scale drops under slow frames and recovers', () => {
  const s = new AdaptiveScaler()
  let v = 1
  for (let i = 0; i < 40; i++) v = s.sample(60)
  expect(v).toBeCloseTo(0.35, 2)
  for (let i = 0; i < 80; i++) v = s.sample(10)
  expect(v).toBe(1)
})
