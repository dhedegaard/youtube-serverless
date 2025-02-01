import { Document, MongoClient } from 'mongodb'
import { unstable_cache, unstable_expireTag } from 'next/cache'
import { cache } from 'react'
import { z } from 'zod'
import { Channel } from '../../models/channel'
import { Video } from '../../models/video'
import { DbClient, dbClientSchema } from '../../schemas/db-client'

export const createMongoDbClient = cache(
  z
    .function()
    .args(z.object({ connectionString: z.string().min(1) }))
    .returns(z.promise(dbClientSchema as z.ZodType<DbClient>))
    .implement(async function createMongoDbClient({ connectionString }): Promise<DbClient> {
      const databaseName = 'youtube-serverless'

      // Maintain the same client across factory calls, as long as the connection string is the same.
      const client = new MongoClient(connectionString, { appName: 'youtube-serverless' })

      type Collection = 'channels' | 'videos'

      const getCollection = <C extends Document = never>(collectionName: Collection) => {
        const collection = client.db(databaseName).collection<C>(collectionName)

        return Promise.resolve({
          collection,
        })
      }

      const getChannels = dbClientSchema.shape.getChannels.implement(
        async function getChannels(): Promise<Channel[]> {
          const { collection } = await getCollection<Channel>('channels')
          const channelsWithId = await collection.find().toArray()
          return channelsWithId.map<Channel>(
            (channel) =>
              ({
                channelId: channel.channelId,
                channelTitle: channel.channelTitle,
                playlist: channel.playlist,
                thumbnail: channel.thumbnail,
                channelThumbnail: channel.channelThumbnail,
                channelLink: channel.channelLink,
              }) satisfies Channel
          )
        }
      )

      const updateChannel = dbClientSchema.shape.updateChannel.implement(
        async function updateChannel({ channel }) {
          const { collection } = await getCollection<Channel>('channels')
          await collection.replaceOne({ channelId: channel.channelId }, channel, { upsert: true })
        }
      )

      const latestVideosTag = 'latest-videos'

      const putLatestVideos = dbClientSchema.shape.putLatestVideos.implement(
        async function putVideo({ videos }) {
          const { collection } = await getCollection<{ videos: Video[] }>('videos')
          await collection.updateOne({}, { $set: { videos } }, { upsert: true })
          unstable_expireTag(latestVideosTag)
        }
      )

      const getLatestVideos = dbClientSchema.shape.getLatestVideos.implement(
        unstable_cache(
          async function getLatestVideos({ limit }): Promise<Video[]> {
            const { collection } = await getCollection<{ videos: Video[] }>('videos')
            const { videos } = (await collection.findOne()) ?? {}
            return videos == null
              ? []
              : videos.slice(0, limit).map<Video>(
                  (video) =>
                    ({
                      channelId: video.channelId,
                      videoId: video.videoId,
                      videoPublishedAt: video.videoPublishedAt,
                      thumbnail: video.thumbnail,
                      channelTitle: video.channelTitle,
                      channelThumbnail: video.channelThumbnail,
                      channelLink: video.channelLink,
                      title: video.title,
                      durationInSeconds: video.durationInSeconds,
                    }) satisfies Video
                )
          },
          ['latest-videos'],
          { revalidate: 60 * 60, tags: [latestVideosTag] }
        )
      )

      const deleteOldVideos = dbClientSchema.shape.deleteOldVideos.implement(
        async function deleteOldVideos(): Promise<number> {
          // NOTE: Nothing to cleanup for this backend.
          return Promise.resolve(0)
        }
      )

      const close: DbClient['close'] = () => client.close()

      await client.connect()

      return {
        getChannels,
        updateChannel,
        putLatestVideos,
        getLatestVideos,
        deleteOldVideos,
        close,
      } satisfies DbClient
    })
)
