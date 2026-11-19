import { fireEvent, render } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import { PRESETS } from '../presets/presets'
import { defaultScene } from '../scene/defaults'
import { studio } from '../state/store'
import { LibraryPanel } from './LibraryPanel'

vi.mock('../presets/thumbnails', () => ({ getThumbnail: () => new Promise(() => {}) }))

// Node's own experimental localStorage shadows jsdom's, so saved scenes use an in-memory store here.
const memory = vi.hoisted(() => {
  const m = new Map<string, string>()
  return {
    get length() {
      return m.size
    },
    clear: () => m.clear(),
    getItem: (k: string) => m.get(k) ?? null,
    key: (i: number) => [...m.keys()][i] ?? null,
    removeItem: (k: string) => void m.delete(k),
    setItem: (k: string, v: string) => void m.set(k, v),
  } as Storage
})
vi.mock('../state/saved', async (orig) => ({ ...(await orig<typeof import('../state/saved')>()), getStorage: () => memory }))

beforeEach(() => studio.setState({ scene: { ...defaultScene(), frame: { aspectW: 9, aspectH: 16, auroraOnly: false } }, lang: 'id', presetId: null }))

test('clicking a preset applies it and keeps the frame', () => {
  const p = PRESETS[2]
  const { getByRole } = render(<LibraryPanel />)
  fireEvent.click(getByRole('button', { name: p.name.id }))
  expect(studio.getState().presetId).toBe(p.id)
  expect(studio.getState().scene.layers[0].type).toBe(p.type)
  expect(studio.getState().scene.frame).toEqual({ aspectW: 9, aspectH: 16, auroraOnly: false })
})

test('search narrows the list', () => {
  const { getByRole, queryByRole } = render(<LibraryPanel />)
  fireEvent.change(getByRole('searchbox'), { target: { value: PRESETS[5].name.id } })
  expect(queryByRole('button', { name: PRESETS[5].name.id })).not.toBeNull()
  expect(queryByRole('button', { name: PRESETS[0].name.id })).toBeNull()
})

test('a saved scene opens with its own frame', async () => {
  const { addSaved } = await import('../state/saved')
  memory.clear()
  addSaved(memory, 'Wallpaper', { ...defaultScene(), frame: { aspectW: 215, aspectH: 466, auroraOnly: false } })
  studio.setState({ scene: defaultScene() })
  const { getByRole } = render(<LibraryPanel />)
  fireEvent.click(getByRole('tab', { name: 'Tersimpan' }))
  fireEvent.click(getByRole('button', { name: 'Wallpaper' }))
  expect(studio.getState().scene.frame).toEqual({ aspectW: 215, aspectH: 466, auroraOnly: false })
  expect(studio.getState().exportSize).toEqual({ w: 1290, h: 2796 })
})
