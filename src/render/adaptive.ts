/** Lowers the preview's internal resolution when frames are slow, raises it when they're fast. */
export class AdaptiveScaler {
  private min: number
  private max: number
  private ema: number | undefined
  private scale: number

  constructor(o: { min?: number; max?: number } = {}) {
    this.min = o.min ?? 0.35
    this.max = o.max ?? 1
    this.scale = this.max
  }

  sample(frameMs: number): number {
    this.ema = this.ema === undefined ? frameMs : this.ema + 0.2 * (frameMs - this.ema)
    if (this.ema > 1000 / 30) this.scale = Math.max(this.min, this.scale * 0.85)
    else if (this.ema < 1000 / 50) this.scale = Math.min(this.max, this.scale * 1.1)
    return this.scale
  }
}
