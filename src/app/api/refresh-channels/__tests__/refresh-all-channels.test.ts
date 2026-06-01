import { expect, test } from 'vitest'
import type { Channel } from '../../../../models/channel'
import { refreshAllChannels } from '../refresh-all-channels'

const channel = (channelId: string): Channel => ({
  channelId,
  channelTitle: `Title ${channelId}`,
  playlist: `UU${channelId}`,
  thumbnail: 'https://example.com/t.jpg',
  channelThumbnail: 'https://example.com/c.jpg',
  channelLink: `https://www.youtube.com/channel/${channelId}`,
})

const refreshed = (c: Channel): Channel => ({ ...c, channelTitle: `${c.channelTitle} (refreshed)` })

test('refreshes every channel when none fail', async () => {
  const channels = [channel('a'), channel('b')]
  const result = await refreshAllChannels(channels, (c) => Promise.resolve(refreshed(c)))

  expect(result.succeededCount).toBe(2)
  expect(result.failedCount).toBe(0)
  expect(result.errors).toEqual([])
  expect(result.channels.map((c) => c.channelTitle)).toEqual([
    'Title a (refreshed)',
    'Title b (refreshed)',
  ])
})

test('isolates a failing channel: continues, keeps its existing data, and records the error', async () => {
  const channels = [channel('a'), channel('boom'), channel('c')]
  const result = await refreshAllChannels(channels, (c) =>
    c.channelId === 'boom'
      ? Promise.reject(new Error('upstream failed'))
      : Promise.resolve(refreshed(c))
  )

  expect(result.succeededCount).toBe(2)
  expect(result.failedCount).toBe(1)
  // The failed channel keeps its existing (un-refreshed) data, in place.
  expect(result.channels.map((c) => c.channelTitle)).toEqual([
    'Title a (refreshed)',
    'Title boom',
    'Title c (refreshed)',
  ])
  expect(result.errors).toHaveLength(1)
  expect(result.errors[0]?.channel.channelId).toBe('boom')
})

test('preserves input order and isolation across batch boundaries', async () => {
  // concurrency 2 over 5 channels -> batches [a,b], [boom,d], [e]; the failure
  // lands in the second batch.
  const channels = [channel('a'), channel('b'), channel('boom'), channel('d'), channel('e')]
  const result = await refreshAllChannels(
    channels,
    (c) =>
      c.channelId === 'boom'
        ? Promise.reject(new Error('upstream failed'))
        : Promise.resolve(refreshed(c)),
    2
  )

  expect(result.channels.map((c) => c.channelId)).toEqual(['a', 'b', 'boom', 'd', 'e'])
  expect(result.channels.map((c) => c.channelTitle)).toEqual([
    'Title a (refreshed)',
    'Title b (refreshed)',
    'Title boom',
    'Title d (refreshed)',
    'Title e (refreshed)',
  ])
  expect(result.succeededCount).toBe(4)
  expect(result.failedCount).toBe(1)
  expect(result.errors).toHaveLength(1)
  expect(result.errors[0]?.channel.channelId).toBe('boom')
})

test('runs at most `concurrency` refreshOne calls at once', async () => {
  const channels = Array.from({ length: 10 }, (_, i) => channel(`c${i.toString()}`))
  let active = 0
  let peak = 0
  const refreshOne = async (c: Channel): Promise<Channel> => {
    active += 1
    peak = Math.max(peak, active)
    await new Promise<void>((resolve) => setTimeout(resolve, 5))
    active -= 1
    return c
  }

  const result = await refreshAllChannels(channels, refreshOne, 3)

  expect(peak).toBe(3)
  expect(result.succeededCount).toBe(10)
})
