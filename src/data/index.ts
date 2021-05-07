import { Credentials, DynamoDB } from "aws-sdk";

const TableName = process.env.AWS_DYNAMODB_TABLE;

const db = new DynamoDB({
  credentials: new Credentials({
    accessKeyId: process.env.AWS_DYNAMODB_ACCESS_KEY,
    secretAccessKey: process.env.AWS_DYNAMODB_SECRET_ACCESS_KEY,
  }),
  region: process.env.AWS_DYNAMODB_REGION,
});

export const getData = async () => {
  const resp = await db.getItem({ TableName, Key: {} }).promise();
};

interface Channel {
  PK: { S: string };
  SK: { S: string };
  channelId: { S: string };
  channelTitle: { S: string };
  playlist: { S: string };
  videoIds: { SS: string[] } | undefined;
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
  const asdfd = await db.putItem({ Item: channel as any, TableName }).promise();
  return channel;
};

export const putVideos = async (video: {
  videoId: string;
  videoPublishedAt: string;
  channelId: string;
}) => {
  await db
    .putItem({
      Item: {
        PK: { S: "VIDEOS" },
        SK: { S: `VIDEO#${video.videoId}` },
        videoId: { S: video.videoId },
        videoPublishedAt: { S: video.videoPublishedAt },
        channelId: { S: video.channelId },
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
  }>
> => {
  const resp = await db
    .query({
      TableName,
      IndexName: "PK_videoPublishedAt",
      ScanIndexForward: false,
      Limit: 50,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": { S: "VIDEOS" } },
    })
    .promise();
  return (resp.Items as any) ?? [];
};
