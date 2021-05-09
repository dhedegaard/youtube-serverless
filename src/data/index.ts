import { Credentials, DynamoDB } from "aws-sdk";

const TableName = process.env.AWS_DYNAMODB_TABLE;

const db = new DynamoDB({
  credentials: new Credentials({
    accessKeyId: process.env.AWS_DYNAMODB_ACCESS_KEY,
    secretAccessKey: process.env.AWS_DYNAMODB_SECRET_ACCESS_KEY,
  }),
  region: process.env.AWS_DYNAMODB_REGION,
});

interface Channel {
  PK: { S: string };
  SK: { S: string };
  channelId: { S: string };
  channelTitle: { S: string };
  playlist: { S: string };
  videoIds: { SS: string[] } | undefined;
  thumbnail: { S: string };
  channelThumbnail: { S: string };
  channelLink: { S: string };
}

export const getChannels = async (): Promise<Array<Channel>> => {
  const resp = await db
    .query({
      TableName,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": { S: "CHANNELS" } },
    })
    .promise();
  return resp.Items as any;
};

export const updateChannel = async (channel: Channel) => {
  await db.putItem({ Item: channel as any, TableName }).promise();
  return channel;
};

export const putVideos = async (video: {
  videoId: string;
  videoPublishedAt: string;
  channelId: string;
  channelTitle: string;
  thumbnail: string;
  title: string;
  channelThumbnail: string;
  channelLink: string;
}) => {
  await db
    .putItem({
      Item: {
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
      },
      TableName,
    })
    .promise();
};

export const getLatestVideos = async (): Promise<
  Array<{
    PK: { S: string };
    SK: { S: string };
    channelId: { S: string };
    videoId: { S: string };
    videoPublishedAt: { S: string };
    thumbnail: { S: string };
    channelTitle: { S: string };
    channelLink: { S: string };
    channelThumbnail: { S: string };
    title: { S: string };
  }>
> => {
  const resp = await db
    .query({
      TableName,
      IndexName: "PK_videoPublishedAt",
      ScanIndexForward: false,
      Limit: 52,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": { S: "VIDEOS" } },
    })
    .promise();
  return (resp.Items as any) ?? [];
};
