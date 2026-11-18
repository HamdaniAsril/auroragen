import { useEffect, useRef, useState } from 'react'
import { exportImage, type ExportOptions } from '../export/exportImage'
import { cssSnippet, exportFilename } from '../export/naming'
import { useT } from '../i18n/useT'
import { studio, useStudio } from '../state/store'
import { getPreviewLoop } from './previewBus'
import { toast } from './Toast'

export type Exporter = (o: ExportOptions) => Promise<Blob>

type Phase = { kind: 'idle' } | { kind: 'running'; progress: number } | { kind: 'done'; url: string; file: string } | { kind: 'failed' }

function download(url: string, file: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = file
  a.click()
}

export function ExportDialog({ open, onClose, exporter = exportImage }: { open: boolean; onClose(): void; exporter?: Exporter }) {
  const t = useT()
  const size = useStudio((s) => s.exportSize)
  const format = useStudio((s) => s.format)
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const abort = useRef<AbortController | null>(null)
  const startRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) startRef.current?.focus()
  }, [open])

  useEffect(() => () => abort.current?.abort(), [])

  if (!open) return null

  const close = () => {
    abort.current?.abort()
    if (phase.kind === 'done') URL.revokeObjectURL(phase.url)
    setPhase({ kind: 'idle' })
    onClose()
  }

  const start = async () => {
    const st = studio.getState()
    // Export exactly the frame the preview shows right now.
    const time = getPreviewLoop()?.liveTime ?? st.scene.time
    const file = exportFilename(st.scene, st.exportSize.w, st.exportSize.h, st.format)
    const ac = new AbortController()
    abort.current = ac
    setPhase({ kind: 'running', progress: 0 })
    try {
      const blob = await exporter({
        scene: st.scene,
        time,
        width: st.exportSize.w,
        height: st.exportSize.h,
        format: st.format,
        quality: st.quality,
        signal: ac.signal,
        onProgress: (p) => setPhase({ kind: 'running', progress: p }),
      })
      const url = URL.createObjectURL(blob)
      setPhase({ kind: 'done', url, file })
      download(url, file)
    } catch (e) {
      setPhase((e as Error).name === 'AbortError' ? { kind: 'idle' } : { kind: 'failed' })
    } finally {
      abort.current = null
    }
  }

  const cancel = () => abort.current?.abort()

  const copyCss = async (file: string) => {
    try {
      await navigator.clipboard.writeText(cssSnippet(file))
      toast(t('export.copied'))
    } catch {
      toast(cssSnippet(file))
    }
  }

  return (
    <div className="overlay" onKeyDown={(e) => e.key === 'Escape' && phase.kind !== 'running' && close()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="export-title">
        <h2 id="export-title">{t('export.title')}</h2>
        <p className="dialog-meta">
          {size.w} × {size.h} · {format.toUpperCase()}
        </p>
        {phase.kind === 'running' && (
          <div className="progress">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(phase.progress * 100)}
              aria-label={t('export.progress', { pct: Math.round(phase.progress * 100) })}
              className="progress-track"
            >
              <div className="progress-fill" style={{ width: `${phase.progress * 100}%` }} />
            </div>
            <span>{t('export.progress', { pct: Math.round(phase.progress * 100) })}</span>
          </div>
        )}
        {phase.kind === 'done' && <p>{t('export.done', { file: phase.file })}</p>}
        {phase.kind === 'failed' && <p className="error">{t('export.failed')}</p>}
        <div className="dialog-actions">
          {phase.kind === 'running' ? (
            <button type="button" className="btn" onClick={cancel}>
              {t('export.cancel')}
            </button>
          ) : (
            <>
              {phase.kind === 'done' && (
                <>
                  <button type="button" className="btn" onClick={() => copyCss(phase.file)}>
                    {t('export.copyCss')}
                  </button>
                  <button type="button" className="btn" onClick={() => download(phase.url, phase.file)}>
                    {t('export.download')}
                  </button>
                </>
              )}
              <button type="button" className="btn ghost" onClick={close}>
                {t('export.close')}
              </button>
              {phase.kind !== 'done' && (
                <button ref={startRef} type="button" className="btn primary" onClick={start}>
                  {t('export.start')}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
