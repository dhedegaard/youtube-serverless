'use server'

import { z } from 'zod'
import { createMongoDbClient } from '../clients/mongodb'
import { Video } from '../models/video'
import { SERVER_ENV } from '../utils/server-env'

const GetVideosResult = z.object({
  videos: z.array(Video as z.ZodType<Video>).readonly(),
})
export interface GetVideosResult extends z.infer<typeof GetVideosResult> {}
const _getVideos = z
  .function()
  .returns(z.promise(GetVideosResult as z.ZodType<GetVideosResult>))
  .implement(async function getVideos(): Promise<GetVideosResult> {
    const dbClient = await createMongoDbClient({
      connectionString: SERVER_ENV.MONGODB_URI,
    })

    try {
      return {
        videos: await dbClient.getLatestVideos({ limit: 60 }),
      } satisfies GetVideosResult
    } finally {
      await dbClient.close()
    }
  })
export async function getVideos(): Promise<GetVideosResult> {
  try {
    return await _getVideos()
  } catch (error: unknown) {
    console.error(error)
    throw new Error('Unknown error')
  }
}
