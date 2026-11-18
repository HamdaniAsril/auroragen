import { expect, test } from 'vitest'
import { decodeScene } from '../scene/codec'
import { defaultScene } from '../scene/defaults'
import { addSaved, listSaved, removeSaved } from './saved'

class MemoryStorage implements Storage {
  private m = new Map<string, string>()
  get length() {
    return this.m.size
  }
  clear() {
    this.m.clear()
  }
  getItem(k: string) {
    return this.m.get(k) ?? null
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null
  }
  removeItem(k: string) {
    this.m.delete(k)
  }
  setItem(k: string, v: string) {
    this.m.set(k, v)
  }
}

test('saved scenes survive a reload', () => {
  const store = new MemoryStorage()
  const s = { ...defaultScene(), camera: { pitch: 33, yaw: 12, lens: 20 } }
  addSaved(store, 'Pertama', s)
  const list = listSaved(store)
  expect(list).not.toBe('unavailable')
  if (list === 'unavailable') return
  expect(list).toHaveLength(1)
  expect(list[0].name).toBe('Pertama')
  expect(decodeScene(list[0].data)).toEqual(s)
})

test('newest first, capped at 50', () => {
  const store = new MemoryStorage()
  for (let i = 0; i < 55; i++) addSaved(store, `n${i}`, defaultScene())
  const list = listSaved(store)
  if (list === 'unavailable') throw new Error('unavailable')
  expect(list).toHaveLength(50)
  expect(list[0].name).toBe('n54')
})

test('remove deletes one entry', () => {
  const store = new MemoryStorage()
  addSaved(store, 'a', defaultScene())
  const list = addSaved(store, 'b', defaultScene())
  if (list === 'unavailable') throw new Error('unavailable')
  removeSaved(store, list[0].id)
  expect((listSaved(store) as { name: string }[]).map((x) => x.name)).toEqual(['a'])
})

test('blocked storage reports unavailable', () => {
  const blocked = new MemoryStorage()
  blocked.getItem = () => {
    throw new Error('SecurityError')
  }
  expect(listSaved(blocked)).toBe('unavailable')
  expect(listSaved(null)).toBe('unavailable')
  expect(addSaved(null, 'x', defaultScene())).toBe('unavailable')
})

test('corrupted saved entries are skipped', () => {
  const store = new MemoryStorage()
  addSaved(store, 'ok', defaultScene())
  const raw = JSON.parse(store.getItem('auroragen.saved.v1')!)
  raw.push({ id: 'x', name: 'bad', createdAt: 1, data: '1.garbage' }, 42, null)
  store.setItem('auroragen.saved.v1', JSON.stringify(raw))
  expect(listSaved(store)).toHaveLength(1)
  store.setItem('auroragen.saved.v1', '{not json')
  expect(listSaved(store)).toEqual([])
})
