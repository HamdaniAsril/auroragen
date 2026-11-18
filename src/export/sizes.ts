import type { Lang } from '../i18n/lang'
import type { Frame } from '../scene/types'

export interface SizePreset {
  id: string
  label: Record<Lang, string>
  w: number
  h: number
}

export const SIZE_PRESETS: SizePreset[] = [
  { id: 'fhd', label: { id: 'Full HD', en: 'Full HD' }, w: 1920, h: 1080 },
  { id: '2k', label: { id: '2K', en: '2K' }, w: 2560, h: 1440 },
  { id: '4k', label: { id: '4K', en: '4K' }, w: 3840, h: 2160 },
  { id: '5k', label: { id: '5K', en: '5K' }, w: 5120, h: 2880 },
  { id: 'ultrawide', label: { id: 'Ultrawide', en: 'Ultrawide' }, w: 3440, h: 1440 },
  { id: 'iphone', label: { id: 'Wallpaper iPhone', en: 'iPhone wallpaper' }, w: 1290, h: 2796 },
  { id: 'android', label: { id: 'Wallpaper Android', en: 'Android wallpaper' }, w: 1440, h: 3200 },
  { id: 'square', label: { id: 'Persegi', en: 'Square' }, w: 2048, h: 2048 },
  { id: 'hero', label: { id: 'Hero web', en: 'Web hero' }, w: 2560, h: 1280 },
]

export const MAX_LONG_SIDE = 7680
export const MIN_SIDE = 256

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

export function reduceAspect(w: number, h: number): Frame {
  const g = gcd(w, h)
  return { aspectW: w / g, aspectH: h / g }
}

const IOS_CANVAS_PIXELS = 16_777_216

/** iOS and iPadOS (which reports itself as a Mac with touch) cap a canvas at about 16.7 MP. */
export function maxExportPixels(env: { userAgent: string; platform: string; maxTouchPoints: number }): number {
  const ios = /iPhone|iPad|iPod/.test(env.userAgent) || /iPhone|iPad|iPod/.test(env.platform)
  const iPadAsMac = env.platform === 'MacIntel' && env.maxTouchPoints > 1
  return ios || iPadAsMac ? IOS_CANVAS_PIXELS : MAX_LONG_SIDE * 4320
}

export type SizeCheck = { ok: true } | { ok: false; reason: 'tooLarge' | 'tooSmall' | 'longSide' }

export function checkSize(w: number, h: number, maxPixels: number): SizeCheck {
  if (w < MIN_SIDE || h < MIN_SIDE) return { ok: false, reason: 'tooSmall' }
  if (Math.max(w, h) > MAX_LONG_SIDE) return { ok: false, reason: 'longSide' }
  if (w * h > maxPixels) return { ok: false, reason: 'tooLarge' }
  return { ok: true }
}

export function deviceMaxPixels(): number {
  if (typeof navigator === 'undefined') return MAX_LONG_SIDE * 4320
  return maxExportPixels({ userAgent: navigator.userAgent, platform: navigator.platform, maxTouchPoints: navigator.maxTouchPoints ?? 0 })
}
