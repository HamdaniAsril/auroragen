import { useStudio } from '../state/store'
import { t, type StringKey } from './strings'

export function useT(): (key: StringKey, vars?: Record<string, string | number>) => string {
  const lang = useStudio((s) => s.lang)
  return (key, vars) => t(lang, key, vars)
}
