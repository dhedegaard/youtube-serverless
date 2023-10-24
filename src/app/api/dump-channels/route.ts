import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Channel, channelSchema } from '../../../models/channel'
import { isApiRequestAuthenticated } from '../../../utils/api-helpers'
import { SERVER_ENV } from '../../../utils/server-env'
import { createMongoDbClient } from '../../../clients/mongodb'

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

    const dbClient = createMongoDbClient({
      connectionString: SERVER_ENV.MONGODB_URI,
    })

    const channels = await dbClient.getChannels({}).then((channels) =>
      channels.map((channel) => {
        const result: Channel = {
          id: channel.id,
          channelId: channel.channelId,
          channelTitle: channel.channelTitle,
          playlist: channel.playlist,
          thumbnail: channel.thumbnail,
          channelThumbnail: channel.channelThumbnail,
          channelLink: channel.channelLink,
          // NOTE: We emit emoty videoIds here, as we do not dump videos we expect the receiver system (mostly likely
          // our selves), to just import chennals and have no videos.
          videoIds: [],
        }
        return result
      })
    )
    const result: Result = {
      statusCode: 200,
      channels,
      message: `Total number of channels: ${channels.length}`,
    }
    return result
  })
