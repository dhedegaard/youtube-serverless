import { NextRequest, NextResponse } from 'next/server'
import * as z from 'zod/mini'
import { createMongoDbClient } from '../../../clients/mongodb'
import { Channel } from '../../../models/channel'
import { isApiRequestAuthenticated } from '../../../utils/api-helpers'
import { SERVER_ENV } from '../../../utils/server-env'

export const revalidate = 0

const Result = z.object({
  statusCode: z.int().check(z.positive()),
  channels: z.readonly(z.array(Channel as z.ZodMiniType<Channel, Channel>)),
  message: z.string().check(z.minLength(1)),
})
interface Result extends z.infer<typeof Result> {}

export const GET = async (request: NextRequest): Promise<NextResponse<Result>> => {
  const result = await handleRequest({ request })
  return NextResponse.json<Result>(result, { status: result.statusCode })
}

const handleRequest = z
  .function({
    input: [z.object({ request: z.unknown() as z.ZodMiniType<NextRequest, NextRequest> })],
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
      const channels = await dbClient.getChannels()
      return {
        statusCode: 200,
        channels,
        message: `Total number of channels: ${channels.length.toString()}`,
      } satisfies Result
    } finally {
      await dbClient.close()
    }
  })
