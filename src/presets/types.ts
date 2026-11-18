import type { Lang } from '../i18n/lang'
import type { AuroraType, Scene } from '../scene/types'

export interface Preset {
  id: string
  name: Record<Lang, string>
  type: AuroraType
  scene: Omit<Scene, 'frame'>
}
