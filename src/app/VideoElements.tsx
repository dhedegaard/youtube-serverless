'use client'

import { memo, useEffect, useMemo } from 'react'
import { Video } from '../models/video'
import { useVideos } from './fetchers'
import { VideoElement } from './VideoElement'

interface VideoElementsProps {
  initialVideos: readonly Video[]
}
export const VideoElements = memo<VideoElementsProps>(function VideoElements({ initialVideos }) {
  const { data } = useVideos()

  useEffect(() => {
    console.log('DATA:', data)
  }, [data])

  const videos = useMemo(() => data?.videos ?? initialVideos, [data?.videos, initialVideos])

  return videos.map((video) => <VideoElement key={video.videoId} video={video} />)
})
