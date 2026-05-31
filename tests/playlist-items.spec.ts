import { expect, test } from '@playwright/test'
import { parseAvailablePlaylistItems } from '../src/clients/youtube/playlist-items'

const thumb = { url: 'https://example.com/t.jpg', width: 120, height: 90 }

const availableItem = (videoId: string, privacyStatus = 'public') => ({
  contentDetails: { videoId, videoPublishedAt: '2024-01-01T00:00:00Z' },
  status: { privacyStatus },
  snippet: {
    publishedAt: '2024-01-01T00:00:00Z',
    channelId: 'UCexample',
    title: `Video ${videoId}`,
    description: 'A normal description',
    thumbnails: { default: thumb, medium: thumb, high: thumb },
    channelTitle: 'Example Channel',
  },
})

// The degraded shape YouTube returns for a deleted video still sitting in a
// playlist: empty thumbnails, no contentDetails.videoPublishedAt, and the
// undocumented `privacyStatusUnspecified`.
const deletedItem = (videoId: string) => ({
  contentDetails: { videoId },
  status: { privacyStatus: 'privacyStatusUnspecified' },
  snippet: {
    publishedAt: '2024-01-01T00:00:00Z',
    channelId: 'UCexample',
    title: 'Deleted video',
    description: 'This video is unavailable.',
    thumbnails: {},
    channelTitle: 'Example Channel',
  },
})

const privateItem = (videoId: string) => ({
  contentDetails: { videoId },
  status: { privacyStatus: 'private' },
  snippet: {
    publishedAt: '2024-01-01T00:00:00Z',
    channelId: 'UCexample',
    title: 'Private video',
    description: 'This video is private.',
    thumbnails: {},
    channelTitle: 'Example Channel',
  },
})

test('keeps public and unlisted videos', async () => {
  const result = await parseAvailablePlaylistItems({
    items: [availableItem('aaa'), availableItem('bbb', 'unlisted')],
  })
  expect(result.map((v) => v.contentDetails.videoId)).toEqual(['aaa', 'bbb'])
})

test('drops a deleted video without throwing on its degraded shape', async () => {
  // This is the exact case the old strict schema crashed on, taking down the
  // whole fetch-data run. It must now parse and simply be filtered out.
  const result = await parseAvailablePlaylistItems({ items: [deletedItem('dead')] })
  expect(result).toEqual([])
})

test('drops a private video', async () => {
  const result = await parseAvailablePlaylistItems({ items: [privateItem('priv')] })
  expect(result).toEqual([])
})

test('returns only available videos from a mixed response, preserving order', async () => {
  const result = await parseAvailablePlaylistItems({
    items: [
      availableItem('keep1'),
      deletedItem('drop1'),
      privateItem('drop2'),
      availableItem('keep2', 'unlisted'),
    ],
  })
  expect(result.map((v) => v.contentDetails.videoId)).toEqual(['keep1', 'keep2'])
})

test('drops unknown/future privacy statuses (fail-safe whitelist)', async () => {
  const result = await parseAvailablePlaylistItems({
    items: [{ ...availableItem('weird'), status: { privacyStatus: 'somethingBrandNew' } }],
  })
  expect(result).toEqual([])
})

test('rejects a malformed response missing the items array', async () => {
  await expect(parseAvailablePlaylistItems({})).rejects.toThrow()
})
