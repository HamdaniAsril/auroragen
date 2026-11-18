import { useT } from '../../i18n/useT'
import { LAND_TYPES } from '../../scene/types'
import { studio, useStudio } from '../../state/store'
import { ColorRow } from '../controls/ColorRow'
import { Section } from '../controls/Section'
import { SeedRow } from '../controls/SeedRow'
import { SliderRow } from '../controls/SliderRow'
import { Toggle } from '../controls/Toggle'
import { VisualPicker } from '../controls/VisualPicker'
import { LAND_THUMBS } from '../thumbs'

export function LandSection() {
  const t = useT()
  const land = useStudio((s) => s.scene.land)
  const update = studio.getState().update
  return (
    <Section title={t('section.land')}>
      <VisualPicker
        label={t('field.landType')}
        options={LAND_TYPES.map((id) => ({ id, label: t(`land.${id}`), thumb: LAND_THUMBS[id] }))}
        value={land.type}
        onChange={(v) => update((s) => void (s.land.type = v))}
      />
      <SeedRow label={t('field.landSeed')} path="land.seed" value={land.seed} onChange={(v, k) => update((s) => void (s.land.seed = v), k)} info={t('info.landSeed')} />
      <SliderRow label={t('field.height')} path="land.height" value={land.height} onChange={(v, k) => update((s) => void (s.land.height = v), k)} />
      <SliderRow label={t('field.roughness')} path="land.roughness" value={land.roughness} onChange={(v, k) => update((s) => void (s.land.roughness = v), k)} />
      <ColorRow label={t('field.landColor')} value={land.color} onChange={(v) => update((s) => void (s.land.color = v), 'land.color')} />
      <Toggle label={t('field.water')} checked={land.water.enabled} onChange={(v) => update((s) => void (s.land.water.enabled = v))} />
      {land.water.enabled && (
        <>
          <SliderRow label={t('field.ripple')} path="land.water.ripple" value={land.water.ripple} onChange={(v, k) => update((s) => void (s.land.water.ripple = v), k)} />
          <SliderRow label={t('field.reflection')} path="land.water.reflection" value={land.water.reflection} onChange={(v, k) => update((s) => void (s.land.water.reflection = v), k)} />
        </>
      )}
    </Section>
  )
}
