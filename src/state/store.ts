import { useStore } from 'zustand'
import { createStore, type StoreApi } from 'zustand/vanilla'
import type { Lang } from '../i18n/lang'
import type { Preset } from '../presets/types'
import { clampScene } from '../scene/clamp'
import { defaultLayer, defaultScene } from '../scene/defaults'
import { randomizeScene, randomSeed } from '../scene/random'
import { clampTo } from '../scene/ranges'
import { MAX_LAYERS, type AuroraLayer, type Scene } from '../scene/types'
import { record, type History } from './history'
import { sizeInStepWith } from './urlSync'

export type ExportFormat = 'png' | 'jpg' | 'webp'

export interface StudioState {
  scene: Scene
  activeLayer: number
  playing: boolean
  speed: number
  lang: Lang
  presetId: string | null
  dirty: boolean
  exportSize: { w: number; h: number }
  format: ExportFormat
  quality: number
  zoom: 'fit' | '100'
  history: History
  update(fn: (s: Scene) => void, key?: string): void
  updateLayer(i: number, patch: Partial<AuroraLayer>, key?: string): void
  addLayer(): void
  removeLayer(i: number): void
  setActiveLayer(i: number): void
  randomizeAll(): void
  applyPreset(p: Preset): void
  loadScene(s: Scene, opts?: { keepFrame?: boolean }): void
  undo(): void
  redo(): void
  setPlaying(b: boolean): void
  setSpeed(x: number): void
  setTime(t: number): void
  setLang(l: Lang): void
  setExport(patch: Partial<Pick<StudioState, 'exportSize' | 'format' | 'quality'>>): void
  setZoom(z: 'fit' | '100'): void
}

interface StoreOptions {
  now?: () => number
  rand?: () => number
}

export function createStudioStore(initial?: Scene, opts: StoreOptions = {}): StoreApi<StudioState> {
  const now = opts.now ?? (() => Date.now())
  const rand = opts.rand ?? Math.random

  return createStore<StudioState>((set, get) => {
    /** Replaces the scene and records the previous one as an undo step. */
    const commit = (next: Scene, key?: string, extra: Partial<StudioState> = {}) => {
      const { scene, history } = get()
      set({ scene: clampScene(next), history: record(history, scene, key, now()), dirty: true, ...extra })
    }

    return {
      scene: clampScene(initial ?? defaultScene()),
      activeLayer: 0,
      playing: true,
      speed: 1,
      lang: 'id',
      presetId: null,
      dirty: false,
      exportSize: { w: 3840, h: 2160 },
      format: 'png',
      quality: 0.92,
      zoom: 'fit',
      history: { past: [], future: [] },

      update(fn, key) {
        const draft = structuredClone(get().scene)
        fn(draft)
        commit(draft, key)
      },

      updateLayer(i, patch, key) {
        get().update((s) => {
          if (s.layers[i]) s.layers[i] = { ...s.layers[i], ...patch }
        }, key)
      },

      addLayer() {
        const { scene } = get()
        if (scene.layers.length >= MAX_LAYERS) return
        const layer: AuroraLayer = {
          ...defaultLayer('tirai'),
          seed: randomSeed(rand),
          distance: 3.2,
          azimuth: Math.round((rand() - 0.5) * 80),
        }
        commit({ ...scene, layers: [...scene.layers, layer] }, undefined, { activeLayer: scene.layers.length })
      },

      removeLayer(i) {
        const { scene, activeLayer } = get()
        if (scene.layers.length <= 1 || !scene.layers[i]) return
        const layers = scene.layers.filter((_, j) => j !== i)
        commit({ ...scene, layers }, undefined, { activeLayer: Math.min(activeLayer, layers.length - 1) })
      },

      setActiveLayer(i) {
        set({ activeLayer: Math.max(0, Math.min(i, get().scene.layers.length - 1)) })
      },

      randomizeAll() {
        commit(randomizeScene(get().scene, rand))
      },

      applyPreset(p) {
        commit({ ...p.scene, frame: get().scene.frame }, undefined, { presetId: p.id, dirty: false, activeLayer: 0 })
      },

      loadScene(s, o = {}) {
        const frame = o.keepFrame ? get().scene.frame : s.frame
        commit({ ...s, frame }, undefined, { dirty: false, activeLayer: 0, exportSize: sizeInStepWith(frame, get().exportSize) })
      },

      undo() {
        const { history, scene } = get()
        const prev = history.past[history.past.length - 1]
        if (!prev) return
        set({
          scene: { ...prev, time: scene.time },
          exportSize: sizeInStepWith(prev.frame, get().exportSize),
          history: { past: history.past.slice(0, -1), future: [scene, ...history.future] },
          activeLayer: Math.min(get().activeLayer, prev.layers.length - 1),
          dirty: true,
        })
      },

      redo() {
        const { history, scene } = get()
        const next = history.future[0]
        if (!next) return
        set({
          scene: { ...next, time: scene.time },
          exportSize: sizeInStepWith(next.frame, get().exportSize),
          history: { past: [...history.past, scene], future: history.future.slice(1) },
          activeLayer: Math.min(get().activeLayer, next.layers.length - 1),
          dirty: true,
        })
      },

      setPlaying(b) {
        set({ playing: b })
      },

      setSpeed(x) {
        set({ speed: x })
      },

      setTime(t) {
        set({ scene: { ...get().scene, time: clampTo('time', t) } })
      },

      setLang(l) {
        set({ lang: l })
      },

      setExport(patch) {
        set(patch)
      },

      setZoom(z) {
        set({ zoom: z })
      },
    }
  })
}

/** The app-wide store. */
export const studio = createStudioStore()

export function useStudio<T>(selector: (s: StudioState) => T): T {
  return useStore(studio, selector)
}
