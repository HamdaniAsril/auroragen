import type { Lang } from '../i18n/lang'
import { clampScene } from '../scene/clamp'
import { defaultLayer, defaultScene } from '../scene/defaults'
import { PALETTES } from '../scene/palettes'
import type { AuroraLayer, AuroraType, Camera, Effects, Land, Scene, Sky } from '../scene/types'
import type { Preset } from './types'

export type { Preset }

interface SceneOverrides {
  layers?: Partial<AuroraLayer>[]
  sky?: Partial<Omit<Sky, 'moon'>> & { moon?: Partial<Sky['moon']> }
  land?: Partial<Omit<Land, 'water'>> & { water?: Partial<Land['water']> }
  camera?: Partial<Camera>
  effects?: Partial<Effects>
  time?: number
}

/** Builds a complete, already-clamped scene from the default plus a few overrides. */
function scene(o: SceneOverrides = {}): Omit<Scene, 'frame'> {
  const d = defaultScene()
  const layers = (o.layers ?? [{}]).map((l) => {
    const base = defaultLayer(l.type ?? 'tirai')
    const palette = l.palette ?? base.palette
    return { ...base, ...l, colors: l.colors ?? (palette === 'custom' ? base.colors : { ...PALETTES[palette] }) }
  })
  const full = clampScene({
    ...d,
    time: o.time ?? d.time,
    layers,
    sky: { ...d.sky, ...o.sky, moon: { ...d.sky.moon, ...o.sky?.moon } },
    land: { ...d.land, ...o.land, water: { ...d.land.water, ...o.land?.water } },
    camera: { ...d.camera, ...o.camera },
    effects: { ...d.effects, ...o.effects },
  })
  const { frame: _frame, ...rest } = full
  return rest
}

const preset = (id: string, name: Record<Lang, string>, s: Omit<Scene, 'frame'>): Preset => ({ id, name, type: s.layers[0].type, scene: s })

export const PRESETS: Preset[] = [
  preset('lakeside-night', { id: 'Malam di Danau', en: 'Lakeside Night' }, scene()),
  preset('quiet-arc', { id: 'Busur Tenang', en: 'Quiet Arc' }, scene({
    layers: [{ type: 'busur', seed: 88, palette: 'green-violet' }],
    land: { type: 'hills', seed: 9, height: 0.7 },
    camera: { pitch: 16, lens: 14 },
  })),
  preset('sky-crown', { id: 'Mahkota Langit', en: 'Sky Crown' }, scene({
    layers: [{ type: 'korona', seed: 2931, brightness: 1.2 }],
    land: { type: 'pines', seed: 42, water: { enabled: false } },
    camera: { pitch: 80, lens: 14 },
  })),
  preset('pillars-over-pines', { id: 'Pilar di Atas Pinus', en: 'Pillars over Pines' }, scene({
    layers: [{ type: 'pilar', seed: 77, rayHeight: 0.7 }],
    land: { type: 'pines', seed: 314, height: 0.6, water: { enabled: false } },
    camera: { pitch: 10, lens: 20 },
  })),
  preset('fjord-spiral', { id: 'Pusaran Fjord', en: 'Fjord Spiral' }, scene({
    layers: [{ type: 'pusaran', seed: 5150 }],
    land: { type: 'mountains', seed: 2718, height: 0.8 },
    camera: { pitch: 24, lens: 14 },
  })),
  preset('red-storm', { id: 'Badai Merah', en: 'Red Storm' }, scene({
    layers: [{ type: 'tirai', seed: 6021, palette: 'rare-red', rayHeight: 0.8, brightness: 1.15 }],
    land: { type: 'mountains', seed: 1123, height: 0.6 },
    camera: { pitch: 16, lens: 16 },
  })),
  preset('ice-blue', { id: 'Es Biru', en: 'Ice Blue' }, scene({
    layers: [{ type: 'tirai', seed: 3407, palette: 'ice-blue' }],
    sky: { moon: { enabled: true, azimuth: -40, elevation: 15, brightness: 0.6 } },
    land: { type: 'hills', seed: 55, height: 0.6 },
  })),
  preset('pink-veil', { id: 'Tirai Merah Muda', en: 'Pink Veil' }, scene({
    layers: [{ type: 'tirai', seed: 919, palette: 'pink-violet', foldAmount: 0.65 }],
    land: { type: 'none', water: { reflection: 0.85 } },
    camera: { pitch: 12, lens: 18 },
  })),
  preset('double-curtain', { id: 'Dua Tirai', en: 'Double Curtain' }, scene({
    layers: [
      { type: 'tirai', seed: 1207 },
      { type: 'tirai', seed: 4321, distance: 3.6, azimuth: 25, palette: 'green-violet', brightness: 0.8 },
    ],
    land: { type: 'mountains', seed: 7205 },
  })),
  preset('open-horizon', { id: 'Cakrawala Terbuka', en: 'Open Horizon' }, scene({
    layers: [{ type: 'busur', seed: 404, distance: 2.6 }],
    land: { type: 'none', water: { ripple: 0.2 } },
    camera: { pitch: 14, lens: 12 },
  })),
  preset('moon-and-aurora', { id: 'Bulan dan Aurora', en: 'Moon and Aurora' }, scene({
    layers: [{ type: 'tirai', seed: 2024, azimuth: -10 }],
    sky: { moon: { enabled: true, azimuth: 35, elevation: 18, brightness: 0.8 } },
    land: { type: 'mountains', seed: 808, height: 0.7 },
  })),
  preset('mountain-valley', { id: 'Lembah Gunung', en: 'Mountain Valley' }, scene({
    layers: [{ type: 'tirai', seed: 1599, distance: 2.8 }],
    land: { type: 'mountains', seed: 3301, height: 1, roughness: 0.7, water: { enabled: false } },
    camera: { pitch: 18, lens: 16 },
  })),
  preset('violet-pillars', { id: 'Pilar Ungu', en: 'Violet Pillars' }, scene({
    layers: [{ type: 'pilar', seed: 4848, palette: 'green-violet', rayHeight: 0.8 }],
    land: { type: 'hills', seed: 120 },
    camera: { pitch: 12, lens: 18 },
  })),
  preset('corona-lake', { id: 'Korona di Atas Danau', en: 'Corona over the Lake' }, scene({
    layers: [{ type: 'korona', seed: 7777, palette: 'green-violet' }],
    land: { type: 'mountains', seed: 64 },
    camera: { pitch: 72, lens: 12 },
  })),
  preset('crimson-spiral', { id: 'Pusaran Merah', en: 'Crimson Spiral' }, scene({
    layers: [{ type: 'pusaran', seed: 2600, palette: 'rare-red' }],
    land: { type: 'pines', seed: 77, water: { enabled: false } },
    camera: { pitch: 26, lens: 14 },
  })),
  preset('full-sky', { id: 'Langit Penuh', en: 'Full Sky' }, scene({
    layers: [
      { type: 'tirai', seed: 1207, distance: 2.1 },
      { type: 'busur', seed: 31, distance: 3.0, brightness: 0.6, palette: 'green-violet' },
    ],
    land: { type: 'mountains', seed: 7205 },
    camera: { pitch: 20, lens: 12 },
  })),
  preset('calm-backdrop', { id: 'Latar Tenang', en: 'Calm Backdrop' }, scene({
    layers: [{ type: 'busur', seed: 515, brightness: 0.7, palette: 'ice-blue' }],
    land: { type: 'none', water: { enabled: false } },
    camera: { pitch: 30, lens: 16 },
    effects: { grain: 0.2, vignette: 0.6 },
  })),
  preset('tall-curtain', { id: 'Tirai Tinggi', en: 'Tall Curtain' }, scene({
    layers: [{ type: 'tirai', seed: 6400, rayHeight: 1, rayContrast: 0.9 }],
    land: { type: 'hills', seed: 222 },
    camera: { pitch: 28, lens: 16 },
  })),
]

export function filterPresets(list: Preset[], o: { query: string; type?: AuroraType; lang: Lang }): Preset[] {
  const q = o.query.trim().toLowerCase()
  return list.filter((p) => (!o.type || p.type === o.type) && (!q || p.name.id.toLowerCase().includes(q) || p.name.en.toLowerCase().includes(q)))
}
