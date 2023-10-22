import { Document, MongoClient, ObjectId } from 'mongodb'
import { z } from 'zod'
import { Channel } from '../../models/channel'
import { Video } from '../../models/video'
import { DbClient, dbClientSchema } from '../../schemas/db-client'

export const createMongoDbClient = z
  .function()
  .args(z.object({ connectionString: z.string().min(1) }))
  .returns(dbClientSchema as z.ZodType<DbClient>)
  .implement(function createMongoDbClient({ connectionString }): DbClient {
    const databaseName = 'youtube-serverless'
    const client = new MongoClient(connectionString, { appName: 'youtube-serverless' })

    type Collection = 'channels' | 'videos'

    const getConnectionAndCollection = async <C extends Document = never>(
      collectionName: Collection
    ) => {
      const connection = await client.connect()
      const collection = connection.db(databaseName).collection<C>(collectionName)

      // Ensure specific indices exist.
      if (collectionName === 'videos') {
        await collection.createIndex({
          videoPublishedAt: -1,
        })
      }

      return {
        connection,
        collection,
      }
    }

    const getChannels = dbClientSchema.shape.getChannels.implement(
      async function getChannels(): Promise<Channel[]> {
        const { connection, collection } = await getConnectionAndCollection<Channel>('channels')
        try {
          const channelsWithId = await collection.find().toArray()
          const result = channelsWithId.map<Channel>(({ _id, ...channel }) => channel)
          return result
        } finally {
          await connection.close(true)
        }
      }
    )

    const updateChannel = dbClientSchema.shape.updateChannel.implement(
      async function updateChannel({ channel }) {
        const { connection, collection } = await getConnectionAndCollection<Channel>('channels')
        try {
          await collection.insertOne({
            ...channel,
            _id: new ObjectId(channel.channelId),
          })
        } finally {
          await connection.close(true)
        }
      }
    )

    const putVideo = dbClientSchema.shape.putVideo.implement(async function putVideo({ video }) {
      const { connection, collection } = await getConnectionAndCollection<Video>('videos')
      try {
        await collection.insertOne({
          ...video,
          _id: new ObjectId(video.videoId),
        })
      } finally {
        await connection.close(true)
      }
    })

    const getLatestVideos = dbClientSchema.shape.getLatestVideos.implement(
      async function getLatestVideos({ limit }): Promise<Video[]> {
        const { connection, collection } = await getConnectionAndCollection<Video>('videos')
        try {
          const videosWithId = await collection
            .find()
            .sort({ videoPublishedAt: -1 })
            .limit(limit)
            .toArray()
          return videosWithId.map(({ _id, ...video }) => video)
        } finally {
          await connection.close(true)
        }
      }
    )

    const deleteOldVideos = dbClientSchema.shape.deleteOldVideos.implement(
      function deleteOldVideos() {
        throw new Error('TODO: Implement me!')
      }
    )

    const result: DbClient = {
      getChannels,
      updateChannel,
      putVideo,
      getLatestVideos,
      deleteOldVideos,
    }
    return result
  })
