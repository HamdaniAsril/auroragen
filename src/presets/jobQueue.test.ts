import { expect, test } from 'vitest'
import { createJobQueue } from './jobQueue'

test('runs one job at a time, urgent jobs before waiting ones', async () => {
  const q = createJobQueue()
  const order: string[] = []
  let release!: () => void
  const first = q.add(() => new Promise<string>((r) => (release = () => r('a'))).then((v) => (order.push(v), v)))
  const rest = ['b', 'c'].map((v) => q.add(async () => (order.push(v), v)))
  const urgent = q.add(async () => (order.push('now'), 'now'), { urgent: true })
  await Promise.resolve()
  expect(order).toEqual([])
  release()
  await Promise.all([first, urgent, ...rest])
  expect(order).toEqual(['a', 'now', 'b', 'c'])
})

test('a failed job does not stop the queue', async () => {
  const q = createJobQueue()
  const bad = q.add(async () => {
    throw new Error('x')
  })
  const good = q.add(async () => 'ok')
  await expect(bad).rejects.toThrow('x')
  await expect(good).resolves.toBe('ok')
})
