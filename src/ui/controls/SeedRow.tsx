import { useT } from '../../i18n/useT'
import { randomSeed } from '../../scene/random'
import type { RangePath } from '../../scene/ranges'
import { DiceIcon } from '../icons'
import { SliderRow } from './SliderRow'

interface Props {
  label: string
  path: Extract<RangePath, 'layer.seed' | 'land.seed'>
  value: number
  onChange(value: number, key?: string): void
  info?: string
}

export function SeedRow({ label, path, value, onChange, info }: Props) {
  const t = useT()
  return (
    <div className="seed-row">
      <SliderRow label={label} path={path} value={value} onChange={onChange} info={info} />
      <button type="button" className="icon-btn" aria-label={`${t('action.dice')} ${label}`} title={t('action.dice')} onClick={() => onChange(randomSeed(), undefined)}>
        <DiceIcon />
      </button>
    </div>
  )
}
