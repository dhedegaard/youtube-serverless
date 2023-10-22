import {
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb'
import { z } from 'zod'
import { Channel, channelSchema } from '../../models/channel'
import { Video, videoSchema } from '../../models/video'
import { SERVER_ENV } from '../../utils/server-env'

const createDynamoDbClientArgsSchema = z.strictObject({
  tableName: z.string().min(1),
  accessKeyId: z.string().min(1),
  secretAccessKey: z.string().min(1),
  region: z.string().min(1),
})
interface CreateDynamoDbClientArgs extends z.TypeOf<typeof createDynamoDbClientArgsSchema> {}

export const innerCreateDynamoDbClient = z
  .function()
  .args(createDynamoDbClientArgsSchema)
  .implement(function createDynamoDbClient({ tableName, accessKeyId, secretAccessKey, region }) {
    const TableName = SERVER_ENV.AWS_DYNAMODB_TABLE

    const db = new DynamoDBClient({
      credentials: {
        accessKeyId: SERVER_ENV.AWS_DYNAMODB_ACCESS_KEY,
        secretAccessKey: SERVER_ENV.AWS_DYNAMODB_SECRET_ACCESS_KEY,
      },
      region: SERVER_ENV.AWS_DYNAMODB_REGION,
    })

    const dynamoDbChannelSchema = z.strictObject({
      PK: z.object({ S: z.literal('CHANNELS') }),
      SK: z.object({
        S: z.union([
          z.string().startsWith('CHANNEL#') as z.ZodType<`CHANNEL#${string}`>,
          // NOTE: Here due to some old data having a bad SK and me being lazy.
          z.string().startsWith('CHANNELID#') as z.ZodType<`CHANNELID#${string}`>,
        ]),
      }),
      channelId: z.object({ S: z.string() }),
      channelTitle: z.object({ S: z.string() }),
      playlist: z.object({ S: z.string() }),
      videoIds: z.object({ SS: z.array(z.string()).min(1) }).optional(),
      thumbnail: z.object({ S: z.string() }),
      channelThumbnail: z.object({ S: z.string() }),
      channelLink: z.object({ S: z.string() }),
    })

    interface DynamoDbChannel extends z.TypeOf<typeof dynamoDbChannelSchema> {}

    const dynamoDbVideoSchema = z.strictObject({
      PK: z.object({ S: z.literal('VIDEOS') }),
      SK: z.object({
        S: z.string().startsWith('VIDEO#') as z.ZodType<`VIDEO#${string}`>,
      }),
      channelId: z.object({ S: z.string() }),
      videoId: z.object({ S: z.string() }),
      videoPublishedAt: z.object({ S: z.string() }),
      thumbnail: z.object({ S: z.string() }),
      channelTitle: z.object({ S: z.string() }),
      channelThumbnail: z.object({ S: z.string() }),
      channelLink: z.object({ S: z.string() }),
      title: z.object({ S: z.string() }),
    })
    interface DynamoDbVideo extends z.TypeOf<typeof dynamoDbVideoSchema> {}

    const getChannels = z
      .function()
      .returns(z.promise(z.array(channelSchema as z.ZodType<Channel>)))
      .implement(async function (): Promise<Channel[]> {
        const resp = await db.send(
          new QueryCommand({
            TableName,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: { ':pk': { S: 'CHANNELS' } },
          })
        )
        const dynamoChannels = await z.array(dynamoDbChannelSchema).parseAsync(resp.Items ?? [])
        return dynamoChannels.map((channel): Channel => {
          const result: Channel = {
            id: channel.SK.S,
            channelId: channel.channelId.S,
            channelTitle: channel.channelTitle.S,
            playlist: channel.playlist.S,
            thumbnail: channel.thumbnail.S,
            channelThumbnail: channel.channelThumbnail.S,
            channelLink: channel.channelLink.S,
            videoIds: channel.videoIds?.SS ?? [],
          }
          return result
        })
      })

    const updateChannel = z
      .function()
      .args(z.object({ channel: channelSchema as z.ZodType<Channel> }))
      .implement(async function updateChannel({ channel }): Promise<void> {
        const dynamoChannel: DynamoDbChannel = {
          PK: { S: 'CHANNELS' },
          SK: { S: `CHANNEL#${channel.channelId}` },
          channelId: { S: channel.channelId },
          channelTitle: { S: channel.channelTitle },
          playlist: { S: channel.playlist },
          thumbnail: { S: channel.thumbnail },
          channelThumbnail: { S: channel.channelThumbnail },
          channelLink: { S: channel.channelLink },
          videoIds: channel.videoIds.length > 0 ? { SS: channel.videoIds } : undefined,
        }
        const parsedChannel = await dynamoDbChannelSchema.parseAsync(dynamoChannel)
        await db.send(
          new PutItemCommand({
            Item: parsedChannel,
            TableName,
          })
        )
      })

    const putVideo = z
      .function()
      .args(z.object({ video: videoSchema as z.ZodType<Video> }))
      .implement(async function putVideo({ video }): Promise<void> {
        const dynamoVideoInput: DynamoDbVideo = {
          PK: { S: 'VIDEOS' },
          SK: { S: `VIDEO#${video.videoId}` },
          videoId: { S: video.videoId },
          channelId: { S: video.channelId },
          videoPublishedAt: { S: video.videoPublishedAt },
          thumbnail: { S: video.thumbnail },
          channelTitle: { S: video.channelTitle },
          channelThumbnail: { S: video.channelThumbnail },
          channelLink: { S: video.channelLink },
          title: { S: video.title },
        }
        const validatedItem = await dynamoDbVideoSchema.parseAsync(dynamoVideoInput)
        await db.send(
          new PutItemCommand({
            Item: validatedItem,
            TableName,
          })
        )
      })

    const getLatestVideos = z
      .function()
      .returns(z.promise(z.array(videoSchema as z.ZodType<Video>)))
      .implement(async function getLatestVideos(): Promise<Video[]> {
        const resp = await db.send(
          new QueryCommand({
            TableName,
            IndexName: 'PK_videoPublishedAt',
            ScanIndexForward: false,
            Limit: 50,
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: { ':pk': { S: 'VIDEOS' } },
          })
        )
        const dynamoDbVideos = await z.array(dynamoDbVideoSchema).parseAsync(resp.Items ?? [])
        return dynamoDbVideos.map((video): Video => {
          const result: Video = {
            id: video.SK.S,
            channelId: video.channelId.S,
            videoId: video.videoId.S,
            videoPublishedAt: video.videoPublishedAt.S,
            thumbnail: video.thumbnail.S,
            channelTitle: video.channelTitle.S,
            channelThumbnail: video.channelThumbnail.S,
            channelLink: video.channelLink.S,
            title: video.title.S,
          }
          return result
        })
      })

    const deleteOldVideos = z
      .function()
      .args(z.object({ numberToKeep: z.number().int().positive() }))
      .returns(z.promise(z.number().int().nonnegative()))
      .implement(async function deleteOldVideos({ numberToKeep }): Promise<number> {
        const oldVideos = await db
          .send(
            new QueryCommand({
              TableName,
              IndexName: 'PK_videoPublishedAt',
              ScanIndexForward: true,
              Limit: numberToKeep * 2 + 1,
              KeyConditionExpression: 'PK = :pk',
              ExpressionAttributeValues: { ':pk': { S: 'VIDEOS' } },
            })
          )
          .then((resp) =>
            z
              .array(
                z.object({
                  SK: z.object({
                    S: z.string().startsWith('VIDEO#') as z.ZodType<`VIDEO#${string}`>,
                  }),
                  PK: z.object({ S: z.literal('VIDEOS') }),
                  videoPublishedAt: z.object({ S: z.string().datetime() }),
                })
              )
              .parseAsync(resp.Items)
          )

        // Check that there are more videos to delete than there is to keep.
        if (oldVideos.length > numberToKeep + 1) {
          const videosToDelete = oldVideos.slice(0, -numberToKeep)
          return await Promise.all(
            videosToDelete.map((item) =>
              db.send(
                new DeleteItemCommand({
                  TableName,
                  Key: {
                    PK: item.PK,
                    SK: item.SK,
                  },
                })
              )
            )
          ).then((items) => items.length)
        }

        return 0
      })

    return {
      deleteOldVideos,
      getLatestVideos,
      putVideo,
      updateChannel,
      getChannels,
    }
  })

export interface DynamoDbClient extends ReturnType<typeof innerCreateDynamoDbClient> {}

export const createDynamoDbClient = (args: CreateDynamoDbClientArgs): DynamoDbClient =>
  innerCreateDynamoDbClient(args)
