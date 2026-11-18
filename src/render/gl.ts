export type UniformValue = number | ArrayLike<number>

export interface Target {
  fb: WebGLFramebuffer
  tex: WebGLTexture
  w: number
  h: number
}

interface UniformInfo {
  loc: WebGLUniformLocation
  type: number
}

export class Program {
  readonly prog: WebGLProgram
  private uniforms = new Map<string, UniformInfo>()
  private gl: WebGL2RenderingContext

  constructor(gl: WebGL2RenderingContext, vs: string, fs: string) {
    this.gl = gl
    const p = gl.createProgram()
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs))
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(p)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`link failed: ${gl.getProgramInfoLog(p)}`)
    this.prog = p
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i)
      if (!info) continue
      const loc = gl.getUniformLocation(p, info.name)
      if (loc) this.uniforms.set(info.name.replace(/\[0\]$/, ''), { loc, type: info.type })
    }
  }

  use(values: Record<string, UniformValue>): void {
    const gl = this.gl
    gl.useProgram(this.prog)
    for (const [name, value] of Object.entries(values)) {
      const u = this.uniforms.get(name)
      if (!u) continue // optimised out by the compiler
      const v = typeof value === 'number' ? [value] : Array.from(value)
      switch (u.type) {
        case gl.FLOAT:
          gl.uniform1fv(u.loc, v)
          break
        case gl.FLOAT_VEC2:
          gl.uniform2fv(u.loc, v)
          break
        case gl.FLOAT_VEC3:
          gl.uniform3fv(u.loc, v)
          break
        case gl.FLOAT_VEC4:
          gl.uniform4fv(u.loc, v)
          break
        default:
          gl.uniform1iv(u.loc, v)
      }
    }
  }

  dispose(): void {
    this.gl.deleteProgram(this.prog)
  }
}

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`shader compile failed: ${gl.getShaderInfoLog(s)}`)
  return s
}

export function createTarget(gl: WebGL2RenderingContext, w: number, h: number, float: boolean): Target {
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  if (float) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null)
  else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  const fb = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  return { fb, tex, w, h }
}

export function deleteTarget(gl: WebGL2RenderingContext, t: Target | undefined): void {
  if (!t) return
  gl.deleteFramebuffer(t.fb)
  gl.deleteTexture(t.tex)
}
