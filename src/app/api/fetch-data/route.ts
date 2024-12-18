import { parse, toSeconds } from 'iso8601-duration'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { createMongoDbClient } from '../../../clients/mongodb'
import {
  getChannelInfo,
  getContentDetailsForVideos,
  getVideosForChannelId,
} from '../../../clients/youtube'
import { Video } from '../../../models/video'
import { isApiRequestAuthenticated } from '../../../utils/api-helpers'
import { SERVER_ENV } from '../../../utils/server-env'

export const maxDuration = 60
export const revalidate = 0

export const POST = async (request: NextRequest) => {
  if (!isApiRequestAuthenticated(request)) {
    return NextResponse.json({ error: 'Missing or bad authorization header' }, { status: 401 })
  }

  const dbClient = await createMongoDbClient({
    connectionString: SERVER_ENV.MONGODB_URI,
  })

  try {
    const channels = await dbClient.getChannels({})
    const updateChannelsPromises: Promise<unknown>[] = []
    // Determine all the new videos.
    const { videos } = await Promise.all(
      channels.map<Promise<{ videos: Video[] }>>(async (channel) => {
        const item = await getChannelInfo({ type: 'channelId', channelId: channel.channelId }).then(
          (data) => data.items?.[0]
        )
        if (item != null && channel.playlist !== item.contentDetails.relatedPlaylists.uploads) {
          channel.playlist = item.contentDetails.relatedPlaylists.uploads
          updateChannelsPromises.push(dbClient.updateChannel({ channel }))
        }
        const videos = await getVideosForChannelId(channel.playlist)
        const contentDetailsItems = await getContentDetailsForVideos({
          videoIds: videos.map((video) => video.contentDetails.videoId),
        })
        return {
          videos: videos
            .map<Video | null>((videoItem) => {
              const contentDetailsItem = contentDetailsItems.items.find(
                (item) => item.id === videoItem.contentDetails.videoId
              )
              const durationString = contentDetailsItem?.contentDetails.duration
              const durationInSeconds =
                durationString == null ? null : toSeconds(parse(durationString))
              // NOTE: We skip upcomming videos, as they are not ready to be played yet.
              if (contentDetailsItem?.snippet.liveBroadcastContent === 'upcoming') {
                return null
              }
              return {
                videoId: videoItem.contentDetails.videoId,
                channelId: channel.channelId,
                thumbnail: videoItem.snippet.thumbnails.high.url,
                channelTitle: videoItem.snippet.channelTitle,
                title: videoItem.snippet.title,
                videoPublishedAt: videoItem.snippet.publishedAt,
                channelThumbnail: channel.thumbnail,
                channelLink: `https://www.youtube.com/channel/${channel.channelId}`,
                durationInSeconds: durationInSeconds ?? null,
              } satisfies Video
            })
            .filter((video) => video != null),
        }
      })
    ).then((results) => ({
      // Flatmap the videos from all the channels, and order then by when they were published (ASC).
      videos: results
        .flatMap((result) => result.videos)
        .sort((a, b) => a.videoPublishedAt.localeCompare(b.videoPublishedAt))
        .reverse(),
    }))

    await Promise.all([
      // The channelpromises ran in parallel, await them before invalidating anything.
      Promise.all(updateChannelsPromises),
      // We store up to the last 50 videos and throw away the rest.
      dbClient.putLatestVideos({ videos: videos.slice(0, 60) }),
    ])

    revalidatePath('/')

    return NextResponse.json({
      channelcount: channels.length,
      updatedChannels: updateChannelsPromises.length,
      videoCount: videos.length,
    })
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await dbClient.close()
  }
}
