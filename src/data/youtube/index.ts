const apiKey = process.env.YOUTUBE_API_KEY;

export const getChannelInfo = async (
  channelId: string
): Promise<{
  items: {
    id: string;
    snippet: {
      title: string;
      description: string;
      customUrl: string;
      thumbnails: { high: { url: string } };
    };
    contentDetails: { relatedPlaylists: { uploads: string } };
  }[];
}> => {
  const params = new URLSearchParams();
  params.set("part", "snippet,contentDetails");
  params.set("id", channelId);
  params.set("key", apiKey);
  const resp = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`
  );
  return await resp.json();
};

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
  const data = (await resp.json()) as {
    nextPageToken: string | undefined;
    items: Array<{
      contentDetails: {
        videoId: string;
        videoPublishedAt: string;
      };
      snippet: {
        publishedAt: string;
        channelId: string;
        title: string;
        description: string;
        thumbnails: {
          default: { url: string; width: number; height: number };
          medium: { url: string; width: number; height: number };
          high: { url: string; width: number; height: number };
          standard: { url: string; width: number; height: number };
          maxres: { url: string; width: number; height: number };
        };
        channelTitle: string;
      };
    }>;
  };
  return [...data.items];
};
