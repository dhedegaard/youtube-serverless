import { expect, test } from 'vitest'
import { aggregateRefresh, type VideoWithoutShortClassification } from '../aggregate-refresh'

const video = (videoId: string, videoPublishedAt: string): VideoWithoutShortClassification => ({
  channelId: 'UCexample',
  videoId,
  videoPublishedAt,
  thumbnail: 'https://example.com/thumb.jpg',
  channelTitle: 'Example Channel',
  channelThumbnail: 'https://example.com/chan.jpg',
  channelLink: 'https://www.youtube.com/channel/UCexample',
  title: `Video ${videoId}`,
  durationInSeconds: 100,
})

const ok = (
  videos: readonly VideoWithoutShortClassification[]
): PromiseFulfilledResult<readonly VideoWithoutShortClassification[]> => ({
  status: 'fulfilled',
  value: videos,
})
const fail = (): PromiseRejectedResult => ({ status: 'rejected', reason: new Error('boom') })

test('all channels succeed → 200, newest-first, capped to limit', () => {
  const result = aggregateRefresh(
    [
      ok([video('a', '2024-01-02T00:00:00Z')]),
      ok([video('b', '2024-01-03T00:00:00Z'), video('c', '2024-01-01T00:00:00Z')]),
    ],
    2
  )
  expect(result.status).toBe(200)
  expect(result.succeededCount).toBe(2)
  expect(result.failedCount).toBe(0)
  // Newest first (b, a), sliced to 2 so the oldest (c) is dropped.
  expect(result.videosToStore?.map((v) => v.videoId)).toEqual(['b', 'a'])
})

test('some channels fail → 207, storing only the survivors', () => {
  const result = aggregateRefresh([ok([video('a', '2024-01-01T00:00:00Z')]), fail()], 120)
  expect(result.status).toBe(207)
  expect(result.succeededCount).toBe(1)
  expect(result.failedCount).toBe(1)
  expect(result.videosToStore?.map((v) => v.videoId)).toEqual(['a'])
})

test('no channel succeeds → 500 and null (do not overwrite stored data)', () => {
  const result = aggregateRefresh([fail(), fail()], 120)
  expect(result.status).toBe(500)
  expect(result.succeededCount).toBe(0)
  expect(result.failedCount).toBe(2)
  expect(result.videosToStore).toBeNull()
})
