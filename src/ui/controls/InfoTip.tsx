export function InfoTip({ text }: { text: string }) {
  return (
    <span className="info-wrap">
      <button type="button" className="info" aria-label={text}>
        i
      </button>
      <span role="tooltip" className="tip">
        {text}
      </span>
    </span>
  )
}
