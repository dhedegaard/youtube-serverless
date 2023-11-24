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
        const result = channelsWithId.map<Channel>((channel) => {
          const result: Channel = {
            channelId: channel.channelId,
            channelTitle: channel.channelTitle,
            playlist: channel.playlist,
            thumbnail: channel.thumbnail,
            channelThumbnail: channel.channelThumbnail,
            channelLink: channel.channelLink,
            videoIds: channel.videoIds,
          }
          return result
        })
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

    const putLatestVideos = dbClientSchema.shape.putLatestVideos.implement(async function putVideo({
      videos,
    }) {
      const { collection } = await getCollection<{ videos: Video[] }>('videos')
      await collection.updateOne({}, { $set: { videos } }, { upsert: true })
    })

    const getLatestVideos = dbClientSchema.shape.getLatestVideos.implement(
      async function getLatestVideos({ limit }): Promise<Video[]> {
        const { collection } = await getCollection<{ videos: Video[] }>('videos')
        const { videos } = (await collection.findOne()) ?? {}
        return videos == null
          ? []
          : videos.slice(0, limit).map((video) => {
              const result: Video = {
                channelId: video.channelId,
                videoId: video.videoId,
                videoPublishedAt: video.videoPublishedAt,
                thumbnail: video.thumbnail,
                channelTitle: video.channelTitle,
                channelThumbnail: video.channelThumbnail,
                channelLink: video.channelLink,
                title: video.title,
              }
              return result
            })
      }
    )

    const deleteOldVideos = dbClientSchema.shape.deleteOldVideos.implement(
      async function deleteOldVideos({ numberToKeep }): Promise<number> {
        // NOTE: Nothing to cleanup for this backend.
        return Promise.resolve(0)
      }
    )

    const close: DbClient['close'] = () => client.close()

    await client.connect()

    const result: DbClient = {
      getChannels,
      updateChannel,
      putLatestVideos,
      getLatestVideos,
      deleteOldVideos,
      close,
    }
    return result
  })
