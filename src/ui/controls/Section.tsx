import { useId, useState, type ReactNode } from 'react'
import { useT } from '../../i18n/useT'
import { ChevronIcon } from '../icons'

export function Advanced({ children }: { children: ReactNode }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <>
      <button type="button" className="more" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        {t('section.advanced')} <ChevronIcon className="chev" />
      </button>
      {open && (
        <div id={id} className="advanced">
          {children}
        </div>
      )}
    </>
  )
}

export function Section({ title, defaultOpen = true, advanced, children }: { title: string; defaultOpen?: boolean; advanced?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <section className="section">
      <h2 className="section-title">
        <button type="button" className="section-head" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
          {title}
          <ChevronIcon className="chev" />
        </button>
      </h2>
      {open && (
        <div id={id} className="section-body">
          {children}
          {advanced && <Advanced>{advanced}</Advanced>}
        </div>
      )}
    </section>
  )
}
