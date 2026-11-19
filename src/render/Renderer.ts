import type { Scene } from '../scene/types'
import { createTarget, deleteTarget, Program, type Target } from './gl'
import { sceneToUniforms } from './uniforms'
import compositeFrag from './shaders/composite.frag.glsl?raw'
import fullscreenVert from './shaders/fullscreen.vert.glsl?raw'
import bloomFrag from './shaders/bloom.frag.glsl?raw'
import sceneFrag from './shaders/scene.frag.glsl?raw'

export type Quality = 'preview' | 'refine' | 'export'

export interface TileRect {
  x: number
  y: number
  w: number
  h: number
}

export interface RenderTarget {
  width: number
  height: number
  /** Region of the full image in top-left pixel coordinates. */
  tile?: TileRect
  /** Skip recomputing bloom; use the source from the last renderBloomSource() call. */
  reuseBloom?: boolean
}

export class RendererUnsupportedError extends Error {
  constructor() {
    super('WebGL2 is not available')
  }
}

const STEPS: Record<Quality, number> = { preview: 64, refine: 112, export: 160 }
/** Long side of the low-res full-frame render that bloom is computed from. Same for full frames and tiles. */
const BLOOM_SIDE: Record<Quality, number> = { preview: 256, refine: 384, export: 512 }
const BLOOM_LEVELS = 4

export class Renderer {
  private gl: WebGL2RenderingContext
  private scene!: Program
  private composite!: Program
  private bloom!: Program
  private bloomSrc?: Target
  private bloomDown: Target[] = []
  private bloomUp: Target[] = []
  private black!: Target
  private bloomTex?: WebGLTexture
  private vao!: WebGLVertexArrayObject
  private hdr?: Target
  private floatTargets = false
  private lost = false
  private restoredListeners = new Set<() => void>()

  readonly canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false, alpha: true })
    if (!gl) throw new RendererUnsupportedError()
    this.gl = gl
    canvas.addEventListener('webglcontextlost', this.onLost)
    canvas.addEventListener('webglcontextrestored', this.onRestoredEvent)
    this.init()
  }

  private onLost = (e: Event) => {
    e.preventDefault()
    this.lost = true
  }

  private onRestoredEvent = () => {
    this.init()
    this.lost = false
    for (const cb of this.restoredListeners) cb()
  }

  private init(): void {
    const gl = this.gl
    this.floatTargets = !!gl.getExtension('EXT_color_buffer_float')
    this.scene = new Program(gl, fullscreenVert, sceneFrag)
    this.composite = new Program(gl, fullscreenVert, compositeFrag)
    this.bloom = new Program(gl, fullscreenVert, bloomFrag)
    this.vao = gl.createVertexArray()
    this.hdr = undefined
    this.bloomSrc = undefined
    this.bloomDown = []
    this.bloomUp = []
    this.black = createTarget(gl, 1, 1, false)
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.black.fb)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    this.bloomTex = undefined
  }

  private sized(t: Target | undefined, w: number, h: number): Target {
    if (t && t.w === w && t.h === h) return t
    deleteTarget(this.gl, t)
    return createTarget(this.gl, w, h, this.floatTargets)
  }

  private drawScenePass(scene: Scene, time: number, W: number, H: number, tile: TileRect, quality: Quality, into: Target): void {
    const gl = this.gl
    gl.bindVertexArray(this.vao)
    gl.bindFramebuffer(gl.FRAMEBUFFER, into.fb)
    gl.viewport(0, 0, tile.w, tile.h)
    this.scene.use({
      ...sceneToUniforms(scene, time, W / H),
      uFullRes: [W, H],
      uTileOrigin: [tile.x, H - tile.y - tile.h],
      uSteps: STEPS[quality],
      uJitter: quality === 'preview' ? 1 : 0,
      uHdrOut: this.floatTargets ? 1 : 0.25,
    })
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  /** Renders a low-res full frame and blurs it into the bloom texture used by the next render(s). */
  renderBloomSource(scene: Scene, time: number, aspect: number, quality: Quality): void {
    const gl = this.gl
    if (this.lost || gl.isContextLost()) return
    if (scene.effects.bloom <= 0) {
      this.bloomTex = this.black.tex
      return
    }
    const side = BLOOM_SIDE[quality]
    const bw = Math.max(16, Math.round(aspect >= 1 ? side : side * aspect))
    const bh = Math.max(16, Math.round(aspect >= 1 ? side / aspect : side))
    this.bloomSrc = this.sized(this.bloomSrc, bw, bh)
    this.drawScenePass(scene, time, bw, bh, { x: 0, y: 0, w: bw, h: bh }, quality, this.bloomSrc)

    let src = this.bloomSrc
    for (let i = 0; i < BLOOM_LEVELS; i++) {
      const w = Math.max(1, src.w >> 1)
      const h = Math.max(1, src.h >> 1)
      this.bloomDown[i] = this.sized(this.bloomDown[i], w, h)
      this.bloomPass(i === 0 ? 0 : 1, src, this.bloomDown[i])
      src = this.bloomDown[i]
    }
    let acc = this.bloomDown[BLOOM_LEVELS - 1]
    for (let i = BLOOM_LEVELS - 2; i >= 0; i--) {
      const base = this.bloomDown[i]
      this.bloomUp[i] = this.sized(this.bloomUp[i], base.w, base.h)
      this.bloomPass(2, acc, this.bloomUp[i], base)
      acc = this.bloomUp[i]
    }
    this.bloomTex = acc.tex
  }

  private bloomPass(mode: number, src: Target, dst: Target, base?: Target): void {
    const gl = this.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb)
    gl.viewport(0, 0, dst.w, dst.h)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, src.tex)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, (base ?? this.black).tex)
    this.bloom.use({
      uSrc: 0,
      uBase: 1,
      uSrcTexel: [1 / src.w, 1 / src.h],
      uDstSize: [dst.w, dst.h],
      uMode: mode,
      uThreshold: 0.08,
    })
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  private ensureHdr(w: number, h: number): Target {
    if (!this.hdr || this.hdr.w !== w || this.hdr.h !== h) {
      deleteTarget(this.gl, this.hdr)
      this.hdr = createTarget(this.gl, w, h, this.floatTargets)
    }
    return this.hdr
  }

  /** Draws the scene into the canvas. The canvas is resized to the target (or tile) size. */
  render(scene: Scene, time: number, target: RenderTarget, quality: Quality): void {
    const gl = this.gl
    if (this.lost || gl.isContextLost()) return
    const W = target.width
    const H = target.height
    const tile = target.tile ?? { x: 0, y: 0, w: W, h: H }
    if (this.canvas.width !== tile.w) this.canvas.width = tile.w
    if (this.canvas.height !== tile.h) this.canvas.height = tile.h

    if (!target.reuseBloom || !this.bloomTex) this.renderBloomSource(scene, time, W / H, quality)
    const hdr = this.ensureHdr(tile.w, tile.h)
    this.drawScenePass(scene, time, W, H, tile, quality, hdr)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, tile.w, tile.h)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, hdr.tex)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.bloomTex ?? this.black.tex)
    this.composite.use({
      uFullRes: [W, H],
      uTileOrigin: [tile.x, H - tile.y - tile.h],
      uHdr: 0,
      uBloom: 1,
      uTime: time,
      uFx: [scene.effects.exposure, scene.effects.bloom, scene.effects.saturation, scene.effects.grain, scene.effects.vignette],
      uHdrScale: this.floatTargets ? 1 : 4,
      uAuroraOnly: scene.frame.auroraOnly ? 1 : 0,
    })
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  /** RGBA bytes of the last render, rows top to bottom. Call right after render(). */
  readPixels(): Uint8Array {
    const gl = this.gl
    const w = this.canvas.width
    const h = this.canvas.height
    const buf = new Uint8Array(w * h * 4)
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf)
    const out = new Uint8Array(buf.length)
    const row = w * 4
    for (let y = 0; y < h; y++) out.set(buf.subarray((h - 1 - y) * row, (h - y) * row), y * row)
    return out
  }

  isLost(): boolean {
    return this.lost || this.gl.isContextLost()
  }

  onRestored(cb: () => void): () => void {
    this.restoredListeners.add(cb)
    return () => this.restoredListeners.delete(cb)
  }

  dispose(): void {
    const gl = this.gl
    this.canvas.removeEventListener('webglcontextlost', this.onLost)
    this.canvas.removeEventListener('webglcontextrestored', this.onRestoredEvent)
    this.restoredListeners.clear()
    for (const t of [this.hdr, this.bloomSrc, this.black, ...this.bloomDown, ...this.bloomUp]) deleteTarget(gl, t)
    this.scene.dispose()
    this.composite.dispose()
    this.bloom.dispose()
    gl.deleteVertexArray(this.vao)
  }
}
