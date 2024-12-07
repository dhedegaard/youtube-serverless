'use client'

import { memo } from 'react'
import { Video } from '../models/video'
import { VideoElement } from './VideoElement'

interface VideoElementsProps {
  videos: readonly Video[]
}
export const VideoElements = memo<VideoElementsProps>(function VideoElements({ videos }) {
  return videos.map((video) => <VideoElement key={video.videoId} video={video} />)
})
