import { NextApiRequest, NextApiResponse } from "next";
import { getChannels, putVideos, updateChannel } from "../../data";
import { getChannelInfo, getVideosForChannelId } from "../../data/youtube";

const fetchData = async (req: NextApiRequest, resp: NextApiResponse) => {
  if (req.headers["authorization"] !== process.env.SECRET) {
    return resp.status(401).end("Not authorized");
  }

  const channels = await getChannels();
  let newVideoCount = 0;
  await Promise.all(
    channels.map(async (channel) => {
      const info = await getChannelInfo(channel.channelId.S);
      channel.playlist = {
        S: info.items[0].contentDetails.relatedPlaylists.uploads,
      };
      const videos = await getVideosForChannelId(channel.playlist.S);
      const newVideos = videos.filter(
        (e) => !channel.videoIds.SS.includes(e.contentDetails.videoId)
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
      await Promise.all<any>([
        updateChannel(channel),
        ...newVideos.map((video) =>
          putVideos({
            channelId: channel.channelId.S,
            thumbnail: video.snippet.thumbnails.high.url,
            channelTitle: video.snippet.channelTitle,
            title: video.snippet.title,
            videoPublishedAt: video.snippet.publishedAt,
            videoId: video.contentDetails.videoId,
            channelThumbnail: channel.thumbnail.S,
            channelLink: `https://www.youtube.com/channel/${channel.channelId.S}`,
          })
        ),
      ]);
    })
  );
  return resp
    .status(200)
    .json({ channelcount: channels.length, newVideoCount });
};

export default fetchData;
