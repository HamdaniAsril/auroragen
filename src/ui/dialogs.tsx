import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { t as translate } from '../i18n/strings'
import { PRESETS } from '../presets/presets'
import { studio, useStudio } from '../state/store'
import { writeSceneToHash } from '../state/urlSync'
import { ExportDialog } from './ExportDialog'
import { SaveDialog } from './SaveDialog'
import { ShareDialog } from './ShareDialog'
import { toast } from './Toast'

type Open = { kind: 'none' } | { kind: 'export' } | { kind: 'save' } | { kind: 'share'; url: string }

const dialogs = createStore<{ open: Open }>(() => ({ open: { kind: 'none' } }))
const close = () => dialogs.setState({ open: { kind: 'none' } })

export const openExport = () => dialogs.setState({ open: { kind: 'export' } })
export const openSave = () => dialogs.setState({ open: { kind: 'save' } })

/** Puts the scene in the URL and copies it; shows the link to copy by hand if the clipboard is blocked. */
export async function share(): Promise<void> {
  const st = studio.getState()
  writeSceneToHash(st.scene, { immediate: true })
  try {
    await navigator.clipboard.writeText(location.href)
    toast(translate(st.lang, 'share.copied'))
  } catch {
    dialogs.setState({ open: { kind: 'share', url: location.href } })
  }
}

/** Renders whichever dialog is open; mounted once by the app. */
export function Dialogs() {
  const open = useStore(dialogs, (s) => s.open)
  const presetName = useStudio((s) => PRESETS.find((p) => p.id === s.presetId)?.name[s.lang])
  const appName = useStudio((s) => translate(s.lang, 'app.name'))
  return (
    <>
      <ExportDialog open={open.kind === 'export'} onClose={close} />
      {open.kind === 'save' && <SaveDialog open onClose={close} defaultName={presetName ?? appName} />}
      {open.kind === 'share' && <ShareDialog url={open.url} onClose={close} />}
    </>
  )
}
