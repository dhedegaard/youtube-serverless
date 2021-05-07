import { NextApiRequest, NextApiResponse } from "next";
import { getChannels, putVideos, updateChannel } from "../../data";
import { getChannelInfo, getVideosForChannelId } from "../../data/youtube";

const fetchData = async (req: NextApiRequest, resp: NextApiResponse) => {
  if (req.headers["authorization"] !== process.env.SECRET) {
    return resp.status(401).end("Not authorized");
  }

  const channels = await getChannels();
  await Promise.all(
    channels.map(async (channel) => {
      const info = await getChannelInfo(channel.channelId.S);
      channel.playlist = {
        S: info.items[0].contentDetails.relatedPlaylists.uploads,
      };
      const videos = await getVideosForChannelId(channel.playlist.S);
      channel.videoIds = {
        SS: [
          ...new Set([
            ...(channel.videoIds?.SS ?? []),
            ...videos.map((e) => e.contentDetails.videoId),
          ]),
        ],
      };
      await Promise.all([
        updateChannel(channel),
        ...videos.map((video) =>
          putVideos({
            ...video.contentDetails,
            channelId: channel.channelId.S,
          })
        ),
      ]);
    })
  );
  return resp.status(501).end(`channelcount: ${channels.length}`);
};

export default fetchData;
