'use client'

import useSWR, { SWRResponse } from 'swr'
import { useEffect, useMemo } from 'react'
import { getVideos, GetVideosResult } from './actions'

interface VideoKey {
  key: 'videos'
}
export const useVideos = (): SWRResponse<GetVideosResult, unknown> => {
  const response = useSWR<GetVideosResult, unknown, VideoKey>(
    useMemo<VideoKey>(() => ({ key: 'videos' }), []),
    getVideos
  )

  useEffect(() => {
    if (response.error != null) {
      console.error(response.error)
    }
  }, [response.error])

  return response
}
