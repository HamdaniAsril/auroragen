import { useT } from '../../i18n/useT'
import { studio, useStudio } from '../../state/store'
import { Section } from '../controls/Section'
import { SliderRow } from '../controls/SliderRow'

export function EffectsSection() {
  const t = useT()
  const fx = useStudio((s) => s.scene.effects)
  const update = studio.getState().update
  return (
    <Section title={t('section.effects')}>
      <SliderRow label={t('field.exposure')} path="effects.exposure" value={fx.exposure} onChange={(v, k) => update((s) => void (s.effects.exposure = v), k)} />
      <SliderRow label={t('field.bloom')} path="effects.bloom" value={fx.bloom} onChange={(v, k) => update((s) => void (s.effects.bloom = v), k)} info={t('info.bloom')} />
      <SliderRow label={t('field.saturation')} path="effects.saturation" value={fx.saturation} onChange={(v, k) => update((s) => void (s.effects.saturation = v), k)} />
      <SliderRow label={t('field.grain')} path="effects.grain" value={fx.grain} onChange={(v, k) => update((s) => void (s.effects.grain = v), k)} />
      <SliderRow label={t('field.vignette')} path="effects.vignette" value={fx.vignette} onChange={(v, k) => update((s) => void (s.effects.vignette = v), k)} />
    </Section>
  )
}
