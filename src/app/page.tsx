/* eslint-disable @next/next/no-img-element */
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { NextPage } from 'next'
import Image from 'next/image'
import { use } from 'react'
import favicon from '../../public/favicon.png'
import { createMongoDbClient } from '../clients/mongodb'
import { SERVER_ENV } from '../utils/server-env'
import styles from './page.module.css'

dayjs.extend(relativeTime)

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
        {videos.map((e) => {
          const publishedAt = new Date(e.videoPublishedAt)
          return (
            <div
              className="flex grow-0 shrink-0 basis-auto flex-col items-stretch mb-4 w-[calc(20%-8px)] max-lg:w-[calc(25%-8px)] max-md:w-[calc(100%/3-8px)] max-sm:w-[calc(50%-8px)]"
              key={e.videoId}
            >
              <a
                className="relative p-0 overflow-hidden w-full pt-[calc(56.25%-1px)] flex rounded mb-1 bg-blend-multiply bg-gray-50"
                href={`https://www.youtube.com/watch?v=${e.videoId}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                <img className={styles.thumbnail} src={e.thumbnail} alt="Video thumbnail" />
              </a>

              <b className={styles.title} title={e.title}>
                {e.title}
              </b>

              <div className="w-full flex justify-between items-center mt-auto">
                <a
                  className={styles.channelTitle}
                  href={e.channelLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="w-4 h-4 overflow-hidden box-border shrink-0 grow-0 basis-auto">
                    <Image src={e.channelThumbnail} width={16} height={16} alt="Channel logo" />
                  </div>
                  <span>{e.channelTitle}</span>
                </a>

                <div
                  className="text-right whitespace-nowrap basis-auto text-gray-500 text-[0.75em]"
                  title={publishedAt.toLocaleString('en-US')}
                >
                  {dayjs(publishedAt).fromNow(true)} ago
                </div>
              </div>
            </div>
          )
        })}
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
      videos: await dbClient.getLatestVideos({ limit: 50 }),
    }
  } finally {
    await dbClient.close()
  }
}

export default Index
