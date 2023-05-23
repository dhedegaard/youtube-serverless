import { NextRequest, NextResponse } from "next/server";
import { getChannels, putVideos, updateChannel } from "../../../data/dynamodb";
import { getChannelInfo, getVideosForChannelId } from "../../../data/youtube";

export const POST = async (request: NextRequest) => {
  if (request.headers.get("authorization") !== process.env.SECRET) {
    return NextResponse.json(
      { error: "Missing or bad authorization header" },
      { status: 401 }
    );
  }

  try {
    const channels = await getChannels();
    let newVideoCount = 0;
    await Promise.all(
      channels.map(async (channel) => {
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
            putVideos({
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
      })
    );
    return NextResponse.json({ channelcount: channels.length, newVideoCount });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};