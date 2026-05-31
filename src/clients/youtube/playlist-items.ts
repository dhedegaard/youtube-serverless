import * as z from 'zod'

// Schema + filtering for the YouTube `playlistItems.list` response, kept in its
// own module (free of `SERVER_ENV`/`fetch`) so the parse-and-filter logic can be
// unit tested without any network or environment.

// Deleted/private videos remain in a channel's uploads playlist but come back
// degraded: empty `thumbnails`, no `contentDetails.videoPublishedAt`, and a
// `status.privacyStatus` that isn't `public`/`unlisted`. We keep the schema
// tolerant of those so parsing never throws, then filter them out below.
const thumbnailSchema = z.object({
  url: z.string().min(1),
  width: z.number(),
  height: z.number(),
})
// `privacyStatus` is `z.string()`, not an enum: deleted videos report the
// undocumented `privacyStatusUnspecified`, and an enum would throw on it.
const AVAILABLE_PRIVACY_STATUSES = new Set(['public', 'unlisted'])

const videoItemSchema = z.object({
  contentDetails: z.object({
    videoId: z.string().min(1),
    videoPublishedAt: z.string().min(1).optional(),
  }),
  status: z.object({
    privacyStatus: z.string(),
  }),
  snippet: z.object({
    publishedAt: z.string().min(1),
    channelId: z.string().min(1),
    title: z.string().min(1),
    description: z.string(),
    thumbnails: z.object({
      default: thumbnailSchema.optional(),
      medium: thumbnailSchema.optional(),
      high: thumbnailSchema.optional(),
      standard: thumbnailSchema.optional(),
      maxres: thumbnailSchema.optional(),
    }),
    channelTitle: z.string().min(1),
  }),
})
export interface VideoItem extends z.infer<typeof videoItemSchema> {}

const videoSchema = z.object({
  nextPageToken: z.string().optional(),
  items: z.array(videoItemSchema as z.ZodType<VideoItem, VideoItem>),
})

/**
 * Parse a raw `playlistItems.list` JSON response and return only the videos that
 * are actually watchable. Deleted/private/otherwise-unavailable items are
 * dropped by whitelisting `public`/`unlisted` privacy statuses — whitelisting
 * (rather than blacklisting known-bad statuses) fails safe against unknown or
 * future values.
 */
export const parseAvailablePlaylistItems = async (
  json: unknown
): Promise<readonly VideoItem[]> => {
  const data = await videoSchema.parseAsync(json)
  return data.items.filter((item) => AVAILABLE_PRIVACY_STATUSES.has(item.status.privacyStatus))
}
