import { useT } from '../i18n/useT'

/** Shown when the clipboard is unavailable, so the link can be copied by hand. */
export function ShareDialog({ url, onClose }: { url: string; onClose(): void }) {
  const t = useT()
  return (
    <div className="overlay" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <h2 id="share-title">{t('top.share')}</h2>
        <label className="field">
          <span>{t('share.manual')}</span>
          <input readOnly value={url} autoFocus onFocus={(e) => e.currentTarget.select()} />
        </label>
        <div className="dialog-actions">
          <button type="button" className="btn primary" onClick={onClose}>
            {t('export.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
