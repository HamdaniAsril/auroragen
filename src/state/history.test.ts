import { expect, test } from 'vitest'
import { defaultScene } from '../scene/defaults'
import { record, type History } from './history'

const empty: History = { past: [], future: [] }

test('records a new step for each distinct change', () => {
  let h = record(empty, defaultScene(), 'a', 0)
  h = record(h, defaultScene(), 'b', 100)
  expect(h.past).toHaveLength(2)
})

test('same key within 600 ms coalesces', () => {
  let h = record(empty, defaultScene(), 'camera.yaw', 0)
  h = record(h, defaultScene(), 'camera.yaw', 300)
  h = record(h, defaultScene(), 'camera.yaw', 800)
  expect(h.past).toHaveLength(1)
  h = record(h, defaultScene(), 'camera.yaw', 1500)
  expect(h.past).toHaveLength(2)
})

test('caps history at 100 and clears the redo stack', () => {
  let h: History = { past: [], future: [defaultScene()] }
  for (let i = 0; i < 150; i++) h = record(h, defaultScene(), undefined, i * 1000)
  expect(h.past).toHaveLength(100)
  expect(h.future).toHaveLength(0)
})
