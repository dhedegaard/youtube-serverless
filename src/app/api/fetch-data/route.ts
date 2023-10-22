import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { deleteOldVideos, getChannels, putVideo, updateChannel } from '../../../clients/dynamodb'
import { getChannelInfo, getVideosForChannelId } from '../../../clients/youtube'
import { Video } from '../../../models/video'
import { isApiRequestAuthenticated } from '../../../utils/api-helpers'

export const POST = async (request: NextRequest) => {
  if (!isApiRequestAuthenticated(request)) {
    return NextResponse.json({ error: 'Missing or bad authorization header' }, { status: 401 })
  }

  try {
    const channels = await getChannels()
    let newVideoCount = 0
    const [deletedVideos] = await Promise.all([
      // deletedVideos
      deleteOldVideos({ numberToKeep: 100 }),
      // ...rest
      ...channels.map(async (channel) => {
        const item = await getChannelInfo(channel.channelId).then((data) => data.items?.[0])
        if (item != null) {
          channel.playlist = item.contentDetails.relatedPlaylists.uploads
        }
        const videos = await getVideosForChannelId(channel.playlist)
        const newVideos = videos.filter((e) =>
          channel.videoIds == null ? true : !channel.videoIds.includes(e.contentDetails.videoId)
        )
        newVideoCount += newVideos.length
        channel.videoIds = [
          ...new Set([...channel.videoIds, ...newVideos.map((e) => e.contentDetails.videoId)]),
        ]
        await Promise.all([
          updateChannel({ channel }),
          ...newVideos.map((videoItem) => {
            const video: Video = {
              id: null,
              videoId: videoItem.contentDetails.videoId,
              channelId: channel.channelId,
              thumbnail: videoItem.snippet.thumbnails.high.url,
              channelTitle: videoItem.snippet.channelTitle,
              title: videoItem.snippet.title,
              videoPublishedAt: videoItem.snippet.publishedAt,
              channelThumbnail: channel.thumbnail,
              channelLink: `https://www.youtube.com/channel/${channel.channelId}`,
            }
            return putVideo({ video })
          }),
        ])
      }),
    ])

    revalidatePath('/')

    return NextResponse.json({
      channelcount: channels.length,
      newVideoCount,
      deletedVideos,
    })
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
