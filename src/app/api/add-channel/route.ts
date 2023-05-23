import { NextRequest, NextResponse } from "next/server";
import { updateChannel } from "../../../data";
import { getChannelInfo } from "../../../data/youtube";

export const POST = async (request: NextRequest) => {
  if (request.headers.get("authorization") !== process.env.SECRET) {
    return NextResponse.json(
      { error: "Missing or bad authorization header" },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const channelId = url.searchParams.get("channelId");
  if (typeof channelId !== "string" || channelId.length < 1) {
    return NextResponse.json(
      { error: "Missing channelId query param" },
      { status: 400 }
    );
  }

  try {
    const {
      items: [item],
    } = await getChannelInfo(channelId);
    if (item == null) {
      return NextResponse.json(
        { error: `Channel with id not found: ${channelId}` },
        { status: 404 }
      );
    }

    const channel = await updateChannel({
      PK: { S: "CHANNELS" },
      SK: { S: `CHANNEL#${item.id}` },
      channelId: { S: item.id },
      channelTitle: { S: item.snippet.title },
      playlist: { S: item.contentDetails.relatedPlaylists.uploads },
      thumbnail: { S: item.snippet.thumbnails.high.url },
      channelLink: { S: `https://www.youtube.com/channel/${item.id}` },
      channelThumbnail: { S: item.snippet.thumbnails.high.url },
    });

    return NextResponse.json(channel);
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: "Some unknown error happened, check the logs" },
      { status: 500 }
    );
  }
};
