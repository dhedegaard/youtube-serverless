import { z } from 'zod'

export const videoSchema = z.strictObject({
  channelId: z.string(),
  videoId: z.string(),
  videoPublishedAt: z.string(),
  thumbnail: z.string(),
  channelTitle: z.string(),
  channelThumbnail: z.string(),
  channelLink: z.string(),
  title: z.string(),
  durationInSeconds: z.optional(z.number().int().nonnegative()),
})
export interface Video extends z.TypeOf<typeof videoSchema> {}
