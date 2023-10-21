import { z } from 'zod'

export const videoSchema = z.object({
  channelId: z.string(),
  videoId: z.string(),
  videoPublishedAt: z.string(),
  thumbnail: z.string(),
  channelTitle: z.string(),
  channelThumbnail: z.string(),
  channelLink: z.string(),
  title: z.string(),
})
export interface Video extends z.TypeOf<typeof videoSchema> {}
