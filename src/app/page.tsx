/* eslint-disable @next/next/no-img-element */
import { NextPage } from 'next'
import { use } from 'react'
import { VideoElement } from './VideoElement'
import { getVideos } from './actions'
import { Header } from './header'

// Revalidate at least every hour.
// This is valid since we expect explicit cache invalidation when changes happen to data.
export const revalidate = 3600

const Index: NextPage = () => {
  const { videos } = use(getVideos())

  return (
    <>
      <Header />
      <div className="mx-auto mb-8 grid max-w-7xl grid-cols-2 gap-x-4 gap-y-8 px-4 md:grid-cols-3 lg:grid-cols-4">
        {videos.map((video) => (
          <VideoElement key={video.videoId} video={video} />
        ))}
      </div>
    </>
  )
}

export default Index
