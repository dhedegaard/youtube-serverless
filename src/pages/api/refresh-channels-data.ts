import { NextApiRequest, NextApiResponse } from "next";
import { getChannels, updateChannel } from "../../data";
import { getChannelInfo } from "../../data/youtube";

/**
 * Refreshes the channel data on all the channels in the system.
 */
const refreshChannelsData = async (
  req: NextApiRequest,
  resp: NextApiResponse
) => {
  if (req.headers["authorization"] !== process.env.SECRET) {
    return resp.status(401).end("Not authorized");
  }

  const channels = await getChannels();
  for (const channel of channels) {
    const {
      items: [item],
    } = await getChannelInfo(channel.channelId.S);
    channel.channelTitle = { S: item.snippet.title };
    channel.playlist = { S: item.contentDetails.relatedPlaylists.uploads };
    channel.thumbnail = { S: item.snippet.thumbnails.high.url };
    channel.channelLink = {
      S: `https://www.youtube.com/channel/${channel.channelId.S}`,
    };
    await updateChannel(channel);
  }

  return resp.status(500).json({ channels });
};

export default refreshChannelsData;
