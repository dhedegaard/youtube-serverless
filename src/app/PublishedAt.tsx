'use client'

import clsx from 'clsx'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { memo, useEffect, useMemo, useState } from 'react'

dayjs.extend(relativeTime)

interface Props {
  videoPublishedAt: string
}
export const PublishedAt = memo(function PublishedAt({ videoPublishedAt }: Props) {
  const publishedAt = useMemo(() => new Date(videoPublishedAt), [videoPublishedAt])
  const [publishedAtFromNow, setPublishedAtFromNow] = useState<string | null>(null)

  // Render the relative date on the client, to avoid having the value be cached on the server and being wrong.
  useEffect(() => {
    setPublishedAtFromNow(`${dayjs(publishedAt).fromNow(true)} ago`)
  }, [publishedAt])

  return (
    <div
      className={clsx(
        'basis-auto whitespace-nowrap text-right text-sm text-gray-500',
        publishedAtFromNow == null && 'skeleton w-1/4 rounded bg-slate-50'
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
