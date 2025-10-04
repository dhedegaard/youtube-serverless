import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createMongoDbClient } from '../../../clients/mongodb'
import { Channel } from '../../../models/channel'
import { isApiRequestAuthenticated } from '../../../utils/api-helpers'
import { SERVER_ENV } from '../../../utils/server-env'

export const revalidate = 0

const Result = z.object({
  statusCode: z.number().int().positive(),
  channels: z.array(Channel as z.ZodType<Channel, Channel>),
  message: z.string().min(1),
})
interface Result extends z.infer<typeof Result> {}

export const GET = async (request: NextRequest): Promise<NextResponse<Result>> => {
  const result = await handleRequest({ request })
  return NextResponse.json<Result>(result, { status: result.statusCode })
}

const handleRequest = z
  .function({
    input: [z.object({ request: z.unknown() as z.ZodType<NextRequest, NextRequest> })],
    output: z.promise(Result),
  })
  .implementAsync(async function handleRequest({ request }): Promise<Result> {
    if (!isApiRequestAuthenticated(request)) {
      return {
        channels: [],
        statusCode: 401,
        message: 'Missing or bad authorization header',
      } satisfies Result
    }

    const dbClient = await createMongoDbClient({
      connectionString: SERVER_ENV.MONGODB_URI,
    })

    try {
      const channels = await dbClient.getChannels().then((channels) =>
        channels.map<Channel>(
          (channel) =>
            ({
              channelId: channel.channelId,
              channelTitle: channel.channelTitle,
              playlist: channel.playlist,
              thumbnail: channel.thumbnail,
              channelThumbnail: channel.channelThumbnail,
              channelLink: channel.channelLink,
            }) satisfies Channel
        )
      )
      return {
        statusCode: 200,
        channels,
        message: `Total number of channels: ${channels.length.toString()}`,
      } satisfies Result
    } finally {
      await dbClient.close()
    }
  })
