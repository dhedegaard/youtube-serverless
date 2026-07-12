import * as z from 'zod/mini'

export const Channel = z.strictObject({
  channelId: z.string(),
  channelTitle: z.string(),
  playlist: z.string(),
  thumbnail: z.string(),
  channelThumbnail: z.string(),
  channelLink: z.string(),
})
export interface Channel extends z.infer<typeof Channel> {}
