import { expect, test } from 'vitest'
import { normalizeStoredVideo, type StoredVideo } from '../normalize-stored-video'

const storedVideo = (overrides: Partial<StoredVideo> = {}): StoredVideo => ({
  channelId: 'UCexample',
  videoId: 'vid123',
  videoPublishedAt: '2024-01-01T00:00:00Z',
  thumbnail: 'https://example.com/thumb.jpg',
  channelTitle: 'Example Channel',
  channelThumbnail: 'https://example.com/chan.jpg',
  channelLink: 'https://www.youtube.com/channel/UCexample',
  title: 'A video',
  durationInSeconds: 600,
  ...overrides,
})

test('backfills the shorts classification from duration when missing', () => {
  const short = normalizeStoredVideo(storedVideo({ durationInSeconds: 60 }))
  expect(short.isShort).toBe(true)
  expect(short.shortDetectionMethod).toBe('duration')

  const long = normalizeStoredVideo(storedVideo({ durationInSeconds: 600 }))
  expect(long.isShort).toBe(false)
  expect(long.shortDetectionMethod).toBe('unknown')
})

test('keeps an already-classified value instead of re-deriving it', () => {
  // Stored as not-a-short via the URL signal, despite a short duration — the
  // stored classification must win over the duration fallback.
  const result = normalizeStoredVideo(
    storedVideo({
      durationInSeconds: 10,
      isShort: false,
      shortDetectionMethod: 'youtube-shorts-url',
    })
  )
  expect(result.isShort).toBe(false)
  expect(result.shortDetectionMethod).toBe('youtube-shorts-url')
})
