import { z } from 'zod'
import { Channel } from '../models/channel'
import { Video } from '../models/video'

export const DbClient = z.strictObject({
  getChannels: z.function({
    output: z.promise(z.array(Channel as z.ZodType<Channel, Channel>).readonly()),
  }),

  updateChannel: z.function({
    input: [z.object({ channel: Channel as z.ZodType<Channel, Channel> })],
    output: z.promise(z.void()),
  }),

  putLatestVideos: z.function({
    input: [z.object({ videos: z.array(Video as z.ZodType<Video, Video>).readonly() })],
    output: z.promise(z.void()),
  }),

  getLatestVideos: z.function({
    input: [z.object({ limit: z.number().int().positive() })],
    output: z.promise(z.array(Video as z.ZodType<Video, Video>).readonly()),
  }),

  deleteOldVideos: z.function({
    input: [z.object({ numberToKeep: z.number().int().positive() })],
    output: z.promise(z.number().int().nonnegative()),
  }),

  close: z.function({
    output: z.promise(z.void()),
  }),
})

export interface DbClient {
  getChannels: () => Promise<readonly Channel[]>
  updateChannel: (args: { channel: Channel }) => Promise<void>
  putLatestVideos: (args: { videos: readonly Video[] }) => Promise<void>
  getLatestVideos: (args: { limit: number }) => Promise<readonly Video[]>
  deleteOldVideos: (args: { numberToKeep: number }) => Promise<number>
  close: () => Promise<void>
}
