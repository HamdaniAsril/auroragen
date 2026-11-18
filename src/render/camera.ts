import { clampTo } from '../scene/ranges'
import type { Camera } from '../scene/types'

/** Half of the 43.267 mm full-frame diagonal: lens is measured on the frame diagonal. */
const HALF_DIAGONAL_MM = 21.6335
const DEG = 180 / Math.PI

export function fovFromLens(lensMm: number, aspect: number): { tanHalfX: number; tanHalfY: number } {
  const tanHalfDiag = HALF_DIAGONAL_MM / lensMm
  const d = Math.sqrt(aspect * aspect + 1)
  return { tanHalfX: (tanHalfDiag * aspect) / d, tanHalfY: tanHalfDiag / d }
}

const wrapYaw = (yaw: number) => ((((yaw + 180) % 360) + 360) % 360) - 180

/** Grab-the-sky drag: moving right turns the view left, moving down looks up. */
export function dragCamera(cam: Camera, dxPx: number, dyPx: number, viewW: number, viewH: number): Camera {
  const { tanHalfX, tanHalfY } = fovFromLens(cam.lens, viewW / viewH)
  const degPerPxX = (2 * Math.atan(tanHalfX) * DEG) / viewW
  const degPerPxY = (2 * Math.atan(tanHalfY) * DEG) / viewH
  return {
    ...cam,
    yaw: wrapYaw(cam.yaw - dxPx * degPerPxX),
    pitch: clampTo('camera.pitch', cam.pitch + dyPx * degPerPxY),
  }
}

/** Scrolling up (negative deltaY) zooms in by lengthening the lens. */
export function wheelLens(lens: number, deltaY: number): number {
  return clampTo('camera.lens', lens * Math.exp(-deltaY * 0.001))
}

export function pinchLens(startLens: number, startDist: number, dist: number): number {
  return clampTo('camera.lens', (startLens * dist) / startDist)
}
