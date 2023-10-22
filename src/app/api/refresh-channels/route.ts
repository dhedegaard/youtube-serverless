import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { getChannels, updateChannel } from '../../../clients/dynamodb'
import { getChannelInfo } from '../../../clients/youtube'
import { isApiRequestAuthenticated } from '../../../utils/api-helpers'

export const POST = async (request: NextRequest) => {
  if (!isApiRequestAuthenticated(request)) {
    return NextResponse.json({ error: 'Missing or bad authorization header' }, { status: 401 })
  }

  try {
    const channels = await getChannels()
    for (const channel of channels) {
      const item = await getChannelInfo(channel.channelId).then((data) => data.items?.[0])
      if (item == null) {
        continue
      }
      channel.channelTitle = item.snippet.title
      channel.channelThumbnail = item.snippet.thumbnails.high.url
      channel.playlist = item.contentDetails.relatedPlaylists.uploads
      channel.thumbnail = item.snippet.thumbnails.high.url
      channel.channelLink = `https://www.youtube.com/channel/${channel.channelId}`
      await updateChannel({ channel })
    }

    revalidatePath('/')

    return NextResponse.json({ channels })
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
