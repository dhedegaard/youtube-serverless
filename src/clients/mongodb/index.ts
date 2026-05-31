import { type Document, MongoClient } from 'mongodb'
import { revalidateTag, unstable_cache } from 'next/cache'
import { match } from 'ts-pattern'
import * as z from 'zod'
import { Channel } from '../../models/channel'
import { Video } from '../../models/video'
import { normalizeStoredVideo, type StoredVideo } from './normalize-stored-video'

const ChannelSchema = Channel as z.ZodType<Channel, Channel>
const VideoSchema = Video as z.ZodType<Video, Video>

export const createMongoDbClient = z
  .function({
    input: [z.object({ connectionString: z.string().min(1) })],
  })
  .implementAsync(async function createMongoDbClient({ connectionString }) {
    const databaseName = 'youtube-serverless'

    const client = new MongoClient(connectionString, { appName: 'youtube-serverless' })

    type Collection = 'channels' | 'videos'

    const getCollection = <C extends Document = never>(collectionName: Collection) => {
      const collection = client.db(databaseName).collection<C>(collectionName)

      return Promise.resolve({
        collection,
      })
    }

    const getChannels = z
      .function({
        output: z.array(ChannelSchema).readonly(),
      })
      .implementAsync(async function getChannels(): Promise<Channel[]> {
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
      })

    const updateChannel = z
      .function({
        input: [z.object({ channel: ChannelSchema })],
        output: z.void(),
      })
      .implementAsync(async function updateChannel({ channel }) {
        const { collection } = await getCollection<Channel>('channels')
        await collection.replaceOne({ channelId: channel.channelId }, channel, { upsert: true })
      })

    const latestVideosTag = 'latest-videos'

    const putLatestVideos = z
      .function({
        input: [z.object({ videos: z.array(VideoSchema).readonly() })],
        output: z.void(),
      })
      .implementAsync(async function putVideo({ videos }) {
        const { collection } = await getCollection<{ videos: Video[] }>('videos')
        await collection.updateOne({}, { $set: { videos: [...videos] } }, { upsert: true })
        revalidateTag(latestVideosTag, { expire: 0 })
      })

    const getLatestVideos = z
      .function({
        input: [z.object({ limit: z.int().positive(), types: z.literal(['all', 'long-videos']) })],
        output: z.array(VideoSchema).readonly(),
      })
      .implementAsync(async function getLatestVideos({ limit, types }): Promise<Video[]> {
        return await unstable_cache(
          async () => {
            const { collection } = await getCollection<{ videos: StoredVideo[] }>('videos')
            const { videos } = (await collection.findOne()) ?? {}
            return videos == null
              ? []
              : videos
                  .map(normalizeStoredVideo)
                  .filter((video) =>
                    match(types)
                      .with('all', () => true)
                      .with('long-videos', () => !video.isShort)
                      .exhaustive()
                  )
                  .slice(0, limit)
          },
          ['latest-videos', String(limit), types],
          { revalidate: 60 * 60, tags: [latestVideosTag] }
        )()
      })

    const close = z
      .function({
        output: z.void(),
      })
      .implementAsync(async function close() {
        await client.close()
      })

    await client.connect()

    return {
      getChannels,
      updateChannel,
      putLatestVideos,
      getLatestVideos,
      close,
    }
  })
