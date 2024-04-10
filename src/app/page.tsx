/* eslint-disable @next/next/no-img-element */
import { NextPage } from 'next'
import { use } from 'react'
import { createMongoDbClient } from '../clients/mongodb'
import { Logo } from '../components/Logo'
import { SERVER_ENV } from '../utils/server-env'
import { VideoElement } from './VideoElement'

// Revalidate at least every 3 hours.
// This is valid since we expect explicit cache invalidation when changes happen to data.
export const revalidate = 10800

interface ChannelElem {
  key: string
  link: string
  thumbnail: string
  title: string
}

const Index: NextPage = () => {
  const { videos } = use(getVideos())

  return (
    <>
      <nav className="w-full py-4 mb-4 bg-gray-700 text-white flex gap-4 items-end">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3 w-full px-2">
          <Logo className="flex-none" width={24} height={24} />
          New youtube videos
        </div>
      </nav>
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 px-2 mb-4">
        {videos.map((video) => (
          <VideoElement key={video.videoId} video={video} />
        ))}
      </div>
    </>
  )
}

const getVideos = async () => {
  const dbClient = await createMongoDbClient({
    connectionString: SERVER_ENV.MONGODB_URI,
  })

  try {
    return {
      videos: await dbClient.getLatestVideos({ limit: 60 }),
    }
  } finally {
    await dbClient.close()
  }
}

export default Index
