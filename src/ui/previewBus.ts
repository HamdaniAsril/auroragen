import type { PreviewLoop } from '../render/PreviewLoop'

// The mounted preview's loop, so the play bar can read and move live time.
let current: PreviewLoop | null = null

export const setPreviewLoop = (loop: PreviewLoop | null): void => {
  current = loop
}

export const getPreviewLoop = (): PreviewLoop | null => current
