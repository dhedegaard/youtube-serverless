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
        className="relative p-0 overflow-hidden w-full pt-[calc(56.25%-1px)] flex rounded-lg mb-1 bg-blend-multiply bg-gray-100"
        href={`https://www.youtube.com/watch?v=${video.videoId}`}
        target="_blank"
        rel="noreferrer noopener"
      >
        <Image
          fill
          className="object-cover"
          src={video.thumbnail}
          alt="Video thumbnail"
          sizes="(max-width: 767px) 50vw, (max-width: 1024px) 33vw, 308px"
          loading="lazy"
        />
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
            <Image
              src={video.channelThumbnail}
              width={16}
              height={16}
              alt="Channel logo"
              loading="lazy"
            />
          </div>
          <span>{video.channelTitle}</span>
        </a>
        <PublishedAt videoPublishedAt={video.videoPublishedAt} />{' '}
      </div>
    </div>
  )
})
