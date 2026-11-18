import { expect, test } from 'vitest'
import { defaultScene } from '../scene/defaults'
import { PreviewLoop } from './PreviewLoop'
import type { Quality, RenderTarget } from './Renderer'

function setup() {
  const calls: { q: Quality; w: number; h: number }[] = []
  const renderer = {
    render: (_s: unknown, _t: number, target: RenderTarget, q: Quality) => {
      calls.push({ q, w: target.width, h: target.height })
    },
  }
  let now = 0
  let pending: FrameRequestCallback[] = []
  const loop = new PreviewLoop(renderer, () => defaultScene(), {
    now: () => now,
    raf: (cb) => {
      pending.push(cb)
      return pending.length
    },
    caf: () => {},
  })
  const step = (ms: number) => {
    now += ms
    const run = pending
    pending = []
    for (const cb of run) cb(now)
  }
  return { loop, calls, step }
}

test('paused loop refines once after idle', () => {
  const { loop, calls, step } = setup()
  loop.setView(800, 450)
  loop.setPlaying(false)
  loop.start()
  loop.invalidate()
  for (let i = 0; i < 20; i++) step(16)
  const refines = calls.filter((c) => c.q === 'refine')
  expect(refines).toHaveLength(1)
  expect(refines[0]).toMatchObject({ w: 800, h: 450 })
})

test('playing advances liveTime by speed', () => {
  const { loop, step } = setup()
  loop.setView(800, 450)
  loop.setSpeed(2)
  loop.setPlaying(true)
  loop.start()
  step(16)
  const t0 = loop.liveTime
  for (let i = 0; i < 62; i++) step(16)
  expect(loop.liveTime - t0).toBeCloseTo(2, 1)
})

test('100% view renders a centred tile of the full frame', () => {
  const calls: RenderTarget[] = []
  let pending: FrameRequestCallback[] = []
  const loop = new PreviewLoop({ render: (_s, _t, target) => calls.push(target) }, () => defaultScene(), {
    now: () => 0,
    raf: (cb) => (pending.push(cb), pending.length),
    caf: () => {},
  })
  loop.setView(800, 450, { width: 3840, height: 2160 })
  loop.setPlaying(false)
  loop.start()
  const run = pending
  pending = []
  for (const cb of run) cb(0)
  expect(calls[0]).toEqual({ width: 3840, height: 2160, tile: { x: 1520, y: 855, w: 800, h: 450 } })
})

test('live time wraps inside the 0–600 s timeline', () => {
  const { loop, step } = setup()
  loop.setView(800, 450)
  loop.seek(599.5)
  loop.setPlaying(true)
  loop.start()
  for (let i = 0; i < 20; i++) step(50)
  expect(loop.liveTime).toBeGreaterThanOrEqual(0)
  expect(loop.liveTime).toBeLessThan(600)
})
