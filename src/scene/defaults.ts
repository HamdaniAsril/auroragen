import { PALETTES } from './palettes'
import { RENDERER_VERSION, SCENE_VERSION, type AuroraLayer, type AuroraType, type Scene } from './types'

export function defaultLayer(type: AuroraType = 'tirai'): AuroraLayer {
  return {
    type,
    seed: 1207,
    distance: 2.3,
    azimuth: 0,
    length: 1,
    foldAmount: 0.5,
    foldDensity: 0.5,
    baseAltitude: 1,
    rayHeight: 0.5,
    rayDensity: 0.5,
    rayContrast: 0.8,
    brightness: 1,
    speed: 1,
    palette: 'classic-green',
    colors: { ...PALETTES['classic-green'] },
    fringe: true,
  }
}

export function defaultScene(): Scene {
  return {
    v: SCENE_VERSION,
    renderer: RENDERER_VERSION,
    time: 30,
    frame: { aspectW: 16, aspectH: 9, auroraOnly: false },
    layers: [defaultLayer()],
    sky: {
      zenith: '#0A1424',
      horizon: '#283C4A',
      starDensity: 0.5,
      starBrightness: 0.6,
      auroraGlow: 0.5,
      moon: { enabled: false, azimuth: 60, elevation: 20, brightness: 0.6 },
    },
    land: {
      type: 'mountains',
      seed: 7205,
      height: 0.5,
      roughness: 0.5,
      color: '#0D161B',
      water: { enabled: true, ripple: 0.4, reflection: 0.7 },
    },
    camera: { pitch: 14, yaw: 0, lens: 17 },
    effects: { exposure: 0, bloom: 0.4, saturation: 1, grain: 0.3, vignette: 0.4 },
  }
}
