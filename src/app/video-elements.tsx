'use client'

import { memo, useMemo } from 'react'
import { useSearchParams } from '../hooks/use-search-params'
import type { Video } from '../models/video'
import { VideoElement } from './VideoElement'

const SHORT_DURATION_IN_SECONDS = 120

interface VideoElementsProps {
  videos: readonly Video[]
}
export const VideoElements = memo<VideoElementsProps>(function VideoElements({ videos }) {
  const { searchParams } = useSearchParams()

  const filteredVideos = useMemo(
    () =>
      searchParams?.showShorts === '1'
        ? videos
        : videos.filter(
            (video) =>
              video.durationInSeconds == null || video.durationInSeconds > SHORT_DURATION_IN_SECONDS
          ),
    [videos, searchParams]
  )

  return filteredVideos.map((video) => <VideoElement key={video.videoId} video={video} />)
})
