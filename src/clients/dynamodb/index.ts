import {
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import Z from "zod";

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

const channelSchema = Z.object({
  PK: Z.object({ S: Z.literal("CHANNELS") }),
  SK: Z.object({
    S: Z.union([
      Z.string().startsWith("CHANNEL#"),
      // NOTE: Here due to some old data having a bad SK and me being lazy.
      Z.string().startsWith("CHANNELID#"),
    ]),
  }),
  channelId: Z.object({ S: Z.string() }),
  channelTitle: Z.object({ S: Z.string() }),
  playlist: Z.object({ S: Z.string() }),
  videoIds: Z.object({ SS: Z.array(Z.string()) }).optional(),
  thumbnail: Z.object({ S: Z.string() }),
  channelThumbnail: Z.object({ S: Z.string() }),
  channelLink: Z.object({ S: Z.string() }),
});
interface Channel extends Z.TypeOf<typeof channelSchema> {}

const videoSchema = Z.object({
  PK: Z.object({ S: Z.literal("VIDEOS") }),
  SK: Z.object({ S: Z.string().startsWith("VIDEO#") }),
  channelId: Z.object({ S: Z.string() }),
  videoId: Z.object({ S: Z.string() }),
  videoPublishedAt: Z.object({ S: Z.string() }),
  thumbnail: Z.object({ S: Z.string() }),
  channelTitle: Z.object({ S: Z.string() }),
  channelThumbnail: Z.object({ S: Z.string() }),
  channelLink: Z.object({ S: Z.string() }),
  title: Z.object({ S: Z.string() }),
});
interface Video extends Z.TypeOf<typeof videoSchema> {}

export const getChannels = async () => {
  const resp = await db.send(
    new QueryCommand({
      TableName,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": { S: "CHANNELS" } },
    })
  );
  return await Z.array(channelSchema).parseAsync(resp.Items ?? []);
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
  return await Z.array(videoSchema).parseAsync(resp.Items ?? []);
};
