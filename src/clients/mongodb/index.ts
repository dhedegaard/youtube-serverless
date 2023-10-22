import { Document, MongoClient, ObjectId } from 'mongodb'
import { z } from 'zod'
import { Channel } from '../../models/channel'
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
      collection: Collection
    ) => {
      const connection = await client.connect()
      return {
        connection,
        collection: connection.db(databaseName).collection<C>(collection),
      }
    }

    const getChannels = dbClientSchema.shape.getChannels.implement(
      async function getChannels(): Promise<Channel[]> {
        const { connection, collection } = await getConnectionAndCollection<Channel>('channels')
        try {
          const channels = await collection.find().toArray()
          const result = channels.map<Channel>(({ _id, ...channel }) => channel)
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
          collection.insertOne({
            ...channel,
            _id: new ObjectId(channel.channelId),
          })
        } finally {
          await connection.close(true)
        }
      }
    )

    const putVideo = dbClientSchema.shape.putVideo.implement(function putVideo() {
      throw new Error('TODO: Implement me!')
    })

    const getLatestVideos = dbClientSchema.shape.getLatestVideos.implement(
      function getLatestVideos() {
        throw new Error('TODO: Implement me!')
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
