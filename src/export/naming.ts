import type { Scene } from '../scene/types'
import type { ExportFormat } from '../state/store'

export function exportFilename(scene: Scene, w: number, h: number, format: ExportFormat): string {
  return `aurora-${scene.layers[0].type}-${w}x${h}.${format}`
}

export function cssSnippet(filename: string): string {
  return `background: #02040a url("${filename}") center / cover no-repeat;`
}
