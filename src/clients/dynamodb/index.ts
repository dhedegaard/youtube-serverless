import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { z } from "zod";

const TableName = process.env.AWS_DYNAMODB_TABLE;
if (TableName == null) {
  throw new Error("Missing AWS_DYNAMODB_TABLE");
}
if (process.env.AWS_DYNAMODB_ACCESS_KEY == null) {
  throw new Error("Missing AWS_DYNAMODB_ACCESS_KEY");
}
if (process.env.AWS_DYNAMODB_SECRET_ACCESS_KEY == null) {
  throw new Error("Missing AWS_DYNAMODB_SECRET_ACCESS_KEY");
}
if (process.env.AWS_DYNAMODB_REGION == null) {
  throw new Error("Missing AWS_DYNAMODB_REGION");
}

const db = new DynamoDBClient({
  credentials: {
    accessKeyId: process.env.AWS_DYNAMODB_ACCESS_KEY,
    secretAccessKey: process.env.AWS_DYNAMODB_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_DYNAMODB_REGION,
});

const channelSchema = z.object({
  PK: z.object({ S: z.literal("CHANNELS") }),
  SK: z.object({
    S: z.union([
      z.string().startsWith("CHANNEL#"),
      // NOTE: Here due to some old data having a bad SK and me being lazy.
      z.string().startsWith("CHANNELID#"),
    ]),
  }),
  channelId: z.object({ S: z.string() }),
  channelTitle: z.object({ S: z.string() }),
  playlist: z.object({ S: z.string() }),
  videoIds: z.object({ SS: z.array(z.string()) }).optional(),
  thumbnail: z.object({ S: z.string() }),
  channelThumbnail: z.object({ S: z.string() }),
  channelLink: z.object({ S: z.string() }),
});
interface Channel extends z.TypeOf<typeof channelSchema> {}

const videoSchema = z.object({
  PK: z.object({ S: z.literal("VIDEOS") }),
  SK: z.object({ S: z.string().startsWith("VIDEO#") }),
  channelId: z.object({ S: z.string() }),
  videoId: z.object({ S: z.string() }),
  videoPublishedAt: z.object({ S: z.string() }),
  thumbnail: z.object({ S: z.string() }),
  channelTitle: z.object({ S: z.string() }),
  channelThumbnail: z.object({ S: z.string() }),
  channelLink: z.object({ S: z.string() }),
  title: z.object({ S: z.string() }),
});
interface Video extends z.TypeOf<typeof videoSchema> {}

export const getChannels = async () => {
  const resp = await db.send(
    new QueryCommand({
      TableName,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": { S: "CHANNELS" } },
    })
  );
  return await z.array(channelSchema).parseAsync(resp.Items ?? []);
};

export const updateChannel = async (channel: Channel) => {
  const parsedChannel = await channelSchema.parseAsync(channel);
  await db.send(
    new PutItemCommand({
      Item: parsedChannel,
      TableName,
    })
  );
  return channel;
};

export const putVideos = async (video: Video) => {
  const validatedItem = await videoSchema.parseAsync(video);
  await db.send(
    new PutItemCommand({
      Item: validatedItem,
      TableName,
    })
  );
  return validatedItem;
};

export const getLatestVideos = async () => {
  const resp = await db.send(
    new QueryCommand({
      TableName,
      IndexName: "PK_videoPublishedAt",
      ScanIndexForward: false,
      Limit: 50,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": { S: "VIDEOS" } },
    })
  );
  return await z.array(videoSchema).parseAsync(resp.Items ?? []);
};
