import { expect, test } from 'vitest'
import { channelFromInfoItem } from '../channel-from-info-item'

const infoItem = {
  id: 'UCexample',
  snippet: {
    title: 'Example Channel',
    description: 'desc',
    thumbnails: { high: { url: 'https://example.com/high.jpg' } },
  },
  contentDetails: { relatedPlaylists: { uploads: 'UUexample' } },
}

test('maps a channels.list item into a stored Channel', () => {
  expect(channelFromInfoItem(infoItem)).toEqual({
    channelId: 'UCexample',
    channelTitle: 'Example Channel',
    playlist: 'UUexample',
    thumbnail: 'https://example.com/high.jpg',
    channelThumbnail: 'https://example.com/high.jpg',
    channelLink: 'https://www.youtube.com/channel/UCexample',
  })
})
