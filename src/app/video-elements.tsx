'use client'

import { memo, useMemo } from 'react'
import { useSearchParams } from '../hooks/use-search-params'
import type { Video } from '../models/video'
import { VideoElement } from './VideoElement'

interface VideoElementsProps {
  videos: readonly Video[]
}
export const VideoElements = memo<VideoElementsProps>(function VideoElements({ videos }) {
  const { searchParams } = useSearchParams()

  const filteredVideos = useMemo(
    () => (searchParams?.showShorts === '1' ? videos : videos.filter((video) => !video.isShort)),
    [videos, searchParams]
  )

  return filteredVideos.map((video) => <VideoElement key={video.videoId} video={video} />)
})
