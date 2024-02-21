'use client'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import Image from 'next/image'
import { memo, useEffect, useMemo, useState } from 'react'
import { Video } from '../models/video'
import styles from './page.module.css'

dayjs.extend(relativeTime)

interface Props {
  video: Video
}

export const VideoElement = memo(function VideoElement({ video }: Props) {
  const publishedAt = useMemo(() => new Date(video.videoPublishedAt), [video.videoPublishedAt])
  const [publishedAtFromNow, setPublishedAtFromNow] = useState(
    `${dayjs(publishedAt).fromNow(true)} ago`
  )

  // Render the relative date on the client, to avoid having the value be cached on the server and being wrong.
  useEffect(() => {
    setTimeout(() => setPublishedAtFromNow(`${dayjs(publishedAt).fromNow(true)} ago`), 1000)
  }, [publishedAt])

  return (
    <div className="flex-auto flex flex-col items-stretch">
      <a
        className="relative p-0 overflow-hidden w-full pt-[calc(56.25%-1px)] flex rounded mb-1 bg-blend-multiply bg-gray-50"
        href={`https://www.youtube.com/watch?v=${video.videoId}`}
        target="_blank"
        rel="noreferrer noopener"
      >
        <img className={styles.thumbnail} src={video.thumbnail} alt="Video thumbnail" />
      </a>

      <b className={styles.title} title={video.title}>
        {video.title}
      </b>

      <div className="w-full flex justify-between items-center mt-auto">
        <a
          className={styles.channelTitle}
          href={video.channelLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="w-4 h-4 overflow-hidden box-border shrink-0 grow-0 basis-auto">
            <Image src={video.channelThumbnail} width={16} height={16} alt="Channel logo" />
          </div>
          <span>{video.channelTitle}</span>
        </a>

        <div
          className="text-right whitespace-nowrap basis-auto text-gray-500 text-sm"
          title={`${publishedAt.toLocaleString('en-US', {
            timeZone: 'UTC',
          })} UTC`}
        >
          {publishedAtFromNow}
        </div>
      </div>
    </div>
  )
})
