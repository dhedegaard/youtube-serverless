import { z } from 'zod'
import { channelSchema } from '../models/channel'

export const dumpedChannelSchema = channelSchema.pick({
  channelId: true,
  channelTitle: true,
})

export interface DumpedChannel extends z.TypeOf<typeof dumpedChannelSchema> {}
