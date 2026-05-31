import type { Video, VideoWithoutShortClassification } from '../../models/video'
import { classifyShortVideo } from '../../utils/youtube-shorts'

// Videos persisted before the shorts fields existed lack `isShort` /
// `shortDetectionMethod`, so they're optional on the stored shape.
export type StoredVideo = VideoWithoutShortClassification &
  Partial<Pick<Video, 'isShort' | 'shortDetectionMethod'>>

/**
 * Bring a stored video up to the current `Video` shape, backfilling the shorts
 * classification from duration when it's missing (older records).
 */
export const normalizeStoredVideo = (video: StoredVideo): Video => {
  const fallbackClassification = classifyShortVideo({
    durationInSeconds: video.durationInSeconds,
    isServedAsShort: null,
  })

  return {
    channelId: video.channelId,
    videoId: video.videoId,
    videoPublishedAt: video.videoPublishedAt,
    thumbnail: video.thumbnail,
    channelTitle: video.channelTitle,
    channelThumbnail: video.channelThumbnail,
    channelLink: video.channelLink,
    title: video.title,
    durationInSeconds: video.durationInSeconds,
    isShort: video.isShort ?? fallbackClassification.isShort,
    shortDetectionMethod: video.shortDetectionMethod ?? fallbackClassification.shortDetectionMethod,
  } satisfies Video
}
