import Z from "zod";

const apiKey = process.env.YOUTUBE_API_KEY;
if (apiKey == null) {
  throw new Error("Missing YOUTUBE_API_KEY");
}

const channelInfoSchema = Z.object({
  items: Z.array(
    Z.object({
      id: Z.string().nonempty(),
      snippet: Z.object({
        title: Z.string().nonempty(),
        description: Z.string(),
        customUrl: Z.string(),
        thumbnails: Z.object({
          high: Z.object({
            url: Z.string().nonempty(),
          }),
        }),
      }),
      contentDetails: Z.object({
        relatedPlaylists: Z.object({
          uploads: Z.string().nonempty(),
        }),
      }),
    })
  ),
});
export const getChannelInfo = async (channelId: string) => {
  const params = new URLSearchParams();
  params.set("part", "snippet,contentDetails");
  params.set("id", channelId);
  params.set("key", apiKey);
  const resp = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`
  );
  if (!resp.ok) {
    throw new Error(
      `Unable to get channel info: ${resp.status} ${resp.statusText}`
    );
  }
  return await resp
    .json()
    .then((data: unknown) => channelInfoSchema.parseAsync(data));
};

const videoSchema = Z.object({
  nextPageToken: Z.string().optional(),
  items: Z.array(
    Z.object({
      contentDetails: Z.object({
        videoId: Z.string().nonempty(),
        videoPublishedAt: Z.string().nonempty(),
      }),
      snippet: Z.object({
        publishedAt: Z.string().nonempty(),
        channelId: Z.string().nonempty(),
        title: Z.string().nonempty(),
        description: Z.string(),
        thumbnails: Z.object({
          default: Z.object({
            url: Z.string().nonempty(),
            width: Z.number(),
            height: Z.number(),
          }),
          medium: Z.object({
            url: Z.string().nonempty(),
            width: Z.number(),
            height: Z.number(),
          }),
          high: Z.object({
            url: Z.string().nonempty(),
            width: Z.number(),
            height: Z.number(),
          }),
          standard: Z.object({
            url: Z.string().nonempty(),
            width: Z.number(),
            height: Z.number(),
          }).optional(),
          maxres: Z.object({
            url: Z.string().nonempty(),
            width: Z.number(),
            height: Z.number(),
          }).optional(),
        }),
        channelTitle: Z.string().nonempty(),
      }),
    })
  ),
});
export const getVideosForChannelId = async (channelId: string) => {
  const params = new URLSearchParams();
  params.set("part", "contentDetails,snippet");
  params.set("maxResults", "50");
  params.set("playlistId", channelId);
  params.set("key", apiKey);
  const resp = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`,
    {}
  );
  const data = await resp
    .json()
    .then((data: unknown) => videoSchema.parseAsync(data));
  return data.items;
};
