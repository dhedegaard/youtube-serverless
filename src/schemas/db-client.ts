import { z } from 'zod'
import { Channel } from '../models/channel'
import { Video } from '../models/video'

export const dbClientSchema = z.strictObject({
  getChannels: z
    .function()
    .args(z.object({}))
    .returns(z.promise(z.array(Channel as z.ZodType<Channel>))),

  updateChannel: z
    .function()
    .args(z.object({ channel: Channel as z.ZodType<Channel> }))
    .returns(z.promise(z.void())),

  putLatestVideos: z
    .function()
    .args(z.object({ videos: z.array(Video as z.ZodType<Video>) }))
    .returns(z.promise(z.void())),

  getLatestVideos: z
    .function()
    .args(z.object({ limit: z.number().int().positive() }))
    .returns(z.promise(z.array(Video as z.ZodType<Video>))),

  deleteOldVideos: z
    .function()
    .args(z.object({ numberToKeep: z.number().int().positive() }))
    .returns(z.promise(z.number().int().nonnegative())),

  close: z.function().returns(z.promise(z.void())),
})

export interface DbClient extends z.TypeOf<typeof dbClientSchema> {}
