import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createMongoDbClient } from '../../../clients/mongodb'
import { getChannelInfo } from '../../../clients/youtube'
import { Channel } from '../../../models/channel'
import { isApiRequestAuthenticated } from '../../../utils/api-helpers'
import { SERVER_ENV } from '../../../utils/server-env'

const searchParamsSchema = z.object({
  channelId: z.string().min(1),
  store: z.optional(z.literal('true')),
})

export const POST = async (request: NextRequest) => {
  if (!isApiRequestAuthenticated(request)) {
    return NextResponse.json({ error: 'Missing or bad authorization header' }, { status: 401 })
  }

  const paramsResult = await searchParamsSchema.safeParseAsync(
    Object.fromEntries(new URL(request.url).searchParams.entries())
  )
  if (!paramsResult.success) {
    return NextResponse.json(
      {
        error: 'Missing or bad query params',
        errors: paramsResult.error.errors,
      },
      { status: 400 }
    )
  }
  const { channelId, store } = paramsResult.data

  try {
    const item = await getChannelInfo(channelId).then((data) => data.items?.[0])
    if (item == null) {
      return NextResponse.json(
        { error: `Channel with id not found: ${channelId}` },
        { status: 404 }
      )
    }

    if (store !== 'true') {
      return NextResponse.json(
        {
          error: 'store is not "true", nothing is saved',
          channelTitle: item.snippet.title,
          channelId: item.id,
        },
        { status: 206 }
      )
    }

    const channel: Channel = {
      channelId: item.id,
      channelTitle: item.snippet.title,
      playlist: item.contentDetails.relatedPlaylists.uploads,
      thumbnail: item.snippet.thumbnails.high.url,
      channelLink: `https://www.youtube.com/channel/${item.id}`,
      channelThumbnail: item.snippet.thumbnails.high.url,
      videoIds: [],
    }

    const dbClient = await createMongoDbClient({
      connectionString: SERVER_ENV.MONGODB_URI,
    })
    try {
      await dbClient.updateChannel({ channel })
    } finally {
      await dbClient.close()
    }

    revalidatePath('/')

    return NextResponse.json(channel)
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
