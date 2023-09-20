import Z from "zod";
import { SERVER_ENV } from "../../utils/server-env";

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
interface ChannelInfo extends Z.TypeOf<typeof channelInfoSchema> {}
export const getChannelInfo = async (
  channelId: string
): Promise<ChannelInfo> => {
  const params = new URLSearchParams();
  params.set("part", "snippet,contentDetails");
  params.set("id", channelId);
  params.set("key", SERVER_ENV.YOUTUBE_API_KEY);
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

const videoItemSchema = Z.object({
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
});
interface VideoItem extends Z.TypeOf<typeof videoItemSchema> {}
const videoSchema = Z.object({
  nextPageToken: Z.string().optional(),
  items: Z.array(videoItemSchema),
});
export const getVideosForChannelId = async (
  channelId: string
): Promise<readonly VideoItem[]> => {
  const params = new URLSearchParams();
  params.set("part", "contentDetails,snippet");
  params.set("maxResults", "50");
  params.set("playlistId", channelId);
  params.set("key", SERVER_ENV.YOUTUBE_API_KEY);
  const resp = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`,
    {}
  );
  const data = await resp
    .json()
    .then((data: unknown) => videoSchema.parseAsync(data));
  return data.items;
};
