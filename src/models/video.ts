import * as z from 'zod/mini'

export const ShortDetectionMethod = z.enum(['youtube-shorts-url', 'duration', 'unknown'])
export type ShortDetectionMethod = z.infer<typeof ShortDetectionMethod>

export const Video = z.strictObject({
  channelId: z.string(),
  videoId: z.string(),
  videoPublishedAt: z.string(),
  thumbnail: z.string(),
  channelTitle: z.string(),
  channelThumbnail: z.string(),
  channelLink: z.string(),
  title: z.string(),
  durationInSeconds: z.nullable(z.int().check(z.nonnegative())),
  isShort: z.boolean(),
  shortDetectionMethod: ShortDetectionMethod,
})
export interface Video extends z.infer<typeof Video> {}

/** A video before its shorts classification has been determined. */
export type VideoWithoutShortClassification = Omit<Video, 'isShort' | 'shortDetectionMethod'>
