import { useT } from '../i18n/useT'
import { defaultScene } from '../scene/defaults'
import { studio } from '../state/store'
import { AuroraSection } from './sections/AuroraSection'
import { CameraSection } from './sections/CameraSection'
import { EffectsSection } from './sections/EffectsSection'
import { LandSection } from './sections/LandSection'
import { SkySection } from './sections/SkySection'

export function Inspector() {
  const t = useT()
  return (
    <div className="inspector">
      <AuroraSection />
      <SkySection />
      <LandSection />
      <CameraSection />
      <EffectsSection />
      <div className="inspector-foot">
        <button type="button" className="btn wide" onClick={() => studio.getState().loadScene(defaultScene(), { keepFrame: true })}>
          {t('section.reset')}
        </button>
      </div>
    </div>
  )
}
