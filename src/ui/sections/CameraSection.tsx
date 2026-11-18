import { useT } from '../../i18n/useT'
import { studio, useStudio } from '../../state/store'
import { Section } from '../controls/Section'
import { SliderRow } from '../controls/SliderRow'

export function CameraSection() {
  const t = useT()
  const cam = useStudio((s) => s.scene.camera)
  const update = studio.getState().update
  return (
    <Section title={t('section.camera')}>
      <SliderRow label={t('field.pitch')} path="camera.pitch" value={cam.pitch} onChange={(v, k) => update((s) => void (s.camera.pitch = v), k)} />
      <SliderRow label={t('field.yaw')} path="camera.yaw" value={cam.yaw} onChange={(v, k) => update((s) => void (s.camera.yaw = v), k)} />
      <SliderRow label={t('field.lens')} path="camera.lens" value={cam.lens} onChange={(v, k) => update((s) => void (s.camera.lens = v), k)} info={t('info.lens')} />
    </Section>
  )
}
