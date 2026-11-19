import { FRINGE } from '../scene/palettes'
import { AURORA_TYPES, LAND_TYPES, MAX_LAYERS, type Hex, type Scene } from '../scene/types'
import { fovFromLens } from './camera'

type Vec3 = [number, number, number]

export interface Uniforms {
  uTime: number
  uLayerCount: number
  uLayerType: Int32Array
  uLayerSeed: Float32Array
  uLayerGeom: Float32Array
  uLayerRays: Float32Array
  uLayerMisc: Float32Array
  uLayerColBottom: Float32Array
  uLayerColBody: Float32Array
  uLayerColTop: Float32Array
  uFringe: Vec3
  uSkyZenith: Vec3
  uSkyHorizon: Vec3
  uStars: [number, number]
  uAuroraGlow: number
  uMoon: [number, number, number, number]
  uLand: [number, number, number, number]
  uLandColor: Vec3
  uWater: Vec3
  uCam: [number, number, number, number]
  uFx: [number, number, number, number, number]
  uAuroraOnly: number
}

const RAD = Math.PI / 180
const fract = (x: number) => x - Math.floor(x)

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

export function hexToLinear(hex: Hex): Vec3 {
  const n = parseInt(hex.slice(1), 16)
  return [toLinear(((n >> 16) & 255) / 255), toLinear(((n >> 8) & 255) / 255), toLinear((n & 255) / 255)]
}

export function sceneToUniforms(scene: Scene, time: number, aspect: number): Uniforms {
  const n = Math.min(scene.layers.length, MAX_LAYERS)
  const u: Uniforms = {
    uTime: time,
    uLayerCount: n,
    uLayerType: new Int32Array(MAX_LAYERS),
    uLayerSeed: new Float32Array(MAX_LAYERS),
    uLayerGeom: new Float32Array(MAX_LAYERS * 4),
    uLayerRays: new Float32Array(MAX_LAYERS * 4),
    uLayerMisc: new Float32Array(MAX_LAYERS * 4),
    uLayerColBottom: new Float32Array(MAX_LAYERS * 3),
    uLayerColBody: new Float32Array(MAX_LAYERS * 3),
    uLayerColTop: new Float32Array(MAX_LAYERS * 3),
    uFringe: hexToLinear(FRINGE),
    uSkyZenith: hexToLinear(scene.sky.zenith),
    uSkyHorizon: hexToLinear(scene.sky.horizon),
    uStars: [scene.sky.starDensity, scene.sky.starBrightness],
    uAuroraGlow: scene.sky.auroraGlow,
    uMoon: [
      scene.sky.moon.enabled ? 1 : 0,
      scene.sky.moon.azimuth * RAD,
      scene.sky.moon.elevation * RAD,
      scene.sky.moon.brightness,
    ],
    uLand: [LAND_TYPES.indexOf(scene.land.type), fract(scene.land.seed * 0.7548777), scene.land.height, scene.land.roughness],
    uLandColor: hexToLinear(scene.land.color),
    uWater: [scene.land.water.enabled ? 1 : 0, scene.land.water.ripple, scene.land.water.reflection],
    uAuroraOnly: scene.frame.auroraOnly ? 1 : 0,
    uCam: [0, 0, 0, 0],
    uFx: [
      scene.effects.exposure,
      scene.effects.bloom,
      scene.effects.saturation,
      scene.effects.grain,
      scene.effects.vignette,
    ],
  }

  for (let i = 0; i < n; i++) {
    const l = scene.layers[i]
    u.uLayerType[i] = AURORA_TYPES.indexOf(l.type)
    u.uLayerSeed[i] = fract(l.seed * 0.6180339)
    u.uLayerGeom.set([l.distance, l.azimuth * RAD, l.foldAmount, l.foldDensity], i * 4)
    u.uLayerRays.set([l.baseAltitude, l.rayHeight, l.rayDensity, l.rayContrast], i * 4)
    u.uLayerMisc.set([l.brightness, l.length, l.speed, l.fringe ? 1 : 0], i * 4)
    u.uLayerColBottom.set(hexToLinear(l.colors.bottom), i * 3)
    u.uLayerColBody.set(hexToLinear(l.colors.body), i * 3)
    u.uLayerColTop.set(hexToLinear(l.colors.top), i * 3)
  }

  const { tanHalfX, tanHalfY } = fovFromLens(scene.camera.lens, aspect)
  u.uCam = [scene.camera.pitch * RAD, scene.camera.yaw * RAD, tanHalfX, tanHalfY]
  return u
}
