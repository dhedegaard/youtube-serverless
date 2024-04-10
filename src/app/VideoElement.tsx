/* eslint-disable @next/next/no-img-element */
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
        className="relative p-0 overflow-hidden w-full flex rounded-lg mb-1 bg-blend-multiply bg-gray-100"
        href={`https://www.youtube.com/watch?v=${video.videoId}`}
        target="_blank"
        rel="noreferrer noopener"
      >
        <img
          className="aspect-video w-full object-cover"
          src={video.thumbnail}
          alt="Video thumbnail"
          sizes="(max-width: 767px) 50vw, (max-width: 1024px) 33vw, 308px"
          decoding="async"
          loading="lazy"
        />
        {typeof video.durationInSeconds === 'number' && video.durationInSeconds > 0 && (
          <div className="pointer-events-none select-none bg-slate-900 bg-opacity-75 text-white text-xs py-0.5 px-1 font-semibold rounded absolute bottom-1 right-1">
            {Math.floor(video.durationInSeconds / 60)
              .toString()
              .padStart(2, '0')}
            :{(video.durationInSeconds % 60).toString().padStart(2, '0')}
          </div>
        )}
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
          <div className="w-4 aspect-square overflow-hidden box-border shrink-0 grow-0 basis-auto">
            <img
              src={video.channelThumbnail}
              width={16}
              height={16}
              decoding="async"
              alt="Channel logo"
              loading="lazy"
              className="object-cover"
            />
          </div>
          <span>{video.channelTitle}</span>
        </a>
        <PublishedAt videoPublishedAt={video.videoPublishedAt} />{' '}
      </div>
    </div>
  )
})
