import type { Channel } from '../../models/channel'
// Type-only import so this module (and its unit test) never pulls in the
// youtube client's `SERVER_ENV`-at-import side effects.
import type { ChannelInfoItem } from './index'

/**
 * Build a stored `Channel` from a YouTube `channels.list` item. Shared by
 * `add-channel` and `refresh-channels` so the mapping lives in one place.
 */
export const channelFromInfoItem = (item: ChannelInfoItem): Channel => ({
  channelId: item.id,
  channelTitle: item.snippet.title,
  playlist: item.contentDetails.relatedPlaylists.uploads,
  thumbnail: item.snippet.thumbnails.high.url,
  channelThumbnail: item.snippet.thumbnails.high.url,
  channelLink: `https://www.youtube.com/channel/${item.id}`,
})
