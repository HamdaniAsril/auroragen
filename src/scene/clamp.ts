import { clampTo, type RangePath } from './ranges'
import { defaultLayer, defaultScene } from './defaults'
import {
  AURORA_TYPES,
  LAND_TYPES,
  MAX_LAYERS,
  PALETTE_IDS,
  RENDERER_VERSION,
  SCENE_VERSION,
  type AuroraLayer,
  type Frame,
  type Hex,
  type Scene,
} from './types'

type Obj = Record<string, unknown>

const obj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {})

const num = (v: unknown, path: RangePath, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? clampTo(path, v) : fallback

const seed = (v: unknown, path: RangePath, fallback: number): number => Math.round(num(v, path, fallback))

const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback)

const hex = (v: unknown, fallback: Hex): Hex =>
  typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v.toUpperCase() : fallback

const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T =>
  options.includes(v as T) ? (v as T) : fallback

function clampLayer(input: unknown): AuroraLayer {
  const o = obj(input)
  const d = defaultLayer(oneOf(o.type, AURORA_TYPES, 'tirai'))
  const c = obj(o.colors)
  return {
    type: d.type,
    seed: seed(o.seed, 'layer.seed', d.seed),
    distance: num(o.distance, 'layer.distance', d.distance),
    azimuth: num(o.azimuth, 'layer.azimuth', d.azimuth),
    length: num(o.length, 'layer.length', d.length),
    foldAmount: num(o.foldAmount, 'layer.foldAmount', d.foldAmount),
    foldDensity: num(o.foldDensity, 'layer.foldDensity', d.foldDensity),
    baseAltitude: num(o.baseAltitude, 'layer.baseAltitude', d.baseAltitude),
    rayHeight: num(o.rayHeight, 'layer.rayHeight', d.rayHeight),
    rayDensity: num(o.rayDensity, 'layer.rayDensity', d.rayDensity),
    rayContrast: num(o.rayContrast, 'layer.rayContrast', d.rayContrast),
    brightness: num(o.brightness, 'layer.brightness', d.brightness),
    speed: num(o.speed, 'layer.speed', d.speed),
    palette: oneOf(o.palette, PALETTE_IDS, d.palette),
    colors: {
      bottom: hex(c.bottom, d.colors.bottom),
      body: hex(c.body, d.colors.body),
      top: hex(c.top, d.colors.top),
    },
    fringe: bool(o.fringe, d.fringe),
  }
}

function clampFrame(input: unknown, fallback: Frame): Frame {
  const o = obj(input)
  const ok = (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 10000
  return ok(o.aspectW) && ok(o.aspectH) ? { aspectW: o.aspectW as number, aspectH: o.aspectH as number } : fallback
}

/** Turns anything into a valid Scene: fills gaps from defaults and clamps every value. Never throws. */
export function clampScene(input: unknown): Scene {
  const d = defaultScene()
  const o = obj(input)
  const sky = obj(o.sky)
  const moon = obj(sky.moon)
  const land = obj(o.land)
  const water = obj(land.water)
  const cam = obj(o.camera)
  const fx = obj(o.effects)
  const rawLayers = Array.isArray(o.layers) ? o.layers.slice(0, MAX_LAYERS) : []
  const renderer =
    typeof o.renderer === 'number' && Number.isInteger(o.renderer) && o.renderer >= 1 && o.renderer <= RENDERER_VERSION
      ? o.renderer
      : RENDERER_VERSION

  return {
    v: SCENE_VERSION,
    renderer,
    time: num(o.time, 'time', d.time),
    frame: clampFrame(o.frame, d.frame),
    layers: rawLayers.length ? rawLayers.map(clampLayer) : [defaultLayer()],
    sky: {
      zenith: hex(sky.zenith, d.sky.zenith),
      horizon: hex(sky.horizon, d.sky.horizon),
      starDensity: num(sky.starDensity, 'sky.starDensity', d.sky.starDensity),
      starBrightness: num(sky.starBrightness, 'sky.starBrightness', d.sky.starBrightness),
      auroraGlow: num(sky.auroraGlow, 'sky.auroraGlow', d.sky.auroraGlow),
      moon: {
        enabled: bool(moon.enabled, d.sky.moon.enabled),
        azimuth: num(moon.azimuth, 'sky.moon.azimuth', d.sky.moon.azimuth),
        elevation: num(moon.elevation, 'sky.moon.elevation', d.sky.moon.elevation),
        brightness: num(moon.brightness, 'sky.moon.brightness', d.sky.moon.brightness),
      },
    },
    land: {
      type: oneOf(land.type, LAND_TYPES, d.land.type),
      seed: seed(land.seed, 'land.seed', d.land.seed),
      height: num(land.height, 'land.height', d.land.height),
      roughness: num(land.roughness, 'land.roughness', d.land.roughness),
      color: hex(land.color, d.land.color),
      water: {
        enabled: bool(water.enabled, d.land.water.enabled),
        ripple: num(water.ripple, 'land.water.ripple', d.land.water.ripple),
        reflection: num(water.reflection, 'land.water.reflection', d.land.water.reflection),
      },
    },
    camera: {
      pitch: num(cam.pitch, 'camera.pitch', d.camera.pitch),
      yaw: num(cam.yaw, 'camera.yaw', d.camera.yaw),
      lens: num(cam.lens, 'camera.lens', d.camera.lens),
    },
    effects: {
      exposure: num(fx.exposure, 'effects.exposure', d.effects.exposure),
      bloom: num(fx.bloom, 'effects.bloom', d.effects.bloom),
      saturation: num(fx.saturation, 'effects.saturation', d.effects.saturation),
      grain: num(fx.grain, 'effects.grain', d.effects.grain),
      vignette: num(fx.vignette, 'effects.vignette', d.effects.vignette),
    },
  }
}
