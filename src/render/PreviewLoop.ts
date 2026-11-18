import type { Scene } from '../scene/types'
import { AdaptiveScaler } from './adaptive'
import type { Renderer } from './Renderer'

interface LoopOptions {
  now?: () => number
  raf?: (cb: FrameRequestCallback) => number
  caf?: (id: number) => void
}

const REFINE_AFTER_MS = 250

/**
 * Drives the live preview. While playing, time advances here (not in the store) and frames render at an
 * adaptive scale. When paused, a change renders a quick frame, then one sharp frame once things settle.
 */
export class PreviewLoop {
  private r: Pick<Renderer, 'render'>
  private getScene: () => Scene
  private now: () => number
  private raf: (cb: FrameRequestCallback) => number
  private caf: (id: number) => void
  private scaler = new AdaptiveScaler()
  private scale = 1
  private playing = false
  private speed = 1
  private time: number
  private dirty = true
  private refined = false
  private lastChange = 0
  private lastFrame: number | undefined
  private viewW = 0
  private viewH = 0
  private rafId: number | undefined

  constructor(r: Pick<Renderer, 'render'>, getScene: () => Scene, opts: LoopOptions = {}) {
    this.r = r
    this.getScene = getScene
    this.now = opts.now ?? (() => performance.now())
    this.raf = opts.raf ?? ((cb) => requestAnimationFrame(cb))
    this.caf = opts.caf ?? ((id) => cancelAnimationFrame(id))
    this.time = getScene().time
  }

  get liveTime(): number {
    return this.time
  }

  start(): void {
    if (this.rafId !== undefined) return
    this.lastFrame = undefined
    this.rafId = this.raf(this.frame)
  }

  stop(): void {
    if (this.rafId !== undefined) this.caf(this.rafId)
    this.rafId = undefined
  }

  setPlaying(p: boolean): void {
    this.playing = p
    if (!p) this.invalidate()
  }

  setSpeed(x: number): void {
    this.speed = x
  }

  seek(t: number): void {
    this.time = t
    this.invalidate()
  }

  invalidate(): void {
    this.dirty = true
    this.refined = false
    this.lastChange = this.now()
  }

  setView(w: number, h: number): void {
    this.viewW = Math.max(1, Math.round(w))
    this.viewH = Math.max(1, Math.round(h))
    this.invalidate()
  }

  private draw(scale: number, quality: 'preview' | 'refine'): void {
    const width = Math.max(1, Math.round(this.viewW * scale))
    const height = Math.max(1, Math.round(this.viewH * scale))
    this.r.render(this.getScene(), this.time, { width, height }, quality)
  }

  private frame = (): void => {
    const now = this.now()
    const dt = this.lastFrame === undefined ? 0 : now - this.lastFrame
    this.lastFrame = now
    if (this.viewW > 1 && this.viewH > 1) {
      if (this.playing) {
        this.time += (Math.min(dt, 100) / 1000) * this.speed
        if (dt > 0) this.scale = this.scaler.sample(dt)
        this.draw(this.scale, 'preview')
      } else if (this.dirty) {
        this.draw(this.scale, 'preview')
        this.dirty = false
      } else if (!this.refined && now - this.lastChange >= REFINE_AFTER_MS) {
        this.draw(1, 'refine')
        this.refined = true
      }
    }
    this.rafId = this.raf(this.frame)
  }
}
