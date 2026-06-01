import type { ShortDetectionMethod, Video } from '../models/video'

// YouTube classifies eligible Shorts as videos up to three minutes long:
// https://support.google.com/youtube/answer/15424877
export const SHORT_DURATION_IN_SECONDS = 3 * 60

export const isShortDuration = (durationInSeconds: number): boolean =>
  durationInSeconds <= SHORT_DURATION_IN_SECONDS

export interface ShortClassification {
  isShort: boolean
  shortDetectionMethod: ShortDetectionMethod
}

export const classifyShortVideo = ({
  durationInSeconds,
  isServedAsShort,
}: {
  durationInSeconds: number | null
  isServedAsShort: boolean | null
}): ShortClassification => {
  if (isServedAsShort != null) {
    return {
      isShort: isServedAsShort,
      shortDetectionMethod: 'youtube-shorts-url',
    }
  }

  if (durationInSeconds != null && isShortDuration(durationInSeconds)) {
    return {
      isShort: true,
      shortDetectionMethod: 'duration',
    }
  }

  return {
    isShort: false,
    shortDetectionMethod: 'unknown',
  }
}

// Authoritative (youtube-shorts-url) classifications from a prior set, keyed by
// videoId — a refresh can reuse these and skip re-checking (status is immutable).
export const reusableShortClassifications = (
  videos: readonly Pick<Video, 'videoId' | 'isShort' | 'shortDetectionMethod'>[]
): Map<string, ShortClassification> => {
  const reusable = new Map<string, ShortClassification>()
  for (const video of videos) {
    if (video.shortDetectionMethod === 'youtube-shorts-url') {
      reusable.set(video.videoId, {
        isShort: video.isShort,
        shortDetectionMethod: video.shortDetectionMethod,
      })
    }
  }
  return reusable
}
