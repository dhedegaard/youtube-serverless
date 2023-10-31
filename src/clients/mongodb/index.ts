import { Document, MongoClient } from 'mongodb'
import { z } from 'zod'
import { Channel } from '../../models/channel'
import { Video } from '../../models/video'
import { DbClient, dbClientSchema } from '../../schemas/db-client'

export const createMongoDbClient = z
  .function()
  .args(z.object({ connectionString: z.string().min(1) }))
  .returns(z.promise(dbClientSchema as z.ZodType<DbClient>))
  .implement(async function createMongoDbClient({ connectionString }): Promise<DbClient> {
    const databaseName = 'youtube-serverless'

    // Maintain the same client across factory calls, as long as the connection string is the same.
    const client = new MongoClient(connectionString, { appName: 'youtube-serverless' })

    type Collection = 'channels' | 'videos'

    const getCollection = async <C extends Document = never>(collectionName: Collection) => {
      const collection = client.db(databaseName).collection<C>(collectionName)

      return {
        collection,
      }
    }

    const getChannels = dbClientSchema.shape.getChannels.implement(
      async function getChannels(): Promise<Channel[]> {
        const { collection } = await getCollection<Channel>('channels')
        const channelsWithId = await collection.find().toArray()
        const result = channelsWithId.map<Channel>(({ _id, ...channel }) => channel)
        return result
      }
    )

    const updateChannel = dbClientSchema.shape.updateChannel.implement(
      async function updateChannel({ channel }) {
        const { collection } = await getCollection<Channel>('channels')
        await collection.replaceOne(
          { channelId: channel.channelId },
          { ...channel },
          { upsert: true }
        )
      }
    )

    const putVideo = dbClientSchema.shape.putVideo.implement(async function putVideo({ video }) {
      const { collection } = await getCollection<Video>('videos')
      await collection.replaceOne({ videoId: video.videoId }, { ...video }, { upsert: true })
    })

    const getLatestVideos = dbClientSchema.shape.getLatestVideos.implement(
      async function getLatestVideos({ limit }): Promise<Video[]> {
        const { collection } = await getCollection<Video>('videos')
        const videosWithId = await collection
          .find()
          .sort({ videoPublishedAt: -1 })
          .limit(limit)
          .toArray()
        return videosWithId.map(({ _id, ...video }) => video)
      }
    )

    const deleteOldVideos = dbClientSchema.shape.deleteOldVideos.implement(
      async function deleteOldVideos({ numberToKeep }): Promise<number> {
        const videoIdsToDelete = await getLatestVideos({ limit: numberToKeep * 2 + 1 }).then(
          (videos) => videos.slice(numberToKeep + 1).map((video) => video.videoId)
        )

        if (videoIdsToDelete.length === 0) {
          return 0
        }

        const { collection } = await getCollection<Video>('videos')
        const result = await collection.deleteMany({ videoId: { $in: videoIdsToDelete } })
        return result.deletedCount
      }
    )

    const close: DbClient['close'] = () => client.close()

    await client.connect()

    const result: DbClient = {
      getChannels,
      updateChannel,
      putVideo,
      getLatestVideos,
      deleteOldVideos,
      close,
    }
    return result
  })
