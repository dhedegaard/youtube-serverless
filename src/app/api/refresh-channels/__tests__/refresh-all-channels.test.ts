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
    c.channelId === 'boom' ? Promise.reject(new Error('upstream failed')) : Promise.resolve(refreshed(c))
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
