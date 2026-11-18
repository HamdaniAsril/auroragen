import { detectLang, t } from '../i18n/strings'

export function Unsupported() {
  const lang = detectLang(typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language]))
  return (
    <div className="unsupported">
      <h1>Auroragen</h1>
      <p>{t(lang, 'webgl.unsupported')}</p>
    </div>
  )
}
