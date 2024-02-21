/* eslint-disable @next/next/no-img-element */
import { NextPage } from 'next'
import Image from 'next/image'
import { use } from 'react'
import favicon from '../../public/favicon.png'
import { createMongoDbClient } from '../clients/mongodb'
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
      <nav className="w-full py-4 mb-2 bg-gray-700 text-white flex gap-4 items-end">
        <div className="max-w-[1140px] mx-auto flex flex-wrap gap-3 w-full px-2">
          <Image priority src={favicon} width={24} height={24} alt="Logo" />
          New youtube videos
        </div>
      </nav>
      <div className="max-w-[1140px] mx-auto flex flex-wrap gap-[10px] px-2">
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
