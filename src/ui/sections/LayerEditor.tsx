import { useT } from '../../i18n/useT'
import { PALETTES } from '../../scene/palettes'
import { AURORA_TYPES, type AuroraLayer, type PaletteId } from '../../scene/types'
import { studio, useStudio } from '../../state/store'
import { ColorRow } from '../controls/ColorRow'
import { Advanced } from '../controls/Section'
import { SeedRow } from '../controls/SeedRow'
import { SliderRow } from '../controls/SliderRow'
import { Toggle } from '../controls/Toggle'
import { VisualPicker } from '../controls/VisualPicker'
import { PaletteThumb, TYPE_THUMBS } from '../thumbs'

const PALETTE_KEYS = Object.keys(PALETTES) as Exclude<PaletteId, 'custom'>[]

export function LayerEditor({ index }: { index: number }) {
  const t = useT()
  const layer = useStudio((s) => s.scene.layers[index])
  if (!layer) return null
  const set = (patch: Partial<AuroraLayer>, key?: string) => studio.getState().updateLayer(index, patch, key)
  const num = (field: 'brightness' | 'distance' | 'azimuth' | 'length' | 'foldAmount' | 'foldDensity' | 'baseAltitude' | 'rayHeight' | 'rayDensity' | 'rayContrast' | 'speed', info?: string) => (
    <SliderRow label={t(`field.${field}`)} path={`layer.${field}`} value={layer[field]} onChange={(v, k) => set({ [field]: v }, k)} info={info} />
  )
  const color = (part: 'bottom' | 'body' | 'top', label: string) => (
    <ColorRow label={label} value={layer.colors[part]} onChange={(v) => set({ colors: { ...layer.colors, [part]: v }, palette: 'custom' }, `layer.colors.${part}`)} />
  )

  return (
    <div className="layer-editor">
      <VisualPicker
        label={t('field.type')}
        options={AURORA_TYPES.map((id) => ({ id, label: t(`type.${id}`), thumb: TYPE_THUMBS[id] }))}
        value={layer.type}
        onChange={(type) => set({ type })}
      />
      {layer.type === 'korona' && (
        <button
          type="button"
          className="btn wide"
          onClick={() =>
            studio.getState().update((s) => {
              s.camera.pitch = 80
              s.camera.lens = 14
            })
          }
        >
          {t('action.pointUp')}
        </button>
      )}
      <SeedRow label={t('field.auroraSeed')} path="layer.seed" value={layer.seed} onChange={(v, k) => set({ seed: v }, k)} info={t('info.auroraSeed')} />
      <VisualPicker
        label={t('field.palette')}
        options={[
          ...PALETTE_KEYS.map((id) => ({ id: id as PaletteId, label: t(`palette.${id}`), thumb: <PaletteThumb colors={Object.values(PALETTES[id])} /> })),
          { id: 'custom' as PaletteId, label: t('palette.custom'), thumb: <PaletteThumb colors={Object.values(layer.colors)} /> },
        ]}
        value={layer.palette}
        onChange={(p) => (p === 'custom' ? set({ palette: 'custom' }) : set({ palette: p, colors: { ...PALETTES[p] } }))}
      />
      {color('bottom', t('field.colorBottom'))}
      {color('body', t('field.colorBody'))}
      {color('top', t('field.colorTop'))}
      {num('brightness')}
      {num('distance', t('info.distance'))}
      {num('azimuth')}
      <Advanced>
        {num('length')}
        {num('foldAmount')}
        {num('foldDensity')}
        {num('baseAltitude')}
        {num('rayHeight')}
        {num('rayDensity')}
        {num('rayContrast')}
        {num('speed')}
        <Toggle label={t('field.fringe')} checked={layer.fringe} onChange={(fringe) => set({ fringe })} info={t('info.fringe')} />
      </Advanced>
    </div>
  )
}
