import { useEffect, useState } from 'react'
import { detectLang, t } from './i18n/strings'
import { PRESETS } from './presets/presets'
import { studio, useStudio } from './state/store'
import { exportSizeForFrame, readSceneFromHash, writeSceneToHash } from './state/urlSync'
import { Dialogs } from './ui/dialogs'
import { StudioErrorBoundary } from './ui/ErrorBoundary'
import { Inspector } from './ui/Inspector'
import { LibraryPanel } from './ui/LibraryPanel'
import { MobileSheet } from './ui/MobileSheet'
import { PlayBar } from './ui/PlayBar'
import { Preview } from './ui/Preview'
import { toast, Toaster } from './ui/Toast'
import { TopBar } from './ui/TopBar'
import { Unsupported } from './ui/Unsupported'

const hasWebGL2 = () => {
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
}

if (import.meta.env.DEV) Object.assign(window, { __studio: studio })

const PHONE = '(max-width: 767px)'

function useIsPhone(): boolean {
  const [phone, setPhone] = useState(() => window.matchMedia?.(PHONE).matches ?? false)
  useEffect(() => {
    const mq = window.matchMedia?.(PHONE)
    if (!mq) return
    const on = () => setPhone(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return phone
}

export default function App() {
  const [supported] = useState(hasWebGL2)
  const lang = useStudio((s) => s.lang)
  const phone = useIsPhone()

  useEffect(() => {
    const st = studio.getState()
    const lang = detectLang(navigator.languages ?? [navigator.language])
    st.setLang(lang)
    const fromLink = readSceneFromHash(location.hash)
    if (fromLink && 'scene' in fromLink) {
      st.loadScene(fromLink.scene)
      st.setExport({ exportSize: exportSizeForFrame(fromLink.scene.frame) })
      // Open paused on the shared moment; the visitor can press play.
      studio.setState({ history: { past: [], future: [] }, dirty: false, presetId: null, playing: false })
    } else {
      if (fromLink) toast(t(lang, 'link.invalid'))
      // The opening scene is the first preset.
      studio.setState({ presetId: PRESETS[0].id })
    }
    // Keep the URL in step with the scene, so a reload or a copied address restores it.
    return studio.subscribe((s, prev) => {
      if (s.scene !== prev.scene) writeSceneToHash(s.scene)
    })
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  if (!supported) return <Unsupported />

  if (phone)
    return (
      <StudioErrorBoundary>
      <div className="studio phone">
        <TopBar compact />
        <main className="stage">
          <Preview />
          <PlayBar />
        </main>
        <MobileSheet />
        <Dialogs />
        <Toaster />
      </div>
      </StudioErrorBoundary>
    )

  return (
    <StudioErrorBoundary>
    <div className="studio">
      <TopBar />
      <aside className="panel left">
        <LibraryPanel />
      </aside>
      <main className="stage">
        <Preview />
        <PlayBar />
      </main>
      <aside className="panel right">
        <Inspector />
      </aside>
      <Dialogs />
      <Toaster />
    </div>
    </StudioErrorBoundary>
  )
}
