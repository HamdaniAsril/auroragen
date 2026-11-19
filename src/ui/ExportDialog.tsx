import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { StringKey } from '../i18n/strings'
import { exportImage, type ExportOptions } from '../export/exportImage'
import { cssSnippet, exportFilename } from '../export/naming'
import { useT } from '../i18n/useT'
import { getThumbnail } from '../presets/thumbnails'
import type { Scene } from '../scene/types'
import { studio, useStudio, type ExportFormat } from '../state/store'
import { SliderRow } from './controls/SliderRow'
import { getPreviewLoop } from './previewBus'
import { toast } from './Toast'

export type Exporter = (o: ExportOptions) => Promise<Blob>
export type Thumbnailer = (scene: Scene, size: { w: number; h: number }, opts: { urgent?: boolean }) => Promise<string>

const FORMATS: { id: ExportFormat; label: string }[] = [
  { id: 'png', label: 'PNG' },
  { id: 'jpg', label: 'JPG' },
  { id: 'webp', label: 'WebP' },
]

/** The picture fills the card's width, but tall frames stop at this height (CSS px). */
const PICTURE_MAX_H = 280

/** Pixels to render: enough for the card's width on a 2× screen, in the frame's aspect. */
function picturePixels(w: number, h: number) {
  const s = Math.min(760 / w, (PICTURE_MAX_H * 2) / h)
  return { w: Math.max(16, Math.round(w * s)), h: Math.max(16, Math.round(h * s)) }
}

/** A picture of what will be saved: the scene as shown in the preview right now. */
function SavedPicture({ thumbnail }: { thumbnail: Thumbnailer }) {
  const t = useT()
  const scene = useStudio((s) => s.scene)
  const size = useStudio((s) => s.exportSize)
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    const time = getPreviewLoop()?.liveTime ?? scene.time
    thumbnail({ ...scene, time }, picturePixels(size.w, size.h), { urgent: true }).then(
      (url) => live && setSrc(url),
      () => undefined,
    )
    return () => {
      live = false
    }
    // Taken once when the dialog opens; the scene can't change while it is up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div
      className={scene.frame.auroraOnly ? 'export-thumb cutout' : 'export-thumb'}
      style={{ '--picture-w': `${Math.round((PICTURE_MAX_H * size.w) / size.h)}px`, aspectRatio: `${size.w} / ${size.h}` } as CSSProperties}
    >
      {src && <img src={src} alt={t('export.preview')} className={scene.frame.auroraOnly ? 'cutout' : undefined} />}
    </div>
  )
}

type Phase = { kind: 'idle' } | { kind: 'running'; progress: number } | { kind: 'done'; url: string; file: string } | { kind: 'failed' }

function download(url: string, file: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = file
  a.click()
}

export function ExportDialog({
  open,
  onClose,
  exporter = exportImage,
  thumbnail = getThumbnail,
}: {
  open: boolean
  onClose(): void
  exporter?: Exporter
  thumbnail?: Thumbnailer
}) {
  const t = useT()
  const size = useStudio((s) => s.exportSize)
  const format = useStudio((s) => s.format)
  const quality = useStudio((s) => s.quality)
  const auroraOnly = useStudio((s) => s.scene.frame.auroraOnly)
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
        <SavedPicture thumbnail={thumbnail} />
        <p className="dialog-meta">
          {size.w} × {size.h} · {t(auroraOnly ? 'background.auroraOnly' : 'background.scene')}
        </p>
        <fieldset className="formats-list" disabled={phase.kind === 'running'}>
          <legend>{t('field.format')}</legend>
          {FORMATS.map((f) => {
            const off = auroraOnly && f.id === 'jpg'
            const note: StringKey = off ? 'export.format.jpgOff' : `export.format.${f.id}`
            return (
              <label key={f.id} className="format-option" data-off={off ? '' : undefined}>
                <input
                  type="radio"
                  name="export-format"
                  value={f.id}
                  checked={format === f.id}
                  disabled={off}
                  onChange={() => studio.getState().setExport({ format: f.id })}
                />
                <span className="format-name">{f.label}</span>
                <span className="format-note">{t(note)}</span>
              </label>
            )
          })}
          {format !== 'png' && (
            <SliderRow label={t('field.quality')} path="export.quality" value={quality} onChange={(v) => studio.getState().setExport({ quality: v })} />
          )}
        </fieldset>
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
