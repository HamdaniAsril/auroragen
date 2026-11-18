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
