import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { defaultScene } from '../scene/defaults'
import { studio } from '../state/store'
import { Preview } from './Preview'

const fake = { render: vi.fn(), onRestored: () => () => {} }

beforeEach(() => {
  studio.setState({ scene: defaultScene(), history: { past: [], future: [] } })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, top: 0, left: 0, right: 800, bottom: 450, width: 800, height: 450, toJSON: () => ({}),
  })
})
afterEach(() => vi.restoreAllMocks())

test('dragging the preview turns the camera', () => {
  const { getByRole } = render(<Preview renderer={fake} />)
  const canvas = getByRole('img')
  act(() => {
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 400, clientY: 200 })
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 500, clientY: 200 })
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 500, clientY: 200 })
  })
  expect(studio.getState().scene.camera.yaw).toBeLessThan(0)
})

test('the drag hint disappears after the first drag', () => {
  const { getByRole, queryByText } = render(<Preview renderer={fake} />)
  expect(queryByText('Seret untuk memutar kamera')).not.toBeNull()
  act(() => {
    fireEvent.pointerDown(getByRole('img'), { pointerId: 1, clientX: 10, clientY: 10 })
    fireEvent.pointerUp(getByRole('img'), { pointerId: 1, clientX: 10, clientY: 10 })
  })
  expect(queryByText('Seret untuk memutar kamera')).toBeNull()
})
