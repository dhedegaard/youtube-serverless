import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createMongoDbClient } from '../../../clients/mongodb'
import { Channel, channelSchema } from '../../../models/channel'
import { isApiRequestAuthenticated } from '../../../utils/api-helpers'
import { SERVER_ENV } from '../../../utils/server-env'

export const revalidate = 0

const resultSchema = z.object({
  statusCode: z.number().int().positive(),
  channels: z.array(channelSchema as z.ZodType<Channel>),
  message: z.string().min(1),
})
interface Result extends z.TypeOf<typeof resultSchema> {}

export const GET = async (request: NextRequest): Promise<NextResponse<Result>> => {
  const result = await handleRequest({ request })
  return NextResponse.json<Result>(result, { status: result.statusCode })
}

const handleRequest = z
  .function()
  .args(z.object({ request: z.instanceof(Request) as z.ZodType<NextRequest> }))
  .returns(z.promise(resultSchema))
  .implement(async function handleRequest({ request }): Promise<Result> {
    if (!isApiRequestAuthenticated(request)) {
      const result: Result = {
        channels: [],
        statusCode: 401,
        message: 'Missing or bad authorization header',
      }
      return result
    }

    const dbClient = await createMongoDbClient({
      connectionString: SERVER_ENV.MONGODB_URI,
    })

    try {
      const channels = await dbClient.getChannels({}).then((channels) =>
        channels.map((channel) => {
          const result: Channel = {
            channelId: channel.channelId,
            channelTitle: channel.channelTitle,
            playlist: channel.playlist,
            thumbnail: channel.thumbnail,
            channelThumbnail: channel.channelThumbnail,
            channelLink: channel.channelLink,
          }
          return result
        })
      )
      const result: Result = {
        statusCode: 200,
        channels,
        message: `Total number of channels: ${channels.length.toString()}`,
      }
      return result
    } finally {
      await dbClient.close()
    }
  })
