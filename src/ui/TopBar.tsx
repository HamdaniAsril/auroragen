import { useEffect } from 'react'
import { useT } from '../i18n/useT'
import { PRESETS } from '../presets/presets'
import { studio, useStudio } from '../state/store'
import { openExport, openSave, share } from './dialogs'
import { DiceIcon, RedoIcon, UndoIcon } from './icons'

export function TopBar({ compact = false }: { compact?: boolean }) {
  const t = useT()
  const canUndo = useStudio((s) => s.history.past.length > 0)
  const canRedo = useStudio((s) => s.history.future.length > 0)
  const dirty = useStudio((s) => s.dirty)
  const lang = useStudio((s) => s.lang)
  const zoom = useStudio((s) => s.zoom)
  const presetName = useStudio((s) => PRESETS.find((p) => p.id === s.presetId)?.name[s.lang])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return
      const el = e.target as HTMLElement | null
      if (el?.closest?.('input:not([type=range]):not([type=checkbox]), textarea')) return
      e.preventDefault()
      if (e.shiftKey) studio.getState().redo()
      else studio.getState().undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const st = studio.getState()
  const toggleLang = () => st.setLang(lang === 'id' ? 'en' : 'id')

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-name">{t('app.name')}</span>
        {!compact && presetName && <span className="preset-name">{presetName}</span>}
        {dirty && <span className="dirty" role="img" aria-label={t('top.unsaved')} title={t('top.unsaved')} />}
      </div>
      <div className="tool-group">
        <button type="button" className="icon-btn" onClick={() => st.undo()} disabled={!canUndo} aria-label={t('top.undo')} title={t('top.undo')}>
          <UndoIcon />
        </button>
        <button type="button" className="icon-btn" onClick={() => st.redo()} disabled={!canRedo} aria-label={t('top.redo')} title={t('top.redo')}>
          <RedoIcon />
        </button>
      </div>
      {compact ? (
        <button type="button" className="icon-btn" onClick={() => st.randomizeAll()} aria-label={t('top.randomize')} title={t('top.randomize')}>
          <DiceIcon />
        </button>
      ) : (
        <button type="button" className="btn" onClick={() => st.randomizeAll()}>
          <DiceIcon /> {t('top.randomize')}
        </button>
      )}
      {!compact && (
        <div className="seg" role="group" aria-label="Zoom">
          <button type="button" aria-pressed={zoom === 'fit'} onClick={() => st.setZoom('fit')}>
            {t('top.zoomFit')}
          </button>
          <button type="button" aria-pressed={zoom === '100'} onClick={() => st.setZoom('100')}>
            {t('top.zoom100')}
          </button>
        </div>
      )}
      <div className="spacer" />
      <button type="button" className="btn ghost" onClick={toggleLang} aria-label={t('top.lang')}>
        {compact ? (lang === 'id' ? 'EN' : 'ID') : t('top.lang')}
      </button>
      {!compact && (
        <>
          <button type="button" className="btn" onClick={() => void share()}>
            {t('top.share')}
          </button>
          <button type="button" className="btn" onClick={openSave}>
            {t('top.save')}
          </button>
          <button type="button" className="btn primary" onClick={openExport}>
            {t('top.export')}
          </button>
        </>
      )}
    </header>
  )
}
