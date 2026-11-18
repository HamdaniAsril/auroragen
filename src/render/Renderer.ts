import type { Scene } from '../scene/types'
import { createTarget, deleteTarget, Program, type Target } from './gl'
import { sceneToUniforms } from './uniforms'
import compositeFrag from './shaders/composite.frag.glsl?raw'
import fullscreenVert from './shaders/fullscreen.vert.glsl?raw'
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
}

export class RendererUnsupportedError extends Error {
  constructor() {
    super('WebGL2 is not available')
  }
}

const STEPS: Record<Quality, number> = { preview: 64, refine: 112, export: 160 }

export class Renderer {
  private gl: WebGL2RenderingContext
  private scene!: Program
  private composite!: Program
  private vao!: WebGLVertexArrayObject
  private hdr?: Target
  private floatTargets = false
  private lost = false
  private restoredListeners = new Set<() => void>()

  readonly canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false, alpha: false })
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
    this.vao = gl.createVertexArray()
    this.hdr = undefined
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

    const u = sceneToUniforms(scene, time, W / H)
    const frame = { uFullRes: [W, H], uTileOrigin: [tile.x, H - tile.y - tile.h] }
    const hdr = this.ensureHdr(tile.w, tile.h)

    gl.bindVertexArray(this.vao)
    gl.bindFramebuffer(gl.FRAMEBUFFER, hdr.fb)
    gl.viewport(0, 0, tile.w, tile.h)
    this.scene.use({
      ...u,
      ...frame,
      uSteps: STEPS[quality],
      uJitter: quality === 'preview' ? 1 : 0,
      uHdrOut: this.floatTargets ? 1 : 0.25,
    })
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, tile.w, tile.h)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, hdr.tex)
    this.composite.use({ ...frame, uHdr: 0, uTime: time, uFx: u.uFx, uHdrScale: this.floatTargets ? 1 : 4 })
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

  onRestored(cb: () => void): () => void {
    this.restoredListeners.add(cb)
    return () => this.restoredListeners.delete(cb)
  }

  dispose(): void {
    const gl = this.gl
    this.canvas.removeEventListener('webglcontextlost', this.onLost)
    this.canvas.removeEventListener('webglcontextrestored', this.onRestoredEvent)
    this.restoredListeners.clear()
    deleteTarget(gl, this.hdr)
    this.scene.dispose()
    this.composite.dispose()
    gl.deleteVertexArray(this.vao)
  }
}
