import { type Document, MongoClient } from 'mongodb'
import { unstable_cache, unstable_expireTag } from 'next/cache'
import { cache } from 'react'
import { z } from 'zod'
import type { Channel } from '../../models/channel'
import type { Video } from '../../models/video'
import { DbClient } from '../../schemas/db-client'

export const createMongoDbClient = cache(
  z
    .function({
      input: [z.object({ connectionString: z.string().min(1) })],
      output: z.promise(DbClient as unknown as z.ZodType<DbClient, DbClient>),
    })
    .implementAsync(async function createMongoDbClient({ connectionString }) {
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

      const getChannels = DbClient.shape.getChannels.implementAsync(
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

      const updateChannel = DbClient.shape.updateChannel.implementAsync(
        async function updateChannel({ channel }) {
          const { collection } = await getCollection<Channel>('channels')
          await collection.replaceOne({ channelId: channel.channelId }, channel, { upsert: true })
        }
      )

      const latestVideosTag = 'latest-videos'

      const putLatestVideos = DbClient.shape.putLatestVideos.implementAsync(
        async function putVideo({ videos }) {
          const { collection } = await getCollection<{ videos: Video[] }>('videos')
          await collection.updateOne({}, { $set: { videos: [...videos] } }, { upsert: true })
          unstable_expireTag(latestVideosTag)
        }
      )

      const getLatestVideos = DbClient.shape.getLatestVideos.implementAsync(
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

      const deleteOldVideos = DbClient.shape.deleteOldVideos.implementAsync(
        async function deleteOldVideos(): Promise<number> {
          // NOTE: Nothing to cleanup for this backend.
          return Promise.resolve(0)
        }
      )

      const close: DbClient['close'] = DbClient.shape.close.implementAsync(async function close() {
        await client.close()
      })

      await client.connect()

      return await DbClient.parseAsync({
        getChannels,
        updateChannel,
        putLatestVideos,
        getLatestVideos,
        deleteOldVideos,
        close,
      } satisfies DbClient)
    })
)
