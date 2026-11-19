import { useState, type ReactNode } from 'react'
import { useT } from '../i18n/useT'
import type { StringKey } from '../i18n/strings'
import { openExport, openSave, share } from './dialogs'
import { LibraryPanel } from './LibraryPanel'
import { AuroraSection } from './sections/AuroraSection'
import { CameraSection } from './sections/CameraSection'
import { EffectsSection } from './sections/EffectsSection'
import { BackgroundSection } from './sections/BackgroundSection'
import { LandSection } from './sections/LandSection'
import { SizeSection } from './sections/SizeSection'
import { SkySection } from './sections/SkySection'

type TabId = 'library' | 'aurora' | 'sky' | 'land' | 'camera' | 'effects' | 'export'

function ExportTab() {
  const t = useT()
  return (
    <>
      <SizeSection />
      <BackgroundSection />
      <div className="sheet-actions">
        <button type="button" className="btn" onClick={() => void share()}>
          {t('top.share')}
        </button>
        <button type="button" className="btn" onClick={openSave}>
          {t('top.save')}
        </button>
        <button type="button" className="btn primary" onClick={openExport}>
          {t('top.export')}
        </button>
      </div>
    </>
  )
}

const TABS: { id: TabId; label: StringKey; body: () => ReactNode }[] = [
  { id: 'library', label: 'library.presets', body: () => <LibraryPanel /> },
  { id: 'aurora', label: 'section.aurora', body: () => <AuroraSection /> },
  { id: 'sky', label: 'section.sky', body: () => <SkySection /> },
  { id: 'land', label: 'section.land', body: () => <LandSection /> },
  { id: 'camera', label: 'section.camera', body: () => <CameraSection /> },
  { id: 'effects', label: 'section.effects', body: () => <EffectsSection /> },
  { id: 'export', label: 'top.export', body: () => <ExportTab /> },
]

/** Phone layout: a tab strip under the preview that opens a bottom panel. */
export function MobileSheet() {
  const t = useT()
  const [tab, setTab] = useState<TabId | null>(null)
  const active = TABS.find((x) => x.id === tab)
  return (
    <div className="sheet" data-open={active ? '' : undefined}>
      <div className="sheet-tabs" role="tablist" aria-label={t('sheet.toggle')}>
        {TABS.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} onClick={() => setTab(tab === x.id ? null : x.id)}>
            {t(x.label)}
          </button>
        ))}
      </div>
      {active && (
        <div className="sheet-body" role="tabpanel" aria-label={t(active.label)}>
          {active.body()}
        </div>
      )}
    </div>
  )
}
