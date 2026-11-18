import type { ReactNode } from 'react'

export interface PickOption<T extends string> {
  id: T
  label: string
  thumb: ReactNode
}

export function VisualPicker<T extends string>({ label, options, value, onChange }: { label: string; options: PickOption<T>[]; value: T; onChange(id: T): void }) {
  return (
    <div className="picker" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={o.id === value} className="pick" onClick={() => onChange(o.id)}>
          <span className="pick-thumb" aria-hidden="true">
            {o.thumb}
          </span>
          <span className="pick-label">{o.label}</span>
        </button>
      ))}
    </div>
  )
}
