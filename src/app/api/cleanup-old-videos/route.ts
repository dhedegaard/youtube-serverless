import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { createMongoDbClient } from '../../../clients/mongodb'
import { isApiRequestAuthenticated } from '../../../utils/api-helpers'
import { SERVER_ENV } from '../../../utils/server-env'

export const POST = async (request: NextRequest) => {
  if (!isApiRequestAuthenticated(request)) {
    return NextResponse.json({ error: 'Missing or bad authorization header' }, { status: 401 })
  }

  const dbClient = await createMongoDbClient({
    connectionString: SERVER_ENV.MONGODB_URI,
  })

  try {
    const deletedCount = await dbClient.deleteOldVideos({ numberToKeep: 50 })

    revalidatePath('/')

    return NextResponse.json({
      deletedCount,
    })
  } finally {
    await dbClient.close()
  }
}
