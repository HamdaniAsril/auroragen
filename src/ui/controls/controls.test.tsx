import { fireEvent, render } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { ColorRow } from './ColorRow'
import { SeedRow } from './SeedRow'
import { SliderRow } from './SliderRow'

afterEach(() => vi.restoreAllMocks())

test('typed slider value is clamped', () => {
  const onChange = vi.fn()
  const { getByRole } = render(<SliderRow label="Sudut kamera" path="camera.pitch" value={14} onChange={onChange} />)
  fireEvent.doubleClick(getByRole('slider', { name: 'Sudut kamera' }))
  const box = getByRole('spinbutton', { name: 'Sudut kamera' })
  fireEvent.change(box, { target: { value: '200' } })
  fireEvent.keyDown(box, { key: 'Enter' })
  expect(onChange).toHaveBeenCalledWith(90, expect.stringContaining('camera.pitch'))
})

test('seed dice gives 1–9999', () => {
  const onChange = vi.fn()
  const { getByRole } = render(<SeedRow label="Bentuk aurora" path="layer.seed" value={5} onChange={onChange} />)
  vi.spyOn(Math, 'random').mockReturnValue(0.99999)
  fireEvent.click(getByRole('button', { name: /Bentuk aurora/ }))
  expect(onChange).toHaveBeenLastCalledWith(9999, undefined)
  vi.spyOn(Math, 'random').mockReturnValue(0)
  fireEvent.click(getByRole('button', { name: /Bentuk aurora/ }))
  expect(onChange).toHaveBeenLastCalledWith(1, undefined)
})

test('invalid hex is rejected', () => {
  const onChange = vi.fn()
  const { getByRole } = render(<ColorRow label="Warna badan" value="#5AE7CE" onChange={onChange} />)
  fireEvent.change(getByRole('textbox', { name: 'Warna badan' }), { target: { value: 'zz' } })
  expect(onChange).not.toHaveBeenCalled()
  fireEvent.change(getByRole('textbox', { name: 'Warna badan' }), { target: { value: '#112233' } })
  expect(onChange).toHaveBeenCalledWith('#112233')
})
