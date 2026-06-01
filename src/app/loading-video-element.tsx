import { memo } from 'react'

export const LoadingVideoElement = memo(function LoadingVideoElement() {
  return (
    <div className="-mb-2 flex flex-auto flex-col items-stretch">
      <div className="skeleton mb-1 aspect-video w-full rounded-lg bg-gray-100 object-cover shadow-sm" />
      <div className="skeleton mb-1 h-[40.8px] w-full rounded-sm bg-gray-100 select-none">
        &nbsp;
      </div>
      <div className="skeleton mt-1 w-full rounded-sm bg-gray-100 select-none">&nbsp;</div>
    </div>
  )
})
