import { useEffect, useMemo, useState } from 'react'
import { useT } from '../i18n/useT'
import { filterPresets, PRESETS } from '../presets/presets'
import { getThumbnail } from '../presets/thumbnails'
import { decodeScene } from '../scene/codec'
import { defaultScene } from '../scene/defaults'
import { AURORA_TYPES, type AuroraType, type Scene } from '../scene/types'
import { getStorage, listSaved, onSavedChange, removeSaved, type SavedScene } from '../state/saved'
import { studio, useStudio } from '../state/store'
import { CloseIcon } from './icons'

function Thumb({ scene }: { scene: Scene }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    getThumbnail(scene).then(
      (u) => live && setUrl(u),
      () => {},
    )
    return () => {
      live = false
    }
  }, [scene])
  return <span className="card-thumb">{url && <img src={url} alt="" />}</span>
}

function PresetList() {
  const t = useT()
  const lang = useStudio((s) => s.lang)
  const presetId = useStudio((s) => s.presetId)
  const [query, setQuery] = useState('')
  const [type, setType] = useState<AuroraType | undefined>()
  const list = filterPresets(PRESETS, { query, type, lang })
  const frame = useStudio((s) => s.scene.frame)
  const scenes = useMemo(() => new Map(PRESETS.map((p) => [p.id, { ...p.scene, frame: { aspectW: 16, aspectH: 9 } }])), [])

  return (
    <>
      <input className="search" type="search" placeholder={t('library.search')} aria-label={t('library.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="chips" role="group" aria-label={t('field.type')}>
        <button type="button" aria-pressed={!type} onClick={() => setType(undefined)}>
          {t('library.all')}
        </button>
        {AURORA_TYPES.map((id) => (
          <button key={id} type="button" aria-pressed={type === id} onClick={() => setType(id)}>
            {t(`type.${id}`)}
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="empty">{t('library.noResults')}</p>}
      <div className="cards" data-frame={`${frame.aspectW}:${frame.aspectH}`}>
        {list.map((p) => (
          <button key={p.id} type="button" className="card" aria-pressed={presetId === p.id} aria-label={p.name[lang]} onClick={() => studio.getState().applyPreset(p)}>
            <Thumb scene={scenes.get(p.id)!} />
            <span className="card-name" aria-hidden="true">
              {p.name[lang]}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}

function SavedList() {
  const t = useT()
  const [list, setList] = useState(() => listSaved(getStorage()))
  useEffect(() => onSavedChange(() => setList(listSaved(getStorage()))), [])
  if (list === 'unavailable') return <p className="empty">{t('storage.unavailable')}</p>
  if (list.length === 0) return <p className="empty">{t('library.empty')}</p>
  const sceneOf = (e: SavedScene) => decodeScene(e.data) ?? defaultScene()
  return (
    <div className="cards">
      {list.map((e) => (
        <div key={e.id} className="card saved">
          <button type="button" className="card-open" aria-label={e.name} onClick={() => {
              studio.getState().loadScene(sceneOf(e))
              studio.setState({ presetId: null })
            }}>
            <Thumb scene={{ ...sceneOf(e), frame: { aspectW: 16, aspectH: 9 } }} />
            <span className="card-name" aria-hidden="true">
              {e.name}
            </span>
          </button>
          <button type="button" className="card-delete" aria-label={`${t('library.delete')} ${e.name}`} onClick={() => setList(removeSaved(getStorage(), e.id))}>
            <CloseIcon width={12} height={12} />
          </button>
        </div>
      ))}
    </div>
  )
}

export function LibraryPanel() {
  const t = useT()
  const [tab, setTab] = useState<'presets' | 'saved'>('presets')
  return (
    <div className="library">
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'presets'} onClick={() => setTab('presets')}>
          {t('library.presets')}
        </button>
        <button type="button" role="tab" aria-selected={tab === 'saved'} onClick={() => setTab('saved')}>
          {t('library.saved')}
        </button>
      </div>
      <div className="library-body" role="tabpanel">
        {tab === 'presets' ? <PresetList /> : <SavedList />}
      </div>
    </div>
  )
}
