'use server'

import { z } from 'zod'
import { createMongoDbClient } from '../clients/mongodb'
import { SERVER_ENV } from '../utils/server-env'
import { Video, videoSchema } from '../models/video'

const getVideosResultSchema = z.object({
  videos: z.array(videoSchema as z.ZodType<Video>).readonly(),
})
export interface GetVideosResult extends z.infer<typeof getVideosResultSchema> {}
const _getVideos = z
  .function()
  .returns(z.promise(getVideosResultSchema as z.ZodType<GetVideosResult>))
  .implement(async function getVideos(): Promise<GetVideosResult> {
    const dbClient = await createMongoDbClient({
      connectionString: SERVER_ENV.MONGODB_URI,
    })

    try {
      return {
        videos: await dbClient.getLatestVideos({ limit: 60 }),
      }
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
