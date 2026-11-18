import { useT } from '../../i18n/useT'
import { MAX_LAYERS } from '../../scene/types'
import { studio, useStudio } from '../../state/store'
import { Section } from '../controls/Section'
import { CloseIcon, PlusIcon } from '../icons'
import { LayerEditor } from './LayerEditor'

export function AuroraSection() {
  const t = useT()
  const count = useStudio((s) => s.scene.layers.length)
  const active = useStudio((s) => s.activeLayer)
  const st = studio.getState()
  const full = count >= MAX_LAYERS

  return (
    <Section title={t('section.aurora')}>
      <div className="layer-tabs">
        <div role="tablist" aria-label={t('section.aurora')} className="layer-tablist">
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="layer-tab" data-active={i === active || undefined}>
              <button type="button" role="tab" aria-selected={i === active} onClick={() => st.setActiveLayer(i)}>
                {t('layer.label', { n: i + 1 })}
              </button>
              {count > 1 && (
                <button type="button" className="tab-remove" aria-label={`${t('layer.remove')} ${i + 1}`} onClick={() => st.removeLayer(i)}>
                  <CloseIcon width={12} height={12} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" className="icon-btn" aria-label={t('layer.add')} title={full ? t('layer.max') : t('layer.add')} disabled={full} onClick={() => st.addLayer()}>
          <PlusIcon />
        </button>
      </div>
      <LayerEditor index={active} />
    </Section>
  )
}
