import { expect, test } from 'vitest'
import { detectLang, STRINGS, t } from './strings'

test('both languages have the same keys', () => expect(Object.keys(STRINGS.en).sort()).toEqual(Object.keys(STRINGS.id).sort()))

test('no empty strings', () => {
  for (const l of ['id', 'en'] as const) for (const v of Object.values(STRINGS[l])) expect(v.trim()).not.toBe('')
})

test('detects language', () => {
  expect(detectLang(['id-ID', 'en'])).toBe('id')
  expect(detectLang(['en-US'])).toBe('en')
  expect(detectLang([])).toBe('en')
})

test('interpolates', () => expect(t('en', 'export.progress', { pct: 40 })).toContain('40'))

test('pinned copy', () => {
  expect(t('id', 'hint.drag')).toBe('Seret untuk memutar kamera')
  expect(t('en', 'link.invalid')).toBe("That link didn't work, opening the default scene")
  expect(t('id', 'export.tooLarge')).toBe('Terlalu besar untuk perangkat ini, coba di komputer')
})
