import { NextRequest, NextResponse } from "next/server";
import {
  deleteOldVideos,
  getChannels,
  putVideo,
  updateChannel,
} from "../../../clients/dynamodb";
import {
  getChannelInfo,
  getVideosForChannelId,
} from "../../../clients/youtube";
import { SERVER_ENV } from "../../../utils/server-env";

export const POST = async (request: NextRequest) => {
  if (request.headers.get("authorization") !== SERVER_ENV.SECRET) {
    return NextResponse.json(
      { error: "Missing or bad authorization header" },
      { status: 401 }
    );
  }

  try {
    const channels = await getChannels();
    let newVideoCount = 0;
    const [deletedVideos] = await Promise.all([
      // deletedVideos
      deleteOldVideos({ numberToKeep: 100 }),
      // ...rest
      ...channels.map(async (channel) => {
        const info = await getChannelInfo(channel.channelId.S);
        channel.playlist = {
          S: info.items[0].contentDetails.relatedPlaylists.uploads,
        };
        const videos = await getVideosForChannelId(channel.playlist.S);
        const newVideos = videos.filter((e) =>
          channel.videoIds == null
            ? true
            : !channel.videoIds.SS.includes(e.contentDetails.videoId)
        );
        newVideoCount += newVideos.length;
        channel.videoIds = {
          SS: [
            ...new Set([
              ...(channel.videoIds?.SS ?? []),
              ...newVideos.map((e) => e.contentDetails.videoId),
            ]),
          ],
        };
        await Promise.all([
          updateChannel(channel),
          ...newVideos.map((video) =>
            putVideo({
              PK: { S: "VIDEOS" },
              SK: { S: `VIDEO#${video.contentDetails.videoId}` },
              channelId: { S: channel.channelId.S },
              thumbnail: { S: video.snippet.thumbnails.high.url },
              channelTitle: { S: video.snippet.channelTitle },
              title: { S: video.snippet.title },
              videoPublishedAt: { S: video.snippet.publishedAt },
              videoId: { S: video.contentDetails.videoId },
              channelThumbnail: { S: channel.thumbnail.S },
              channelLink: {
                S: `https://www.youtube.com/channel/${channel.channelId.S}`,
              },
            })
          ),
        ]);
      }),
    ]);
    return NextResponse.json({
      channelcount: channels.length,
      newVideoCount,
      deletedVideos,
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
