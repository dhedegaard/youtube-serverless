import Image from 'next/image'
import { memo } from 'react'
import { Video } from '../models/video'
import { PublishedAt } from './PublishedAt'
import styles from './page.module.css'

interface Props {
  video: Video
}

export const VideoElement = memo(function VideoElement({ video }: Props) {
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
        <PublishedAt videoPublishedAt={video.videoPublishedAt} />{' '}
      </div>
    </div>
  )
})
