import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { createMongoDbClient } from '../../../clients/mongodb'
import { getChannelInfo, getVideosForChannelId } from '../../../clients/youtube'
import { Video } from '../../../models/video'
import { isApiRequestAuthenticated } from '../../../utils/api-helpers'
import { SERVER_ENV } from '../../../utils/server-env'

export const maxDuration = 10

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
    const { newVideos } = await Promise.all(
      channels.map<Promise<{ newVideos: Video[] }>>(async (channel) => {
        const item = await getChannelInfo(channel.channelId).then((data) => data.items?.[0])
        if (item != null) {
          channel.playlist = item.contentDetails.relatedPlaylists.uploads
        }
        const videos = await getVideosForChannelId(channel.playlist)
        const newVideos = videos.filter((e) =>
          channel.videoIds == null ? true : !channel.videoIds.includes(e.contentDetails.videoId)
        )
        channel.videoIds = [
          ...new Set([...channel.videoIds, ...newVideos.map((e) => e.contentDetails.videoId)]),
        ]
        updateChannelsPromises.push(dbClient.updateChannel({ channel }))
        return {
          newVideos: newVideos.map((videoItem) => {
            const video: Video = {
              videoId: videoItem.contentDetails.videoId,
              channelId: channel.channelId,
              thumbnail: videoItem.snippet.thumbnails.high.url,
              channelTitle: videoItem.snippet.channelTitle,
              title: videoItem.snippet.title,
              videoPublishedAt: videoItem.snippet.publishedAt,
              channelThumbnail: channel.thumbnail,
              channelLink: `https://www.youtube.com/channel/${channel.channelId}`,
            }
            return video
          }),
        }
      })
    ).then((results) => ({
      // Flatmap the videos from all the channels, and order then by when they were published (ASC).
      newVideos: results
        .flatMap((result) => result.newVideos)
        .sort((a, b) => a.videoPublishedAt.localeCompare(b.videoPublishedAt)),
    }))

    const [, newVideoPromises] = await Promise.all([
      // The channelpromises ran in parallel, await them before invalidating anything.
      Promise.all(updateChannelsPromises),
      // We store up to the last 50 videos and throw away the rest.
      Promise.all(
        newVideos
          .reverse()
          .slice(0, 50)
          .map((newVideo) => dbClient.putVideo({ video: newVideo }))
      ),
    ])

    revalidatePath('/')

    return NextResponse.json({
      channelcount: channels.length,
      newVideoCount: newVideoPromises.length,
    })
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await dbClient.close()
  }
}
