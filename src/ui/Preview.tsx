import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useT } from '../i18n/useT'
import { dragCamera, pinchLens, wheelLens } from '../render/camera'
import { PreviewLoop } from '../render/PreviewLoop'
import { Renderer } from '../render/Renderer'
import { studio, useStudio } from '../state/store'
import { setPreviewLoop } from './previewBus'

interface Props {
  /** Injectable for tests; the real app builds a WebGL renderer on the canvas. */
  renderer?: Pick<Renderer, 'render' | 'onRestored'>
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

export function Preview({ renderer }: Props) {
  const t = useT()
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const loopRef = useRef<PreviewLoop | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; lens: number } | null>(null)
  const gesture = useRef(0)
  const type = useStudio((s) => s.scene.layers[0].type)
  const aspectW = useStudio((s) => s.scene.frame.aspectW)
  const aspectH = useStudio((s) => s.scene.frame.aspectH)
  const auroraOnly = useStudio((s) => s.scene.frame.auroraOnly)
  const zoom = useStudio((s) => s.zoom)
  const exportSize = useStudio((s) => s.exportSize)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [hint, setHint] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let owned: Renderer | undefined
    let r = renderer
    if (!r) {
      owned = new Renderer(canvas)
      r = owned
    }
    const loop = new PreviewLoop(r, () => studio.getState().scene)
    loopRef.current = loop
    setPreviewLoop(loop)
    loop.setPlaying(studio.getState().playing)
    loop.setSpeed(studio.getState().speed)
    const offRestored = r.onRestored(() => loop.invalidate())
    const unsubscribe = studio.subscribe((s, prev) => {
      if (s.playing !== prev.playing) loop.setPlaying(s.playing)
      if (s.speed !== prev.speed) loop.setSpeed(s.speed)
      if (s.scene !== prev.scene) {
        if (s.scene.time !== prev.scene.time && Math.abs(s.scene.time - loop.liveTime) > 1e-3) loop.seek(s.scene.time)
        else loop.invalidate()
      }
    })
    loop.start()
    return () => {
      unsubscribe()
      offRestored()
      loop.stop()
      setPreviewLoop(null)
      loopRef.current = null
      owned?.dispose()
    }
  }, [renderer])

  // Letterbox the canvas to the frame aspect inside the available space.
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => {
      const rect = el.getBoundingClientRect()
      const a = aspectW / aspectH
      let w = rect.width
      let h = w / a
      if (h > rect.height) {
        h = rect.height
        w = h * a
      }
      setBox({ w: Math.floor(w), h: Math.floor(h) })
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [aspectW, aspectH])

  useEffect(() => {
    if (!loopRef.current || !box.w || !box.h) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    loopRef.current.setView(box.w * dpr, box.h * dpr, zoom === '100' ? { width: exportSize.w, height: exportSize.h } : undefined)
  }, [box, zoom, exportSize])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      studio.getState().update((s) => {
        s.camera.lens = wheelLens(s.camera.lens, e.deltaY)
      }, 'camera.lens')
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [])

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    if (pointers.current.size === 0) gesture.current++
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    setHint(false)
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = { dist: dist(a, b), lens: studio.getState().scene.camera.lens }
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const last = pointers.current.get(e.pointerId)
    if (!last) return
    const now = { x: e.clientX, y: e.clientY }
    pointers.current.set(e.pointerId, now)
    const st = studio.getState()
    if (pointers.current.size === 1) {
      const rect = e.currentTarget.getBoundingClientRect()
      const dx = now.x - last.x
      const dy = now.y - last.y
      // At 100% the view is a 1:1 crop of the export frame, so measure against that frame.
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const full = st.zoom === '100'
      st.update((s) => {
        s.camera = full
          ? dragCamera(s.camera, dx * dpr, dy * dpr, st.exportSize.w, st.exportSize.h)
          : dragCamera(s.camera, dx, dy, rect.width, rect.height)
      }, `camera.drag#${gesture.current}`)
    } else if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()]
      const lens = pinchLens(pinch.current.lens, pinch.current.dist, dist(a, b))
      st.update((s) => {
        s.camera.lens = lens
      }, `camera.pinch#${gesture.current}`)
    }
  }

  const onPointerEnd = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
  }

  return (
    <div className="preview" ref={wrapRef}>
      <div className="frame" style={{ width: box.w, height: box.h }}>
        <canvas
          ref={canvasRef}
          className={auroraOnly ? 'cutout' : undefined}
          role="img"
          aria-label={t('preview.label', { type: t(`type.${type}`) })}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        />
        {hint && <div className="hint">{t('hint.drag')}</div>}
      </div>
    </div>
  )
}
