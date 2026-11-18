import { useEffect, useState } from 'react'
import { useT } from '../i18n/useT'
import { studio, useStudio } from '../state/store'
import { PauseIcon, PlayIcon } from './icons'
import { getPreviewLoop } from './previewBus'

const SPEEDS = [0.25, 0.5, 1, 2, 4]

const fmt = (t: number) => {
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

const defaultLiveTime = () => getPreviewLoop()?.liveTime ?? studio.getState().scene.time

export function PlayBar({ getLiveTime = defaultLiveTime }: { getLiveTime?: () => number }) {
  const t = useT()
  const playing = useStudio((s) => s.playing)
  const speed = useStudio((s) => s.speed)
  const sceneTime = useStudio((s) => s.scene.time)
  const [shown, setShown] = useState(sceneTime)

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) studio.getState().setPlaying(false)
  }, [])

  useEffect(() => {
    if (!playing) {
      setShown(sceneTime)
      return
    }
    const id = setInterval(() => setShown(getLiveTime()), 250)
    return () => clearInterval(id)
  }, [playing, sceneTime, getLiveTime])

  const toggle = () => {
    const st = studio.getState()
    if (st.playing) {
      st.setTime(getLiveTime())
      st.setPlaying(false)
    } else {
      st.setPlaying(true)
    }
  }

  return (
    <div className="playbar">
      <button type="button" className="icon-btn" onClick={toggle} aria-label={playing ? t('play.pause') : t('play.play')}>
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <input
        className="time-slider"
        type="range"
        min={0}
        max={600}
        step={0.1}
        value={shown}
        aria-label={t('play.time')}
        onChange={(e) => {
          const v = Number(e.target.value)
          setShown(v)
          studio.getState().setTime(v)
        }}
      />
      <span className="time-readout">{fmt(shown)}</span>
      <label className="speed">
        <span className="visually-hidden">{t('play.speed')}</span>
        <select value={speed} onChange={(e) => studio.getState().setSpeed(Number(e.target.value))}>
          {SPEEDS.map((x) => (
            <option key={x} value={x}>
              {x}×
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
