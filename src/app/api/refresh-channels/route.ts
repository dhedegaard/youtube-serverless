import { NextRequest, NextResponse } from "next/server";
import { getChannels, updateChannel } from "../../../data/dynamodb";
import { getChannelInfo } from "../../../data/youtube";

export const POST = async (request: NextRequest) => {
  if (request.headers.get("authorization") !== process.env.SECRET) {
    return NextResponse.json(
      { error: "Missing or bad authorization header" },
      { status: 401 }
    );
  }

  try {
    const channels = await getChannels();
    for (const channel of channels) {
      const {
        items: [item],
      } = await getChannelInfo(channel.channelId.S);
      channel.channelTitle = { S: item.snippet.title };
      channel.channelThumbnail = { S: item.snippet.thumbnails.high.url };
      channel.playlist = { S: item.contentDetails.relatedPlaylists.uploads };
      channel.thumbnail = { S: item.snippet.thumbnails.high.url };
      channel.channelLink = {
        S: `https://www.youtube.com/channel/${channel.channelId.S}`,
      };
      await updateChannel(channel);
    }

    return NextResponse.json({ channels });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
