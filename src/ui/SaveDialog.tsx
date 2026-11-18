import { useState } from 'react'
import { useT } from '../i18n/useT'
import { addSaved, getStorage } from '../state/saved'
import { studio } from '../state/store'
import { toast } from './Toast'

export function SaveDialog({ open, onClose, defaultName }: { open: boolean; onClose(): void; defaultName: string }) {
  const t = useT()
  const [name, setName] = useState(defaultName)
  if (!open) return null
  const save = () => {
    const result = addSaved(getStorage(), name, studio.getState().scene)
    toast(result === 'unavailable' ? t('storage.unavailable') : t('save.done'))
    onClose()
  }
  return (
    <div className="overlay" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <form
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-title"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <h2 id="save-title">{t('top.save')}</h2>
        <label className="field">
          <span>{t('save.prompt')}</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        </label>
        <div className="dialog-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            {t('export.cancel')}
          </button>
          <button type="submit" className="btn primary">
            {t('top.save')}
          </button>
        </div>
      </form>
    </div>
  )
}
