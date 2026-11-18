import type { RangePath } from '../../scene/ranges'

export type Unit = 'pct' | 'deg' | 'mm' | 'km' | 'ev' | 'int' | 'sec'

const DEG: RangePath[] = ['camera.pitch', 'camera.yaw', 'layer.azimuth', 'sky.moon.azimuth', 'sky.moon.elevation']

export function unitFor(path: RangePath): Unit {
  if (path.endsWith('seed')) return 'int'
  if (path === 'camera.lens') return 'mm'
  if (DEG.includes(path)) return 'deg'
  if (path === 'layer.distance' || path === 'layer.baseAltitude') return 'km' // 1 unit = 100 km
  if (path === 'effects.exposure') return 'ev'
  if (path === 'time') return 'sec'
  return 'pct'
}

/** The number a person reads and types, in display units. */
export function toDisplay(v: number, unit: Unit): number {
  if (unit === 'pct' || unit === 'km') return Math.round(v * 100)
  if (unit === 'ev') return Math.round(v * 100) / 100
  return Math.round(v)
}

export function fromDisplay(n: number, unit: Unit): number {
  return unit === 'pct' || unit === 'km' ? n / 100 : n
}

export function formatValue(v: number, unit: Unit): string {
  const n = toDisplay(v, unit)
  switch (unit) {
    case 'pct':
      return `${n}%`
    case 'deg':
      return `${n}°`
    case 'mm':
      return `${n} mm`
    case 'km':
      return `${n} km`
    case 'ev':
      return `${n > 0 ? '+' : ''}${n.toFixed(2)} EV`
    case 'sec':
      return `${n} s`
    default:
      return String(n)
  }
}
