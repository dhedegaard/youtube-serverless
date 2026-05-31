import { parse, toSeconds } from 'iso8601-duration'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { createMongoDbClient } from '../../../clients/mongodb'
import {
  getContentDetailsForVideos,
  isVideoServedAsShort,
  getVideosForChannelId,
} from '../../../clients/youtube'
import type { Channel } from '../../../models/channel'
import { isApiRequestAuthenticated } from '../../../utils/api-helpers'
import { SERVER_ENV } from '../../../utils/server-env'
import { classifyShortVideo } from '../../../utils/youtube-shorts'
import { aggregateRefresh, type VideoWithoutShortClassification } from './aggregate-refresh'

export const maxDuration = 60
export const revalidate = 0

// We store up to the last 120 videos and throw away the rest.
const MAX_STORED_VIDEOS = 120

// Fetch and shape a single channel's latest uploads. Throws on any upstream
// failure so the caller (Promise.allSettled) can isolate it to this channel.
const fetchChannelVideos = async (
  channel: Channel
): Promise<VideoWithoutShortClassification[]> => {
  const videos = await getVideosForChannelId(channel.playlist)
  const contentDetailsItems = await getContentDetailsForVideos({
    videoIds: videos.map((video) => video.contentDetails.videoId),
  })
  return videos
    .map<VideoWithoutShortClassification | null>((videoItem) => {
      const contentDetailsItem = contentDetailsItems.items.find(
        (item) => item.id === videoItem.contentDetails.videoId
      )
      const durationString = contentDetailsItem?.contentDetails.duration
      const durationInSeconds = durationString == null ? null : toSeconds(parse(durationString))
      // NOTE: We skip upcomming videos, as they are not ready to be played yet.
      if (contentDetailsItem?.snippet.liveBroadcastContent === 'upcoming') {
        return null
      }
      // Available videos always carry a high thumbnail; bail out defensively
      // if one is ever missing rather than render a broken image.
      const thumbnail = videoItem.snippet.thumbnails.high?.url
      if (thumbnail == null) {
        return null
      }
      return {
        videoId: videoItem.contentDetails.videoId,
        channelId: channel.channelId,
        thumbnail,
        channelTitle: videoItem.snippet.channelTitle,
        title: videoItem.snippet.title,
        videoPublishedAt: videoItem.snippet.publishedAt,
        channelThumbnail: channel.thumbnail,
        channelLink: `https://www.youtube.com/channel/${channel.channelId}`,
        durationInSeconds: durationInSeconds ?? null,
      } satisfies VideoWithoutShortClassification
    })
    .filter((video) => video != null)
}

export const POST = async (request: NextRequest) => {
  if (!isApiRequestAuthenticated(request)) {
    return NextResponse.json({ error: 'Missing or bad authorization header' }, { status: 401 })
  }

  const dbClient = await createMongoDbClient({
    connectionString: SERVER_ENV.MONGODB_URI,
  })

  try {
    const channels = await dbClient.getChannels()

    // No channels configured is a valid, expected state (fresh install or the
    // last channel removed), not a failure — return a clean no-op rather than
    // tripping monitoring with a 500. Returns before any write/revalidate.
    if (channels.length === 0) {
      console.info('No channels configured; skipping refresh')
      return NextResponse.json(
        { channelCount: 0, succeededChannels: 0, failedChannels: 0, videoCount: 0 },
        { status: 200 }
      )
    }

    // Refresh every channel independently — one failing channel must not abort
    // the whole run (see aggregateRefresh for how partial failures are handled).
    const channelResults = await Promise.allSettled(
      channels.map((channel) => fetchChannelVideos(channel))
    )
    channelResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(
          `Failed to refresh channel ${channels[index]?.channelId ?? '<unknown>'}:`,
          result.reason
        )
      }
    })

    const { videosToStore, succeededCount, failedCount, status } = aggregateRefresh(
      channelResults,
      MAX_STORED_VIDEOS
    )

    // No channel succeeded — leave the existing stored videos untouched rather
    // than blanking the homepage, and surface a hard failure for monitoring.
    if (videosToStore == null) {
      return NextResponse.json(
        { error: 'All channels failed to refresh', channelCount: channels.length, failedChannels: failedCount },
        { status }
      )
    }

    const videos = await Promise.all(
      videosToStore.map(async (video) => ({
        ...video,
        ...classifyShortVideo({
          durationInSeconds: video.durationInSeconds,
          isServedAsShort: await isVideoServedAsShort({ videoId: video.videoId }),
        }),
      }))
    )

    await dbClient.putLatestVideos({ videos })
    revalidatePath('/')

    return NextResponse.json(
      {
        channelCount: channels.length,
        succeededChannels: succeededCount,
        failedChannels: failedCount,
        videoCount: videos.length,
      },
      { status }
    )
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await dbClient.close()
  }
}
