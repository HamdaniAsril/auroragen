import { useT } from '../i18n/useT'
import { PRESETS } from '../presets/presets'
import { defaultScene } from '../scene/defaults'
import { studio } from '../state/store'
import { AuroraSection } from './sections/AuroraSection'
import { CameraSection } from './sections/CameraSection'
import { EffectsSection } from './sections/EffectsSection'
import { BackgroundSection } from './sections/BackgroundSection'
import { LandSection } from './sections/LandSection'
import { SizeSection } from './sections/SizeSection'
import { SkySection } from './sections/SkySection'

/** Back to the preset the scene came from, or to the default scene. */
function reset() {
  const st = studio.getState()
  const preset = PRESETS.find((p) => p.id === st.presetId)
  if (preset) st.applyPreset(preset)
  else st.loadScene(defaultScene(), { keepFrame: true })
}

export function Inspector() {
  const t = useT()
  return (
    <div className="inspector">
      <SizeSection />
      <BackgroundSection />
      <AuroraSection />
      <SkySection />
      <LandSection />
      <CameraSection />
      <EffectsSection />
      <div className="inspector-foot">
        <button type="button" className="btn wide" onClick={reset}>
          {t('section.reset')}
        </button>
      </div>
    </div>
  )
}
