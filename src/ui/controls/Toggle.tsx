import { InfoTip } from './InfoTip'

export function Toggle({ label, checked, onChange, info }: { label: string; checked: boolean; onChange(v: boolean): void; info?: string }) {
  return (
    <div className="row toggle-row">
      <span className="row-label">
        {label}
        {info && <InfoTip text={info} />}
      </span>
      <input type="checkbox" role="switch" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </div>
  )
}
