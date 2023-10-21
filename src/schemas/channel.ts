import { z } from 'zod'

export const channelSchema = z.object({
  channelId: z.string(),
  channelTitle: z.string(),
  playlist: z.string(),
  thumbnail: z.string(),
  channelThumbnail: z.string(),
  channelLink: z.string(),
})
export interface Channel extends z.TypeOf<typeof channelSchema> {}
