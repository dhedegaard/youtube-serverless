import * as z from 'zod'
import { SERVER_ENV } from '../../utils/server-env'
import { parseAvailablePlaylistItems, type VideoItem } from './playlist-items'

// YouTube Data API list endpoints cap page sizes at 50.
const YOUTUBE_MAX_RESULTS = 50

// Bound every YouTube Data API request so a single hung connection can't stall
// the whole refresh run until the platform's maxDuration kills it — that would
// abort *all* channels and defeat the per-channel isolation in the refresh
// routes. A timed-out request rejects, isolating the failure to its channel.
const YOUTUBE_API_TIMEOUT_MS = 10_000

const channelInfoItemSchema = z.object({
  id: z.string().min(1),
  snippet: z.object({
    title: z.string().min(1),
    description: z.string(),
    thumbnails: z.object({
      high: z.object({
        url: z.string().min(1),
      }),
    }),
  }),
  contentDetails: z.object({
    relatedPlaylists: z.object({
      uploads: z.string().min(1),
    }),
  }),
})
export interface ChannelInfoItem extends z.infer<typeof channelInfoItemSchema> {}
const channelInfoSchema = z.object({
  /** Not defined when there's no result for given channel ID input parameter. */
  items: z.optional(z.array(channelInfoItemSchema as z.ZodType<ChannelInfoItem, ChannelInfoItem>)),
})
interface ChannelInfo extends z.infer<typeof channelInfoSchema> {}

const getChannelInfoArgsSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('channelId'),
    channelId: z.string().min(1),
  }),
  z.object({
    type: z.literal('forUsername'),
    username: z.string().min(1),
  }),
])
export const getChannelInfo = z
  .function({
    input: [getChannelInfoArgsSchema],
  })
  .implementAsync(async function getChannelInfo(args): Promise<ChannelInfo> {
    const params = new URLSearchParams()
    params.set('part', 'snippet,contentDetails')
    switch (args.type) {
      case 'channelId':
        params.set('id', args.channelId)
        break
      case 'forUsername':
        params.set('forUsername', args.username)
        break
      default:
        // @ts-expect-error - exhaustive check
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new TypeError(`Invalid type: ${args.type}`)
    }
    params.set('key', SERVER_ENV.YOUTUBE_API_KEY)
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`,
      { signal: AbortSignal.timeout(YOUTUBE_API_TIMEOUT_MS) }
    )
    if (!response.ok) {
      throw new Error(
        `Unable to get channel info: ${response.status.toString()} ${response.statusText}`
      )
    }
    const responseJson: unknown = await response.json()
    return await channelInfoSchema.parseAsync(responseJson)
  })

export const getVideosForChannelId = async (channelId: string): Promise<readonly VideoItem[]> => {
  const params = new URLSearchParams()
  params.set('part', 'contentDetails,snippet,status')
  params.set('maxResults', String(YOUTUBE_MAX_RESULTS))
  params.set('playlistId', channelId)
  params.set('key', SERVER_ENV.YOUTUBE_API_KEY)
  const resp = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`,
    { signal: AbortSignal.timeout(YOUTUBE_API_TIMEOUT_MS) }
  )
  if (resp.status === 404) {
    return []
  }
  if (!resp.ok) {
    throw new Error(
      `Unable to get videos for channel ID ${channelId}: ${resp.status.toString()} ${resp.statusText}`
    )
  }
  const json: unknown = await resp.json()
  return await parseAvailablePlaylistItems(json)
}

const ContentDetailsResponseItem = z.object({
  id: z.string().min(1),
  contentDetails: z.object({
    duration: z.optional(z.string().startsWith('P') as z.ZodType<`P${string}`, `P${string}`>),
  }),
  snippet: z.object({
    liveBroadcastContent: z.enum(['none', 'upcoming', 'live']),
  }),
})
export interface ContentDetailsResponseItem extends z.infer<typeof ContentDetailsResponseItem> {}

const ContentDetailsResponse = z.object({
  items: z.array(
    ContentDetailsResponseItem as z.ZodType<ContentDetailsResponseItem, ContentDetailsResponseItem>
  ),
})
export interface ContentDetailsResponse extends z.infer<typeof ContentDetailsResponse> {}

export const getContentDetailsForVideos = z
  .function({
    input: [
      z.object({
        videoIds: z.array(z.string().min(1)).max(YOUTUBE_MAX_RESULTS),
      }),
    ],
  })
  .implementAsync(async function getContentDetailsForVideos({
    videoIds,
  }): Promise<ContentDetailsResponse> {
    if (videoIds.length === 0) {
      return { items: [] } satisfies ContentDetailsResponse
    }
    const url = new URL('https://www.googleapis.com/youtube/v3/videos')
    url.searchParams.set('part', 'contentDetails,snippet')
    url.searchParams.set('id', videoIds.join(','))
    url.searchParams.set('key', SERVER_ENV.YOUTUBE_API_KEY)

    const response = await fetch(url, { signal: AbortSignal.timeout(YOUTUBE_API_TIMEOUT_MS) })
    if (!response.ok) {
      throw new Error(
        `Unable to get video details: ${response.status.toString()} ${response.statusText}`
      )
    }

    const responseJson: unknown = await response.json()
    return await ContentDetailsResponse.parseAsync(responseJson)
  })

export const isVideoServedAsShort = z
  .function({
    input: [z.object({ videoId: z.string().min(1) })],
    output: z.boolean().nullable(),
  })
  .implementAsync(async function isVideoServedAsShort({ videoId }): Promise<boolean | null> {
    try {
      const url = new URL(`https://www.youtube.com/shorts/${encodeURIComponent(videoId)}`)
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(5_000),
      })

      if (response.status === 200) {
        return true
      }

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        return location == null || !location.includes('/watch') ? null : false
      }

      return null
    } catch {
      return null
    }
  })
