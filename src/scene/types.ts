export type AuroraType = 'tirai' | 'busur' | 'korona' | 'pilar' | 'pusaran'
export type LandType = 'none' | 'mountains' | 'hills' | 'pines'
export type PaletteId = 'classic-green' | 'green-violet' | 'rare-red' | 'pink-violet' | 'ice-blue' | 'custom'
export type Hex = string // '#RRGGBB'

export interface AuroraLayer {
  type: AuroraType
  seed: number
  distance: number
  azimuth: number
  length: number
  foldAmount: number
  foldDensity: number
  baseAltitude: number
  rayHeight: number
  rayDensity: number
  rayContrast: number
  brightness: number
  speed: number
  palette: PaletteId
  colors: { bottom: Hex; body: Hex; top: Hex }
  fringe: boolean
}

export interface Sky {
  zenith: Hex
  horizon: Hex
  starDensity: number
  starBrightness: number
  auroraGlow: number
  moon: { enabled: boolean; azimuth: number; elevation: number; brightness: number }
}

export interface Land {
  type: LandType
  seed: number
  height: number
  roughness: number
  color: Hex
  water: { enabled: boolean; ripple: number; reflection: number }
}

export interface Camera {
  pitch: number
  yaw: number
  lens: number
}

export interface Effects {
  exposure: number
  bloom: number
  saturation: number
  grain: number
  vignette: number
}

export interface Frame {
  aspectW: number
  aspectH: number
  /** Draw only the aurora, on a transparent background. */
  auroraOnly: boolean
}

export interface Scene {
  v: number
  renderer: number
  time: number
  frame: Frame
  layers: AuroraLayer[]
  sky: Sky
  land: Land
  camera: Camera
  effects: Effects
}

export const SCENE_VERSION = 1
export const RENDERER_VERSION = 1
export const MAX_LAYERS = 4

export const AURORA_TYPES: readonly AuroraType[] = ['tirai', 'busur', 'korona', 'pilar', 'pusaran']
export const LAND_TYPES: readonly LandType[] = ['none', 'mountains', 'hills', 'pines']
export const PALETTE_IDS: readonly PaletteId[] = ['classic-green', 'green-violet', 'rare-red', 'pink-violet', 'ice-blue', 'custom']
