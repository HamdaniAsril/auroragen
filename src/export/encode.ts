import type { ExportFormat } from '../state/store'

const MIME: Record<ExportFormat, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' }

/** Encodes in the browser. Safari can't make WebP from a canvas, so WebP falls back to a WASM encoder. */
export async function encodeCanvas(c: HTMLCanvasElement, format: ExportFormat, quality: number): Promise<Blob> {
  const type = MIME[format]
  const blob = await new Promise<Blob | null>((resolve) => c.toBlob(resolve, type, quality))
  if (blob && blob.type === type) return blob
  if (format === 'webp') {
    const { encode } = await import('@jsquash/webp')
    const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height)
    const buf = await encode(data, { quality: Math.round(quality * 100) })
    return new Blob([buf], { type })
  }
  if (!blob) throw new Error(`Could not encode ${format}`)
  return blob
}
