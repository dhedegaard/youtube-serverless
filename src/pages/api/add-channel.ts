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

  const info = await getChannelInfo(channelId);
  const channel = await updateChannel({
    PK: { S: "CHANNELS" },
    SK: { S: "CHANNELID#" + info.items[0].id },
    channelId: { S: info.items[0].id },
    channelTitle: { S: info.items[0].snippet.title },
    playlist: { S: info.items[0].contentDetails.relatedPlaylists.uploads },
    videoIds: undefined,
  });

  return resp.status(201).json(channel);
};

export default addChannel;
