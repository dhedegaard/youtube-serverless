import { memo } from 'react'

export const LoadingVideoElement = memo(function LoadingVideoElement() {
  return (
    <div className="-mb-2 flex flex-auto flex-col items-stretch">
      <div className="skeleton mb-1 aspect-video w-full rounded-lg bg-gray-100 object-cover shadow" />
      <div className="skeleton mb-1 h-[40.8px] w-full select-none rounded bg-gray-100">&nbsp;</div>
      <div className="skeleton mt-1 w-full select-none rounded bg-gray-100">&nbsp;</div>
    </div>
  )
})
