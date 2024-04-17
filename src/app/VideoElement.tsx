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
    <div className="flex flex-auto flex-col items-stretch">
      <a
        className="relative mb-1 flex w-full overflow-hidden rounded-lg bg-gray-100 p-0 bg-blend-multiply"
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
          <div className="pointer-events-none absolute bottom-1 right-1 select-none rounded bg-slate-900/75 px-1 py-0.5 text-xs font-semibold text-white">
            {video.durationInSeconds > 60 * 60 && (
              <>{Math.floor(video.durationInSeconds / (60 * 60))}:</>
            )}
            {(Math.floor(video.durationInSeconds / 60) % 60).toString().padStart(2, '0')}:
            {(video.durationInSeconds % 60).toString().padStart(2, '0')}
          </div>
        )}
      </a>

      <b className={styles.title} title={video.title}>
        {video.title}
      </b>

      <div className="mt-auto flex w-full items-center justify-between">
        <a
          className={styles.channelTitle}
          href={video.channelLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="box-border aspect-square w-4 shrink-0 grow-0 basis-auto overflow-hidden">
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
