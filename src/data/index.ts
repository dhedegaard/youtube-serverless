import { DynamoDB } from "@aws-sdk/client-dynamodb";
import Z, { TypeOf, object } from "zod";

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

const db = new DynamoDB({
  credentials: {
    accessKeyId: process.env.AWS_DYNAMODB_ACCESS_KEY,
    secretAccessKey: process.env.AWS_DYNAMODB_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_DYNAMODB_REGION,
});

const channelSchema = Z.object({
  PK: Z.object({ S: Z.string() }),
  SK: Z.object({ S: Z.string() }),
  channelId: Z.object({ S: Z.string() }),
  channelTitle: Z.object({ S: Z.string() }),
  playlist: Z.object({ S: Z.string() }),
  videoIds: Z.object({ SS: Z.array(Z.string()) }).optional(),
  thumbnail: Z.object({ S: Z.string() }),
  channelThumbnail: Z.object({ S: Z.string() }),
  channelLink: Z.object({ S: Z.string() }),
});
interface Channel extends TypeOf<typeof channelSchema> {}

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
interface Video extends TypeOf<typeof videoSchema> {}

export const getChannels = async () => {
  const resp = await db.query({
    TableName,
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: { ":pk": { S: "CHANNELS" } },
  });
  return await Z.array(channelSchema).parseAsync(resp.Items ?? []);
};

export const updateChannel = async (channel: Channel) => {
  const parsedChannel = await channelSchema.parseAsync(channel);
  await db.putItem({
    Item: parsedChannel,
    TableName,
  });
  return channel;
};

export const putVideos = async (video: {
  readonly videoId: string;
  readonly videoPublishedAt: string;
  readonly channelId: string;
  readonly channelTitle: string;
  readonly thumbnail: string;
  readonly title: string;
  readonly channelThumbnail: string;
  readonly channelLink: string;
}) => {
  const validatedItem = await videoSchema.parseAsync({
    PK: { S: "VIDEOS" },
    SK: { S: `VIDEO#${video.videoId}` },
    channelId: { S: video.channelId },
    videoId: { S: video.videoId },
    videoPublishedAt: { S: video.videoPublishedAt },
    thumbnail: { S: video.thumbnail },
    channelTitle: { S: video.channelTitle },
    channelThumbnail: { S: video.channelThumbnail },
    channelLink: { S: video.channelLink },
    title: { S: video.title },
  });
  await db.putItem({
    Item: validatedItem,
    TableName,
  });
  return validatedItem;
};

export const getLatestVideos = async () => {
  const resp = await db.query({
    TableName,
    IndexName: "PK_videoPublishedAt",
    ScanIndexForward: false,
    Limit: 50,
    KeyConditionExpression: "PK = :pk",
    ExpressionAttributeValues: { ":pk": { S: "VIDEOS" } },
  });
  return await Z.array(videoSchema).parseAsync(resp.Items ?? []);
};
