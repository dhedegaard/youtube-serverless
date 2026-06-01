import { expect, test } from 'vitest'
import { settleWithConcurrency } from '../concurrency'

const values = <R>(settled: PromiseSettledResult<R>[]): (R | null)[] =>
  settled.map((s) => (s.status === 'fulfilled' ? s.value : null))

test('returns settled results in input order', async () => {
  const settled = await settleWithConcurrency({
    items: [1, 2, 3, 4, 5],
    limit: 2,
    worker: (n) => Promise.resolve(n * 10),
  })
  expect(values(settled)).toEqual([10, 20, 30, 40, 50])
})

test('isolates rejections without affecting other items, preserving order', async () => {
  const settled = await settleWithConcurrency({
    items: [1, 2, 3],
    limit: 2,
    worker: (n) => (n === 2 ? Promise.reject(new Error('boom')) : Promise.resolve(n)),
  })
  expect(settled[0]).toMatchObject({ status: 'fulfilled', value: 1 })
  expect(settled[1]?.status).toBe('rejected')
  expect(settled[2]).toMatchObject({ status: 'fulfilled', value: 3 })
})

test('keeps draining fast items while a slow item holds one slot (rolling, not batched)', async () => {
  const order: number[] = []
  let releaseSlow = (): void => {}
  const slow = new Promise<void>((resolve) => {
    releaseSlow = resolve
  })
  const pending = settleWithConcurrency({
    items: [0, 1, 2, 3, 4],
    limit: 2,
    worker: async (n) => {
      if (n === 0) await slow // item 0 hangs until released
      order.push(n)
      return n
    },
  })

  // While item 0 blocks one worker, the other drains 1..4 — impossible with
  // fixed batches, where item 0's batch would stall 2..4.
  await new Promise<void>((resolve) => setTimeout(resolve, 20))
  expect(order).toEqual([1, 2, 3, 4])

  releaseSlow()
  const settled = await pending
  expect(order).toEqual([1, 2, 3, 4, 0])
  expect(values(settled)).toEqual([0, 1, 2, 3, 4]) // results stay in input order
})

test('runs at most `limit` workers at once', async () => {
  let active = 0
  let peak = 0
  const worker = async (n: number): Promise<number> => {
    active += 1
    peak = Math.max(peak, active)
    await new Promise<void>((resolve) => setTimeout(resolve, 5))
    active -= 1
    return n
  }
  await settleWithConcurrency({
    items: Array.from({ length: 10 }, (_, i) => i),
    limit: 3,
    worker,
  })
  expect(peak).toBe(3)
})

test('passes the input index to the worker', async () => {
  const settled = await settleWithConcurrency({
    items: ['a', 'b', 'c'],
    limit: 2,
    worker: (item, index) => Promise.resolve(`${item}${index.toString()}`),
  })
  expect(values(settled)).toEqual(['a0', 'b1', 'c2'])
})

test('clamps a non-positive limit to 1 instead of looping forever', async () => {
  const settled = await settleWithConcurrency({
    items: [1, 2],
    limit: 0,
    worker: (n) => Promise.resolve(n),
  })
  expect(values(settled)).toEqual([1, 2])
})

test('returns an empty array for empty input', async () => {
  expect(
    await settleWithConcurrency({
      items: [] as number[],
      limit: 4,
      worker: (n) => Promise.resolve(n),
    })
  ).toEqual([])
})
