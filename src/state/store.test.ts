import { expect, test } from 'vitest'
import { defaultScene } from '../scene/defaults'
import type { Preset } from '../presets/types'
import { createStudioStore } from './store'

function fakeClock() {
  let t = 0
  return { now: () => t, advance: (ms: number) => (t += ms) }
}

test('undo and redo', () => {
  const st = createStudioStore()
  st.getState().update((s) => {
    s.camera.yaw = 30
  })
  st.getState().undo()
  expect(st.getState().scene.camera.yaw).toBe(0)
  st.getState().redo()
  expect(st.getState().scene.camera.yaw).toBe(30)
})

test('slider drags coalesce into one step', () => {
  const clock = fakeClock()
  const st = createStudioStore(undefined, { now: clock.now })
  for (let i = 1; i <= 10; i++) {
    st.getState().update((s) => {
      s.camera.yaw = i * 3
    }, 'camera.yaw')
    clock.advance(50)
  }
  expect(st.getState().scene.camera.yaw).toBe(30)
  st.getState().undo()
  expect(st.getState().scene.camera.yaw).toBe(0)
})

test('layers stay between 1 and 4', () => {
  const st = createStudioStore()
  for (let i = 0; i < 5; i++) st.getState().addLayer()
  expect(st.getState().scene.layers).toHaveLength(4)
  for (let i = 0; i < 5; i++) st.getState().removeLayer(0)
  expect(st.getState().scene.layers).toHaveLength(1)
})

test('presets never change frame aspect', () => {
  const st = createStudioStore({ ...defaultScene(), frame: { aspectW: 9, aspectH: 16, auroraOnly: false } })
  const { frame: _frame, ...rest } = defaultScene()
  const preset: Preset = { id: 'p', name: { id: 'P', en: 'P' }, type: 'tirai', scene: { ...rest, camera: { pitch: 40, yaw: 10, lens: 20 } } }
  st.getState().applyPreset(preset)
  expect(st.getState().scene.frame).toEqual({ aspectW: 9, aspectH: 16, auroraOnly: false })
  expect(st.getState().scene.camera.pitch).toBe(40)
  expect(st.getState().presetId).toBe('p')
  expect(st.getState().dirty).toBe(false)
})

test('randomizeAll keeps frame, camera and effects', () => {
  let i = 0
  const seq = [0.1, 0.9, 0.5, 0.3, 0.7, 0.2, 0.8]
  const st = createStudioStore({ ...defaultScene(), frame: { aspectW: 4, aspectH: 5, auroraOnly: false } }, { rand: () => seq[i++ % seq.length] })
  const before = st.getState().scene
  st.getState().randomizeAll()
  const after = st.getState().scene
  expect(after.frame).toEqual(before.frame)
  expect(after.camera).toEqual(before.camera)
  expect(after.effects).toEqual(before.effects)
  expect(after.layers[0].seed).not.toBe(before.layers[0].seed)
  expect(after.land.seed).not.toBe(before.land.seed)
})

test('setTime is not an undo step', () => {
  const st = createStudioStore()
  st.getState().update((s) => {
    s.camera.yaw = 10
  })
  st.getState().setTime(5)
  st.getState().undo()
  expect(st.getState().scene.time).toBe(5)
  expect(st.getState().scene.camera.yaw).toBe(0)
})

test('undo of a size change keeps the export size in step with the frame', () => {
  const st = createStudioStore()
  st.getState().setExport({ exportSize: { w: 1290, h: 2796 } })
  st.getState().update((s) => {
    s.frame = { aspectW: 215, aspectH: 466, auroraOnly: false }
  }, 'frame')
  st.getState().undo()
  const { frame } = st.getState().scene
  const size = st.getState().exportSize
  expect(frame).toEqual({ aspectW: 16, aspectH: 9, auroraOnly: false })
  expect(size.w * frame.aspectH).toBe(size.h * frame.aspectW)
  st.getState().redo()
  expect(st.getState().exportSize).toEqual({ w: 1290, h: 2796 })
})

test('loading a scene with another frame brings the export size along', () => {
  const st = createStudioStore()
  st.getState().loadScene({ ...defaultScene(), frame: { aspectW: 9, aspectH: 20, auroraOnly: false } })
  expect(st.getState().exportSize).toEqual({ w: 1440, h: 3200 })
})

test('aurora-only stays on through presets and randomize', () => {
  const st = createStudioStore()
  st.getState().update((s) => {
    s.frame.auroraOnly = true
  })
  const preset = { id: 'p', name: { id: 'p', en: 'p' }, type: 'tirai', scene: defaultScene() } as unknown as Preset
  st.getState().applyPreset(preset)
  expect(st.getState().scene.frame.auroraOnly).toBe(true)
  st.getState().randomizeAll()
  expect(st.getState().scene.frame.auroraOnly).toBe(true)
})

test('aurora-only never exports as JPG', () => {
  const st = createStudioStore()
  st.getState().setExport({ format: 'jpg' })
  st.getState().update((s) => {
    s.frame.auroraOnly = true
  })
  expect(st.getState().format).toBe('png')
  st.getState().setExport({ format: 'jpg' })
  expect(st.getState().format).toBe('png')
  st.getState().setExport({ format: 'webp' })
  expect(st.getState().format).toBe('webp')
})
