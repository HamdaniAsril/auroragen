import { useMemo, useState } from 'react'
import { checkSize, deviceMaxPixels, reduceAspect, SIZE_PRESETS, type SizeCheck } from '../../export/sizes'
import { useT } from '../../i18n/useT'
import { studio, useStudio } from '../../state/store'
import { Section } from '../controls/Section'

export function SizeSection() {
  const t = useT()
  const lang = useStudio((s) => s.lang)
  const size = useStudio((s) => s.exportSize)
  const maxPixels = useMemo(deviceMaxPixels, [])
  const isPreset = SIZE_PRESETS.some((p) => p.w === size.w && p.h === size.h)
  const [custom, setCustom] = useState(!isPreset)
  const [draft, setDraft] = useState({ w: String(size.w), h: String(size.h) })

  const reason = (c: SizeCheck) => (c.ok ? '' : t(c.reason === 'tooLarge' ? 'export.tooLarge' : c.reason === 'tooSmall' ? 'export.tooSmall' : 'export.longSide'))

  const choose = (w: number, h: number) => {
    const st = studio.getState()
    st.setExport({ exportSize: { w, h } })
    st.update((s) => {
      s.frame = { ...s.frame, ...reduceAspect(w, h) }
    }, 'frame')
  }

  const draftW = Math.round(Number(draft.w))
  const draftH = Math.round(Number(draft.h))
  const draftCheck = Number.isFinite(draftW) && Number.isFinite(draftH) ? checkSize(draftW, draftH, maxPixels) : ({ ok: false, reason: 'tooSmall' } as const)

  return (
    <Section title={t('section.size')}>
      <div className="sizes" role="radiogroup" aria-label={t('field.size')}>
        {SIZE_PRESETS.map((p) => {
          const c = checkSize(p.w, p.h, maxPixels)
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              className="size"
              aria-checked={!custom && p.w === size.w && p.h === size.h}
              disabled={!c.ok}
              title={reason(c) || undefined}
              onClick={() => {
                setCustom(false)
                choose(p.w, p.h)
              }}
            >
              <span>{p.label[lang]}</span>
              <span className="size-dims">
                {p.w} × {p.h}
              </span>
            </button>
          )
        })}
        <button type="button" role="radio" className="size" aria-checked={custom} onClick={() => setCustom(true)}>
          <span>{t('field.custom')}</span>
        </button>
      </div>
      {custom && (
        <form
          className="custom-size"
          onSubmit={(e) => {
            e.preventDefault()
            if (draftCheck.ok) choose(draftW, draftH)
          }}
        >
          <label>
            <span>{t('field.width')}</span>
            <input type="number" inputMode="numeric" value={draft.w} onChange={(e) => setDraft({ ...draft, w: e.target.value })} />
          </label>
          <span aria-hidden="true">×</span>
          <label>
            <span>{t('field.heightPx')}</span>
            <input type="number" inputMode="numeric" value={draft.h} onChange={(e) => setDraft({ ...draft, h: e.target.value })} />
          </label>
          <button type="submit" className="btn" disabled={!draftCheck.ok}>
            {t('field.apply')}
          </button>
          {!draftCheck.ok && <p className="field-error">{reason(draftCheck)}</p>}
        </form>
      )}
    </Section>
  )
}
