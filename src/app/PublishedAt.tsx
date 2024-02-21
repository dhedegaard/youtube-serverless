'use client'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { memo, useEffect, useMemo, useState } from 'react'

dayjs.extend(relativeTime)

interface Props {
  videoPublishedAt: string
}
export const PublishedAt = memo(function PublishedAt({ videoPublishedAt }: Props) {
  const publishedAt = useMemo(() => new Date(videoPublishedAt), [videoPublishedAt])
  const [publishedAtFromNow, setPublishedAtFromNow] = useState(
    `${dayjs(publishedAt).fromNow(true)} ago`
  )

  // Render the relative date on the client, to avoid having the value be cached on the server and being wrong.
  useEffect(() => {
    setTimeout(() => setPublishedAtFromNow(`${dayjs(publishedAt).fromNow(true)} ago`), 1000)
  }, [publishedAt])

  return (
    <div
      className="text-right whitespace-nowrap basis-auto text-gray-500 text-sm"
      title={`${publishedAt.toLocaleString('en-US', {
        timeZone: 'UTC',
      })} UTC`}
    >
      {publishedAtFromNow}
    </div>
  )
})
