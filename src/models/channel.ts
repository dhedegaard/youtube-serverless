import { z } from 'zod'

export const Channel = z.strictObject({
  channelId: z.string(),
  channelTitle: z.string(),
  playlist: z.string(),
  thumbnail: z.string(),
  channelThumbnail: z.string(),
  channelLink: z.string(),
})
export interface Channel extends z.infer<typeof Channel> {}
