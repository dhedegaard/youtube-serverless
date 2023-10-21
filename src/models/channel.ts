import { z } from 'zod'

export const channelSchema = z.object({
  /** Determine by the database backend, null if we're creating something new. */
  id: z.nullable(z.string()),
  channelId: z.string(),
  channelTitle: z.string(),
  playlist: z.string(),
  thumbnail: z.string(),
  channelThumbnail: z.string(),
  channelLink: z.string(),
})
export interface Channel extends z.TypeOf<typeof channelSchema> {}
