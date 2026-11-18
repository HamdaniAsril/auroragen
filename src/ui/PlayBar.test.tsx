import { fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { defaultScene } from '../scene/defaults'
import { studio } from '../state/store'
import { PlayBar } from './PlayBar'

const mockMotion = (reduce: boolean) =>
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: reduce && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }))

beforeEach(() => studio.setState({ scene: defaultScene(), playing: true, lang: 'id' }))
afterEach(() => vi.unstubAllGlobals())

test('starts paused with reduced motion', () => {
  mockMotion(true)
  const { getByRole } = render(<PlayBar getLiveTime={() => 30} />)
  expect(studio.getState().playing).toBe(false)
  expect(getByRole('button', { name: 'Putar' })).toBeTruthy()
})

test('pausing writes the live time into the scene', () => {
  mockMotion(false)
  const { getByRole } = render(<PlayBar getLiveTime={() => 12.5} />)
  fireEvent.click(getByRole('button', { name: 'Jeda' }))
  expect(studio.getState().playing).toBe(false)
  expect(studio.getState().scene.time).toBe(12.5)
})
