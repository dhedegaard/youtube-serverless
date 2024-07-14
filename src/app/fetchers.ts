'use client'

import { useEffect } from 'react'
import useSWR, { SWRConfiguration, SWRResponse } from 'swr'
import { getVideos, GetVideosResult } from './actions'

const swrConfig: SWRConfiguration = {
  // 1 hour
  refreshInterval: 3_600_000,
}

interface VideoKey {
  key: 'videos'
}
const key: VideoKey = { key: 'videos' }

export const useVideos = (): SWRResponse<GetVideosResult, unknown> => {
  const response = useSWR<GetVideosResult, unknown, VideoKey>(key, getVideos, swrConfig)

  useEffect(() => {
    if (response.error != null) {
      console.error(response.error)
    }
  }, [response.error])

  return response
}
