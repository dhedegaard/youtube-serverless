import { z } from 'zod'

export const channelSchema = z.strictObject({
  channelId: z.string(),
  channelTitle: z.string(),
  playlist: z.string(),
  thumbnail: z.string(),
  channelThumbnail: z.string(),
  channelLink: z.string(),
  videoIds: z.array(z.string()),
})
export interface Channel extends z.TypeOf<typeof channelSchema> {}
