import { expect, test } from 'vitest'
import { clampScene } from '../scene/clamp'
import { defaultScene } from '../scene/defaults'
import { PALETTES } from '../scene/palettes'
import { AURORA_TYPES, LAND_TYPES } from '../scene/types'
import { filterPresets, PRESETS } from './presets'

const frame = { aspectW: 16, aspectH: 9, auroraOnly: false }

test('there are 16–24 presets with unique ids', () => {
  expect(PRESETS.length).toBeGreaterThanOrEqual(16)
  expect(PRESETS.length).toBeLessThanOrEqual(24)
  expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length)
})

test('every preset is already valid', () => {
  for (const p of PRESETS) expect(clampScene({ ...p.scene, frame })).toEqual({ ...p.scene, frame })
})

test('the first preset is the default scene', () => {
  const { frame: _f, ...rest } = defaultScene()
  expect(PRESETS[0].scene).toEqual(rest)
})

test('presets cover every type, palette and land', () => {
  const types = new Set(PRESETS.flatMap((p) => p.scene.layers.map((l) => l.type)))
  const palettes = new Set(PRESETS.flatMap((p) => p.scene.layers.map((l) => l.palette)))
  const lands = new Set(PRESETS.map((p) => p.scene.land.type))
  expect([...types].sort()).toEqual([...AURORA_TYPES].sort())
  for (const id of Object.keys(PALETTES)) expect(palettes.has(id as never)).toBe(true)
  expect([...lands].sort()).toEqual([...LAND_TYPES].sort())
  expect(PRESETS.some((p) => p.scene.land.water.enabled)).toBe(true)
  expect(PRESETS.some((p) => !p.scene.land.water.enabled)).toBe(true)
  expect(PRESETS.some((p) => p.scene.layers[0].type === 'korona' && p.scene.camera.pitch >= 70)).toBe(true)
  expect(PRESETS.filter((p) => p.scene.layers.length > 1).length).toBeGreaterThanOrEqual(2)
})

test('names exist in both languages', () => {
  for (const p of PRESETS) {
    expect(p.name.id.trim()).not.toBe('')
    expect(p.name.en.trim()).not.toBe('')
    expect(p.type).toBe(p.scene.layers[0].type)
  }
})

test('search matches either language', () => {
  const p = PRESETS[3]
  expect(filterPresets(PRESETS, { query: p.name.en.toUpperCase(), lang: 'id' })).toContain(p)
  expect(filterPresets(PRESETS, { query: p.name.id, lang: 'en' })).toContain(p)
  expect(filterPresets(PRESETS, { query: 'zzzz-nothing', lang: 'id' })).toEqual([])
})

test('type filter keeps only that type', () => {
  const out = filterPresets(PRESETS, { query: '', type: 'korona', lang: 'id' })
  expect(out.length).toBeGreaterThan(0)
  expect(out.every((p) => p.type === 'korona')).toBe(true)
})
