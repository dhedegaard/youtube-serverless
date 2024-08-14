import { z } from 'zod'
import { SERVER_ENV } from '../../utils/server-env'

const channelInfoItemSchema = z.object({
  id: z.string().min(1),
  snippet: z.object({
    title: z.string().min(1),
    description: z.string(),
    customUrl: z.string(),
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
interface ChannelInfoItem extends z.TypeOf<typeof channelInfoItemSchema> {}
const channelInfoSchema = z.object({
  /** Not defined when there's no result for given channel ID input parameter. */
  items: z.optional(z.array(channelInfoItemSchema as z.ZodType<ChannelInfoItem>)),
})
interface ChannelInfo extends z.TypeOf<typeof channelInfoSchema> {}

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
  .function()
  .args(getChannelInfoArgsSchema)
  .implement(async function getChannelInfo(args): Promise<ChannelInfo> {
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
      `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`
    )
    if (!response.ok) {
      throw new Error(
        `Unable to get channel info: ${response.status.toString()} ${response.statusText}`
      )
    }
    const responseJson: unknown = await response.json()
    return await channelInfoSchema.parseAsync(responseJson)
  })

const videoItemSchema = z.object({
  contentDetails: z.object({
    videoId: z.string().min(1),
    videoPublishedAt: z.string().min(1),
  }),
  snippet: z.object({
    publishedAt: z.string().min(1),
    channelId: z.string().min(1),
    title: z.string().min(1),
    description: z.string(),
    thumbnails: z.object({
      default: z.object({
        url: z.string().min(1),
        width: z.number(),
        height: z.number(),
      }),
      medium: z.object({
        url: z.string().min(1),
        width: z.number(),
        height: z.number(),
      }),
      high: z.object({
        url: z.string().min(1),
        width: z.number(),
        height: z.number(),
      }),
      standard: z
        .object({
          url: z.string().min(1),
          width: z.number(),
          height: z.number(),
        })
        .optional(),
      maxres: z
        .object({
          url: z.string().min(1),
          width: z.number(),
          height: z.number(),
        })
        .optional(),
    }),
    channelTitle: z.string().min(1),
  }),
})
interface VideoItem extends z.TypeOf<typeof videoItemSchema> {}
const videoSchema = z.object({
  nextPageToken: z.string().optional(),
  items: z.array(videoItemSchema as z.ZodType<VideoItem>),
})
export const getVideosForChannelId = async (channelId: string): Promise<readonly VideoItem[]> => {
  const params = new URLSearchParams()
  params.set('part', 'contentDetails,snippet')
  params.set('maxResults', '60')
  params.set('playlistId', channelId)
  params.set('key', SERVER_ENV.YOUTUBE_API_KEY)
  const resp = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`,
    {}
  )
  if (resp.status === 404) {
    return []
  }
  if (!resp.ok) {
    throw new Error(
      `Unable to get videos for channel ID ${channelId}: ${resp.status.toString()} ${resp.statusText}`
    )
  }
  const data = await resp.json().then((data: unknown) => videoSchema.parseAsync(data))
  return data.items
}

const ContentDetailsResponseItem = z.object({
  id: z.string().min(1),
  contentDetails: z.object({
    duration: z.optional(z.string().startsWith('P') as z.ZodType<`P${string}`>),
  }),
})
export interface ContentDetailsResponseItem extends z.infer<typeof ContentDetailsResponseItem> {}

const ContentDetailsResponse = z.object({
  items: z.array(ContentDetailsResponseItem as z.ZodType<ContentDetailsResponseItem>),
})
export interface ContentDetailsResponse extends z.infer<typeof ContentDetailsResponse> {}

export const getContentDetailsForVideos = z
  .function()
  .args(
    z.object({
      videoIds: z.array(z.string().min(1)).max(60),
    })
  )
  .implement(async function getContentDetailsForVideos({
    videoIds,
  }): Promise<ContentDetailsResponse> {
    if (videoIds.length === 0) {
      return { items: [] } satisfies ContentDetailsResponse
    }
    const url = new URL('https://www.googleapis.com/youtube/v3/videos')
    url.searchParams.set('part', 'contentDetails')
    url.searchParams.set('id', videoIds.join(','))
    url.searchParams.set('key', SERVER_ENV.YOUTUBE_API_KEY)

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(
        `Unable to get video details: ${response.status.toString()} ${response.statusText}`
      )
    }

    const responseJson: unknown = await response.json()
    return await ContentDetailsResponse.parseAsync(responseJson)
  })
