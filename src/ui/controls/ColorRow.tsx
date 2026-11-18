import { useEffect, useState } from 'react'
import { useT } from '../../i18n/useT'

const HEX = /^#[0-9a-fA-F]{6}$/

export function ColorRow({ label, value, onChange }: { label: string; value: string; onChange(hex: string): void }) {
  const t = useT()
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  return (
    <div className="row color-row">
      <span className="row-label">{label}</span>
      <input
        className="hex"
        aria-label={label}
        value={text}
        spellCheck={false}
        maxLength={7}
        onChange={(e) => {
          const v = e.target.value.trim()
          setText(v)
          const hex = v.startsWith('#') ? v : `#${v}`
          if (HEX.test(hex)) onChange(hex.toUpperCase())
        }}
        onBlur={() => setText(value)}
      />
      <input className="swatch" type="color" aria-label={t('field.colorPicker', { label })} value={value.toLowerCase()} onChange={(e) => onChange(e.target.value.toUpperCase())} />
    </div>
  )
}
