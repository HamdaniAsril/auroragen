import type { Hex, PaletteId } from './types'

export interface PaletteColors {
  bottom: Hex
  body: Hex
  top: Hex
}

// sRGB hex; the renderer converts to linear light. Values match the approved prototype's colours.
export const PALETTES: Record<Exclude<PaletteId, 'custom'>, PaletteColors> = {
  'classic-green': { bottom: '#81FFB3', body: '#5AE7CE', top: '#E770BC' },
  'green-violet': { bottom: '#86FFC2', body: '#76E3DC', top: '#C295FF' },
  'rare-red': { bottom: '#B9FFAD', body: '#FFA095', top: '#DA4B76' },
  'pink-violet': { bottom: '#FFB0DB', body: '#E5ADFF', top: '#A186FF' },
  'ice-blue': { bottom: '#BBFBFF', body: '#86D5FF', top: '#A195FF' },
}

export const FRINGE: Hex = '#FF95CE'
