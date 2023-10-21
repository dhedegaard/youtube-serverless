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
        const item = await getChannelInfo(channel.channelId.S).then((data) => data.items?.[0])
        if (item != null) {
          channel.playlist = {
            S: item.contentDetails.relatedPlaylists.uploads,
          }
        }
        const videos = await getVideosForChannelId(channel.playlist.S)
        const newVideos = videos.filter((e) =>
          channel.videoIds == null ? true : !channel.videoIds.SS.includes(e.contentDetails.videoId)
        )
        newVideoCount += newVideos.length
        channel.videoIds = {
          SS: [
            ...new Set([
              ...(channel.videoIds?.SS ?? []),
              ...newVideos.map((e) => e.contentDetails.videoId),
            ]),
          ],
        }
        await Promise.all([
          updateChannel(channel),
          ...newVideos.map((videoItem) => {
            const video: Video = {
              id: null,
              videoId: videoItem.contentDetails.videoId,
              channelId: channel.channelId.S,
              thumbnail: videoItem.snippet.thumbnails.high.url,
              channelTitle: videoItem.snippet.channelTitle,
              title: videoItem.snippet.title,
              videoPublishedAt: videoItem.snippet.publishedAt,
              channelThumbnail: channel.thumbnail.S,
              channelLink: `https://www.youtube.com/channel/${channel.channelId.S}`,
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
