import { expect, test } from 'vitest'
import { encodeScene } from '../scene/codec'
import { defaultScene } from '../scene/defaults'
import { exportSizeForFrame, readSceneFromHash } from './urlSync'

test('no hash means no scene', () => {
  expect(readSceneFromHash('')).toBeNull()
  expect(readSceneFromHash('#other=1')).toBeNull()
})

test('invalid hash is reported', () => expect(readSceneFromHash('#s=zzz')).toEqual({ error: 'invalid' }))

test('a valid hash restores the scene, including + and $ in the payload', () => {
  const s = { ...defaultScene(), frame: { aspectW: 9, aspectH: 16, auroraOnly: false }, camera: { pitch: 31, yaw: -47, lens: 22 } }
  expect(readSceneFromHash(`#s=${encodeScene(s)}`)).toEqual({ scene: s })
})

test('portrait frame maps to a phone size', () => expect(exportSizeForFrame({ aspectW: 215, aspectH: 466, auroraOnly: false })).toEqual({ w: 1290, h: 2796 }))

test('unknown aspect gets long side 3840', () => {
  expect(exportSizeForFrame({ aspectW: 5, aspectH: 4, auroraOnly: false })).toEqual({ w: 3840, h: 3072 })
  expect(exportSizeForFrame({ aspectW: 4, aspectH: 5, auroraOnly: false })).toEqual({ w: 3072, h: 3840 })
})

test('percent-encoded links still open', () => {
  const s = { ...defaultScene(), camera: { pitch: 22, yaw: 5, lens: 30 } }
  const encoded = encodeURIComponent(encodeScene(s))
  expect(readSceneFromHash(`#s=${encoded}`)).toEqual({ scene: s })
})
