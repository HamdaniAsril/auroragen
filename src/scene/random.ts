import { PALETTES } from './palettes'
import { LAND_TYPES, type PaletteId, type Scene } from './types'

const pick = <T>(list: readonly T[], rand: () => number): T => list[Math.min(list.length - 1, Math.floor(rand() * list.length))]

export function randomSeed(rand: () => number = Math.random): number {
  return 1 + Math.min(9998, Math.floor(rand() * 9999))
}

/** New shapes, palettes and land; keeps frame, camera, sky, effects and time. */
export function randomizeScene(s: Scene, rand: () => number = Math.random): Scene {
  const palettes = Object.keys(PALETTES) as Exclude<PaletteId, 'custom'>[]
  return {
    ...s,
    layers: s.layers.map((l) => {
      const palette = pick(palettes, rand)
      return { ...l, seed: randomSeed(rand), palette, colors: { ...PALETTES[palette] } }
    }),
    land: { ...s.land, seed: randomSeed(rand), type: pick(LAND_TYPES, rand) },
  }
}
