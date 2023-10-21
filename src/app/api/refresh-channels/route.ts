import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getChannels, updateChannel } from "../../../clients/dynamodb";
import { getChannelInfo } from "../../../clients/youtube";
import { isApiRequestAuthenticated } from "../../../utils/api-helpers";

export const POST = async (request: NextRequest) => {
  if (!isApiRequestAuthenticated(request)) {
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

    revalidatePath("/");

    return NextResponse.json({ channels });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
