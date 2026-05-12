import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { createMongoDbClient } from '../../../clients/mongodb'
import { getChannelInfo } from '../../../clients/youtube'
import type { Channel } from '../../../models/channel'
import { isApiRequestAuthenticated } from '../../../utils/api-helpers'
import { SERVER_ENV } from '../../../utils/server-env'

export const revalidate = 0

export const POST = async (request: NextRequest) => {
  if (!isApiRequestAuthenticated(request)) {
    return NextResponse.json({ error: 'Missing or bad authorization header' }, { status: 401 })
  }

  const dbClient = await createMongoDbClient({
    connectionString: SERVER_ENV.MONGODB_URI,
  })

  try {
    const channels = await dbClient.getChannels()
    const updatedChannels: Channel[] = []
    for (const channel of channels) {
      const item = await getChannelInfo({ type: 'channelId', channelId: channel.channelId }).then(
        (data) => data.items?.[0]
      )
      if (item == null) {
        updatedChannels.push(channel)
        continue
      }
      const updatedChannel = {
        ...channel,
        channelTitle: item.snippet.title,
        channelThumbnail: item.snippet.thumbnails.high.url,
        playlist: item.contentDetails.relatedPlaylists.uploads,
        thumbnail: item.snippet.thumbnails.high.url,
        channelLink: `https://www.youtube.com/channel/${channel.channelId}`,
      } satisfies Channel
      await dbClient.updateChannel({
        channel: updatedChannel,
      })
      updatedChannels.push(updatedChannel)
    }

    revalidatePath('/')

    return NextResponse.json({ channels: updatedChannels })
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await dbClient.close()
  }
}
