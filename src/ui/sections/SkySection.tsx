import { useT } from '../../i18n/useT'
import { studio, useStudio } from '../../state/store'
import { ColorRow } from '../controls/ColorRow'
import { Section } from '../controls/Section'
import { SliderRow } from '../controls/SliderRow'
import { Toggle } from '../controls/Toggle'

export function SkySection() {
  const t = useT()
  const sky = useStudio((s) => s.scene.sky)
  const update = studio.getState().update
  return (
    <Section title={t('section.sky')}>
      <ColorRow label={t('field.zenith')} value={sky.zenith} onChange={(v) => update((s) => void (s.sky.zenith = v), 'sky.zenith')} />
      <ColorRow label={t('field.horizon')} value={sky.horizon} onChange={(v) => update((s) => void (s.sky.horizon = v), 'sky.horizon')} />
      <SliderRow label={t('field.starDensity')} path="sky.starDensity" value={sky.starDensity} onChange={(v, k) => update((s) => void (s.sky.starDensity = v), k)} />
      <SliderRow label={t('field.starBrightness')} path="sky.starBrightness" value={sky.starBrightness} onChange={(v, k) => update((s) => void (s.sky.starBrightness = v), k)} />
      <SliderRow label={t('field.auroraGlow')} path="sky.auroraGlow" value={sky.auroraGlow} onChange={(v, k) => update((s) => void (s.sky.auroraGlow = v), k)} info={t('info.auroraGlow')} />
      <Toggle label={t('field.moon')} checked={sky.moon.enabled} onChange={(v) => update((s) => void (s.sky.moon.enabled = v))} />
      {sky.moon.enabled && (
        <>
          <SliderRow label={t('field.moonAzimuth')} path="sky.moon.azimuth" value={sky.moon.azimuth} onChange={(v, k) => update((s) => void (s.sky.moon.azimuth = v), k)} />
          <SliderRow label={t('field.moonElevation')} path="sky.moon.elevation" value={sky.moon.elevation} onChange={(v, k) => update((s) => void (s.sky.moon.elevation = v), k)} />
          <SliderRow label={t('field.moonBrightness')} path="sky.moon.brightness" value={sky.moon.brightness} onChange={(v, k) => update((s) => void (s.sky.moon.brightness = v), k)} />
        </>
      )}
    </Section>
  )
}
