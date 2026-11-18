import { useRef, useState, type CSSProperties } from 'react'
import { clampTo, RANGES, type RangePath } from '../../scene/ranges'
import { InfoTip } from './InfoTip'
import { formatValue, fromDisplay, toDisplay, unitFor } from './units'

export interface SliderRowProps {
  label: string
  path: RangePath
  value: number
  /** `key` groups a whole drag (or focus session) into one undo step. */
  onChange(value: number, key?: string): void
  info?: string
}

/** One row: label left, value right; the whole row drags. Double-click to type a value. */
export function SliderRow({ label, path, value, onChange, info }: SliderRowProps) {
  const r = RANGES[path]
  const unit = unitFor(path)
  const gesture = useRef(0)
  const editingRef = useRef(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const fill = `${((value - r.min) / (r.max - r.min)) * 100}%`

  const startEdit = () => {
    setDraft(String(toDisplay(value, unit)))
    editingRef.current = true
    setEditing(true)
  }

  const finishEdit = (commit: boolean) => {
    if (!editingRef.current) return
    editingRef.current = false
    setEditing(false)
    const n = parseFloat(draft.replace(',', '.'))
    if (commit && Number.isFinite(n)) onChange(clampTo(path, fromDisplay(n, unit)), `${path}#typed${++gesture.current}`)
  }

  return (
    <div className="row slider-row" style={{ '--fill': fill } as CSSProperties}>
      {editing ? (
        <input
          className="row-edit"
          type="number"
          aria-label={label}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') finishEdit(true)
            if (e.key === 'Escape') finishEdit(false)
          }}
          onBlur={() => finishEdit(true)}
        />
      ) : (
        <input
          className="row-range"
          type="range"
          aria-label={label}
          aria-valuetext={formatValue(value, unit)}
          min={r.min}
          max={r.max}
          step={r.step}
          value={value}
          onPointerDown={() => gesture.current++}
          onFocus={() => gesture.current++}
          onChange={(e) => onChange(Number(e.target.value), `${path}#${gesture.current}`)}
          onDoubleClick={startEdit}
        />
      )}
      <span className="row-label">
        {label}
        {info && <InfoTip text={info} />}
      </span>
      {!editing && <span className="row-value">{formatValue(value, unit)}</span>}
    </div>
  )
}
