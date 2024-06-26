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

const Index: NextPage = () => {
  const { videos } = use(getVideos())

  return (
    <>
      <nav className="mb-4 flex w-full items-end gap-4 bg-gray-700 py-4 text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap gap-3 px-4">
          <Logo className="flex-none" width={24} height={24} />
          New youtube videos
        </div>
      </nav>
      <div className="mx-auto mb-8 grid max-w-7xl grid-cols-2 gap-x-4 gap-y-8 px-4 md:grid-cols-3 lg:grid-cols-4">
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
