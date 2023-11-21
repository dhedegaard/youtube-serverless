import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createMongoDbClient } from '../../../clients/mongodb'
import { Channel, channelSchema } from '../../../models/channel'
import { isApiRequestAuthenticated } from '../../../utils/api-helpers'
import { SERVER_ENV } from '../../../utils/server-env'

export const revalidate = 0

const requestBodySchema = z.object({
  channels: z.array(channelSchema as z.ZodType<Channel>).min(1),
})

interface Result {
  statusCode: number
  message: string
}

export const POST = async (request: NextRequest): Promise<NextResponse<Result>> => {
  if (!isApiRequestAuthenticated(request)) {
    return NextResponse.json<Result>(
      {
        statusCode: 401,
        message: 'Missing or bad authorization header',
      },
      { status: 401 }
    )
  }

  const requestJson = await request.json()
  const requestBodyResult = requestBodySchema.safeParse(requestJson)
  if (!requestBodyResult.success) {
    return NextResponse.json<Result>(
      { statusCode: 400, message: 'Missing or bad request body' },
      { status: 400 }
    )
  }

  const { channels } = requestBodyResult.data

  const dbClient = await createMongoDbClient({
    connectionString: SERVER_ENV.MONGODB_URI,
  })
  try {
    // NOTE: This is slow an imperative, but we avoid extending the db-client interface any further.
    for (const channel of channels) {
      await dbClient.updateChannel({ channel })
    }
    return NextResponse.json<Result>(
      { statusCode: 200, message: `Saved/updated ${channels.length} channels` },
      { status: 200 }
    )
  } finally {
    await dbClient.close()
  }
}
