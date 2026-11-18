import { useEffect, useState } from 'react'
import { detectLang } from './i18n/strings'
import { PRESETS } from './presets/presets'
import { studio, useStudio } from './state/store'
import { Inspector } from './ui/Inspector'
import { LibraryPanel } from './ui/LibraryPanel'
import { PlayBar } from './ui/PlayBar'
import { Preview } from './ui/Preview'
import { Toaster } from './ui/Toast'
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

export default function App() {
  const [supported] = useState(hasWebGL2)
  const lang = useStudio((s) => s.lang)

  useEffect(() => {
    studio.getState().setLang(detectLang(navigator.languages ?? [navigator.language]))
    // The opening scene is the first preset.
    if (!studio.getState().dirty) studio.setState({ presetId: PRESETS[0].id })
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  if (!supported) return <Unsupported />

  return (
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
      <Toaster />
    </div>
  )
}
