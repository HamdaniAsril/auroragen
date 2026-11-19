import { useT } from '../../i18n/useT'
import { studio, useStudio } from '../../state/store'
import { Section } from '../controls/Section'

/** Whole scene, or only the aurora on a transparent background. Changes what the preview draws. */
export function BackgroundSection() {
  const t = useT()
  const auroraOnly = useStudio((s) => s.scene.frame.auroraOnly)
  const choose = (only: boolean) =>
    studio.getState().update((s) => {
      s.frame.auroraOnly = only
    }, 'frame.auroraOnly')
  return (
    <Section title={t('section.background')}>
      <div className="seg backgrounds" role="group" aria-label={t('section.background')}>
        {([false, true] as const).map((only) => (
          <button key={String(only)} type="button" aria-pressed={auroraOnly === only} onClick={() => choose(only)}>
            {t(only ? 'background.auroraOnly' : 'background.scene')}
          </button>
        ))}
      </div>
      <p className="field-note">{t(auroraOnly ? 'background.auroraOnlyHint' : 'background.sceneHint')}</p>
    </Section>
  )
}
