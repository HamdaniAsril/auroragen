import { useT } from '../i18n/useT'
import { defaultScene } from '../scene/defaults'
import { studio } from '../state/store'
import { AuroraSection } from './sections/AuroraSection'
import { CameraSection } from './sections/CameraSection'
import { EffectsSection } from './sections/EffectsSection'
import { FrameSection } from './sections/FrameSection'
import { LandSection } from './sections/LandSection'
import { SkySection } from './sections/SkySection'

export function Inspector() {
  const t = useT()
  return (
    <div className="inspector">
      <FrameSection />
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
