import { act, fireEvent, render } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { defaultScene } from '../scene/defaults'
import { studio } from '../state/store'
import { ExportDialog, type Exporter } from './ExportDialog'

beforeEach(() => studio.setState({ scene: defaultScene(), lang: 'id', exportSize: { w: 3840, h: 2160 }, format: 'png' }))

test('shows progress and can be cancelled', async () => {
  let seen: AbortSignal | undefined
  const exporter: Exporter = (o) =>
    new Promise((_, reject) => {
      seen = o.signal
      o.onProgress?.(0.4)
      o.signal?.addEventListener('abort', () => reject(new DOMException('cancelled', 'AbortError')))
    })
  const { getByRole, findByRole, queryByRole } = render(<ExportDialog open onClose={() => {}} exporter={exporter} />)
  expect(getByRole('dialog').textContent).toContain('3840 × 2160')
  fireEvent.click(getByRole('button', { name: 'Ekspor' }))
  const bar = await findByRole('progressbar')
  expect(bar.getAttribute('aria-valuenow')).toBe('40')
  await act(async () => {
    fireEvent.click(getByRole('button', { name: 'Batal' }))
  })
  expect(seen?.aborted).toBe(true)
  expect(queryByRole('progressbar')).toBeNull()
})
