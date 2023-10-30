import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createMongoDbClient } from '../../../clients/mongodb'
import { Channel, channelSchema } from '../../../models/channel'
import { isApiRequestAuthenticated } from '../../../utils/api-helpers'
import { SERVER_ENV } from '../../../utils/server-env'

const requestBodySchema = z.object({
  channels: z.array(channelSchema as z.ZodType<Channel>).min(1),
})

export const POST = async (request: NextRequest) => {
  if (!isApiRequestAuthenticated(request)) {
    return { status: 401, json: { error: 'Missing or bad authorization header' } }
  }

  const requestJson = await request.json()
  const requestBodyResult = requestBodySchema.safeParse(requestJson)
  if (!requestBodyResult.success) {
    return { status: 400, json: { error: 'Missing or bad request body' } }
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
    return new Response(`Saved/updated ${channels.length} channels`, { status: 200 })
  } finally {
    await dbClient.close()
  }
}
