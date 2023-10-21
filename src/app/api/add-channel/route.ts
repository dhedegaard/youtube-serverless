import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { updateChannel } from '../../../clients/dynamodb'
import { getChannelInfo } from '../../../clients/youtube'
import { isApiRequestAuthenticated } from '../../../utils/api-helpers'

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

    const channel = await updateChannel({
      PK: { S: 'CHANNELS' },
      SK: { S: `CHANNEL#${item.id}` },
      channelId: { S: item.id },
      channelTitle: { S: item.snippet.title },
      playlist: { S: item.contentDetails.relatedPlaylists.uploads },
      thumbnail: { S: item.snippet.thumbnails.high.url },
      channelLink: { S: `https://www.youtube.com/channel/${item.id}` },
      channelThumbnail: { S: item.snippet.thumbnails.high.url },
    })

    revalidatePath('/')

    return NextResponse.json(channel)
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
