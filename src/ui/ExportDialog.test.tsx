import { act, fireEvent, render } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { defaultScene } from '../scene/defaults'
import { studio } from '../state/store'
import { ExportDialog, type Exporter } from './ExportDialog'

beforeEach(() => studio.setState({ scene: defaultScene(), lang: 'id', exportSize: { w: 3840, h: 2160 }, format: 'png', quality: 0.92 }))

const noThumb = () => new Promise<string>(() => {})

test('shows progress and can be cancelled', async () => {
  let seen: AbortSignal | undefined
  const exporter: Exporter = (o) =>
    new Promise((_, reject) => {
      seen = o.signal
      o.onProgress?.(0.4)
      o.signal?.addEventListener('abort', () => reject(new DOMException('cancelled', 'AbortError')))
    })
  const { getByRole, findByRole, queryByRole } = render(<ExportDialog open onClose={() => {}} exporter={exporter} thumbnail={noThumb} />)
  expect(getByRole('dialog').textContent).toContain('3840 × 2160')
  fireEvent.click(getByRole('button', { name: 'Unduh' }))
  const bar = await findByRole('progressbar')
  expect(bar.getAttribute('aria-valuenow')).toBe('40')
  await act(async () => {
    fireEvent.click(getByRole('button', { name: 'Batal' }))
  })
  expect(seen?.aborted).toBe(true)
  expect(queryByRole('progressbar')).toBeNull()
})

test('format is chosen in the dialog, with quality only for JPG and WebP', () => {
  const { getByRole, queryByRole } = render(<ExportDialog open onClose={() => {}} thumbnail={noThumb} />)
  expect((getByRole('radio', { name: /PNG/ }) as HTMLInputElement).checked).toBe(true)
  expect(queryByRole('slider', { name: 'Kualitas' })).toBeNull()
  fireEvent.click(getByRole('radio', { name: /JPG/ }))
  expect(studio.getState().format).toBe('jpg')
  expect(getByRole('slider', { name: 'Kualitas' })).toBeTruthy()
  fireEvent.click(getByRole('radio', { name: /WebP/ }))
  expect(studio.getState().format).toBe('webp')
})

test('aurora only shows in the summary and rules out JPG', () => {
  const s = defaultScene()
  s.frame.auroraOnly = true
  studio.setState({ scene: s })
  const { getByRole } = render(<ExportDialog open onClose={() => {}} thumbnail={noThumb} />)
  expect(getByRole('dialog').textContent).toContain('Aurora saja')
  expect((getByRole('radio', { name: /JPG/ }) as HTMLInputElement).disabled).toBe(true)
  expect((getByRole('radio', { name: /PNG/ }) as HTMLInputElement).disabled).toBe(false)
})

test('shows a small picture of what will be saved', async () => {
  const s = defaultScene()
  s.frame.auroraOnly = true
  studio.setState({ scene: s })
  let asked: { auroraOnly: boolean } | undefined
  let urgent: boolean | undefined
  const thumbnail = (sc: typeof s, _size: unknown, opts: { urgent?: boolean }) => {
    asked = sc.frame
    urgent = opts.urgent
    return Promise.resolve('blob:thumb')
  }
  const { findByRole } = render(<ExportDialog open onClose={() => {}} thumbnail={thumbnail} />)
  const img = (await findByRole('img')) as HTMLImageElement
  expect(img.getAttribute('src')).toBe('blob:thumb')
  expect(img.classList.contains('cutout')).toBe(true)
  expect(asked?.auroraOnly).toBe(true)
  // It goes ahead of library thumbnails still waiting to render.
  expect(urgent).toBe(true)
})

test('the picture is rendered sharp at the full card width, and tall frames are capped in height', async () => {
  const sizes: { w: number; h: number }[] = []
  const thumbnail = (_: unknown, size: { w: number; h: number }) => {
    sizes.push(size)
    return Promise.resolve('blob:thumb')
  }
  const first = render(<ExportDialog open onClose={() => {}} thumbnail={thumbnail} />)
  const box = (await first.findByRole('img')).parentElement as HTMLElement
  expect(box.style.getPropertyValue('--picture-w')).toBe('498px')
  expect(sizes[0]).toEqual({ w: 760, h: 428 })
  first.unmount()
  studio.setState({ exportSize: { w: 1290, h: 2796 } })
  render(<ExportDialog open onClose={() => {}} thumbnail={thumbnail} />)
  expect(sizes[1]).toEqual({ w: 258, h: 560 })
})
