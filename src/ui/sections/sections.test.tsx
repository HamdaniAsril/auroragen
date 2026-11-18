import { fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { defaultScene } from '../../scene/defaults'
import { studio } from '../../state/store'
import { Inspector } from '../Inspector'
import { AuroraSection } from './AuroraSection'

beforeEach(() => studio.setState({ scene: defaultScene(), activeLayer: 0, lang: 'id', history: { past: [], future: [] } }))
afterEach(() => vi.restoreAllMocks())

test('add layer stops at 4', () => {
  const { getByRole, getAllByRole } = render(<AuroraSection />)
  const add = getByRole('button', { name: 'Tambah lapisan' })
  for (let i = 0; i < 5; i++) fireEvent.click(add)
  expect(studio.getState().scene.layers).toHaveLength(4)
  expect(getAllByRole('tab', { name: /Lapisan/ })).toHaveLength(4)
  expect((add as HTMLButtonElement).disabled).toBe(true)
})

test('editing a colour switches palette to custom', () => {
  const { getByRole } = render(<AuroraSection />)
  fireEvent.change(getByRole('textbox', { name: 'Warna badan' }), { target: { value: '#123456' } })
  expect(studio.getState().scene.layers[0].palette).toBe('custom')
  expect(studio.getState().scene.layers[0].colors.body).toBe('#123456')
})

test('korona offers camera preset', () => {
  const { getByRole } = render(<AuroraSection />)
  fireEvent.click(getByRole('radio', { name: 'Korona' }))
  fireEvent.click(getByRole('button', { name: 'Arahkan kamera ke atas' }))
  expect(studio.getState().scene.camera).toMatchObject({ pitch: 80, lens: 14 })
})

test('aurora seed and land seed are separate controls', () => {
  const { getByRole } = render(<Inspector />)
  vi.spyOn(Math, 'random').mockReturnValue(0.5)
  fireEvent.click(getByRole('button', { name: /Acak Bentuk daratan/ }))
  expect(studio.getState().scene.layers[0].seed).toBe(1207)
  expect(studio.getState().scene.land.seed).toBe(5000)
})
