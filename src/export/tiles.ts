import type { TileRect } from '../render/Renderer'

/** Splits the image into tiles (top-left origin) that cover every pixel exactly once. */
export function planTiles(w: number, h: number, tile = 512): TileRect[] {
  const out: TileRect[] = []
  for (let y = 0; y < h; y += tile)
    for (let x = 0; x < w; x += tile) out.push({ x, y, w: Math.min(tile, w - x), h: Math.min(tile, h - y) })
  return out
}
