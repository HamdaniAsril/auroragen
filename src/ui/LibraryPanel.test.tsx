import { fireEvent, render } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { PRESETS } from '../presets/presets'
import { defaultScene } from '../scene/defaults'
import { studio } from '../state/store'
import { LibraryPanel } from './LibraryPanel'

vi.mock('../presets/thumbnails', () => ({ getThumbnail: () => new Promise(() => {}) }))

beforeEach(() => studio.setState({ scene: { ...defaultScene(), frame: { aspectW: 9, aspectH: 16 } }, lang: 'id', presetId: null }))

test('clicking a preset applies it and keeps the frame', () => {
  const p = PRESETS[2]
  const { getByRole } = render(<LibraryPanel />)
  fireEvent.click(getByRole('button', { name: p.name.id }))
  expect(studio.getState().presetId).toBe(p.id)
  expect(studio.getState().scene.layers[0].type).toBe(p.type)
  expect(studio.getState().scene.frame).toEqual({ aspectW: 9, aspectH: 16 })
})

test('search narrows the list', () => {
  const { getByRole, queryByRole } = render(<LibraryPanel />)
  fireEvent.change(getByRole('searchbox'), { target: { value: PRESETS[5].name.id } })
  expect(queryByRole('button', { name: PRESETS[5].name.id })).not.toBeNull()
  expect(queryByRole('button', { name: PRESETS[0].name.id })).toBeNull()
})
