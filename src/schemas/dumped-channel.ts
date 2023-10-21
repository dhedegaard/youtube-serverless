import { z } from 'zod'

export const dumpedChannelSchema = z.object({
  channelId: z.string().min(1),
  channelTitle: z.string().min(1),
})

export interface DumpedChannel extends z.TypeOf<typeof dumpedChannelSchema> {}
