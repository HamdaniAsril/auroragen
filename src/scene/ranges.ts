export interface Range {
  min: number
  max: number
  step: number
}

const unit: Range = { min: 0, max: 1, step: 0.01 }
const angle: Range = { min: -180, max: 180, step: 1 }
const seed: Range = { min: 1, max: 9999, step: 1 }

export const RANGES = {
  'layer.seed': seed,
  'land.seed': seed,
  'layer.distance': { min: 0.2, max: 8, step: 0.05 },
  'layer.azimuth': angle,
  'sky.moon.azimuth': angle,
  'camera.yaw': angle,
  'layer.length': unit,
  'layer.foldAmount': unit,
  'layer.foldDensity': unit,
  'layer.rayHeight': unit,
  'layer.rayDensity': unit,
  'layer.rayContrast': unit,
  'sky.starDensity': unit,
  'sky.starBrightness': unit,
  'sky.auroraGlow': unit,
  'sky.moon.brightness': unit,
  'land.height': unit,
  'land.roughness': unit,
  'land.water.ripple': unit,
  'land.water.reflection': unit,
  'effects.bloom': unit,
  'effects.grain': unit,
  'effects.vignette': unit,
  'layer.baseAltitude': { min: 0.8, max: 1.4, step: 0.01 },
  'layer.brightness': { min: 0, max: 2, step: 0.01 },
  'layer.speed': { min: 0, max: 2, step: 0.01 },
  'effects.saturation': { min: 0, max: 2, step: 0.01 },
  'sky.moon.elevation': { min: 0, max: 60, step: 1 },
  'camera.pitch': { min: -10, max: 90, step: 1 },
  'camera.lens': { min: 12, max: 50, step: 1 },
  'effects.exposure': { min: -2, max: 2, step: 0.05 },
  time: { min: 0, max: 600, step: 0.01 },
} as const satisfies Record<string, Range>

export type RangePath = keyof typeof RANGES

export function clampTo(path: RangePath, v: number): number {
  const r = RANGES[path]
  return Math.min(r.max, Math.max(r.min, v))
}
