import type { Hex, PaletteId } from './types'

export interface PaletteColors {
  bottom: Hex
  body: Hex
  top: Hex
}

export const PALETTES: Record<Exclude<PaletteId, 'custom'>, PaletteColors> = {
  'classic-green': { bottom: '#38FF73', body: '#1ACC9E', top: '#CC2980' },
  'green-violet': { bottom: '#3DFF8A', body: '#2EC4B6', top: '#8A4DFF' },
  'rare-red': { bottom: '#7CFF6B', body: '#FF5A4D', top: '#B3122E' },
  'pink-violet': { bottom: '#FF6FB5', body: '#C86BFF', top: '#5B3DFF' },
  'ice-blue': { bottom: '#7FF5FF', body: '#3DA9FF', top: '#5B4DFF' },
}

export const FRINGE: Hex = '#FF4D9E'
