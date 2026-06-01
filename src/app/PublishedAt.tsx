'use client'

import clsx from 'clsx'
import { memo, useEffect, useMemo, useState } from 'react'
import { relativeTimeAgo } from '../utils/relative-time'

interface Props {
  videoPublishedAt: string
}
export const PublishedAt = memo(function PublishedAt({ videoPublishedAt }: Props) {
  const publishedAt = useMemo(() => new Date(videoPublishedAt), [videoPublishedAt])
  const [publishedAtFromNow, setPublishedAtFromNow] = useState<string | null>(null)

  // Render the relative date on the client, to avoid having the value be cached on the server and being wrong.
  useEffect(() => {
    setPublishedAtFromNow(relativeTimeAgo(publishedAt))
  }, [publishedAt])

  return (
    <div
      className={clsx(
        'basis-auto text-right text-sm whitespace-nowrap text-gray-500',
        publishedAtFromNow == null && 'skeleton w-1/4 rounded-sm bg-slate-50'
      )}
      title={`${useMemo(
        () =>
          publishedAt.toLocaleString('en-US', {
            timeZone: 'UTC',
          }),
        [publishedAt]
      )} UTC`}
    >
      {publishedAtFromNow ?? <>&nbsp;</>}
    </div>
  )
})
