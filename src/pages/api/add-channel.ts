import { NextApiRequest, NextApiResponse } from "next";
import { updateChannel } from "../../data";
import { getChannelInfo } from "../../data/youtube";

const addChannel = async (req: NextApiRequest, resp: NextApiResponse) => {
  if (req.headers["authorization"] !== process.env.SECRET) {
    return resp.status(401).end("Not authorized");
  }

  const { channelId } = req.query;
  if (typeof channelId !== "string" || channelId.length < 1) {
    return resp.status(400).send("Missing channelId query param");
  }

  const {
    items: [item],
  } = await getChannelInfo(channelId);
  const channel = await updateChannel({
    PK: { S: "CHANNELS" },
    SK: { S: `CHANNEL#${item.id}` },
    channelId: { S: item.id },
    channelTitle: { S: item.snippet.title },
    playlist: { S: item.contentDetails.relatedPlaylists.uploads },
    videoIds: { SS: [] },
    thumbnail: { S: item.snippet.thumbnails.high.url },
    channelLink: { S: `https://www.youtube.com/channel/${item.id}` },
    channelThumbnail: { S: item.snippet.thumbnails.high.url },
  });

  return resp.status(201).json(channel);
};

export default addChannel;
