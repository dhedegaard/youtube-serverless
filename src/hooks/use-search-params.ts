'use client'

import { useSearchParams as useNextSearchParams, usePathname } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import * as z from 'zod/mini'

const SearchParams = z.object({
  showShorts: z.optional(z.literal('1')),
})
export interface SearchParams extends z.infer<typeof SearchParams> {}

export const useSearchParams = () => {
  const pathname = usePathname()
  const rawSearchParams = useNextSearchParams()
  const searchParamsResult = useMemo(
    () => SearchParams.safeParse(Object.fromEntries(rawSearchParams.entries())),
    [rawSearchParams]
  )

  const setSearchParams = useCallback(
    (searchParams: SearchParams) => {
      const newSearchParams = new URLSearchParams()
      for (const [key, value] of Object.entries(searchParams)) {
        if (value != null && value !== '') {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          newSearchParams.set(key, String(value))
        }
      }

      const href =
        newSearchParams.size === 0 ? pathname : `${pathname}?${newSearchParams.toString()}`
      window.history.replaceState(null, '', href)
    },
    [pathname]
  )

  return useMemo(
    () => ({
      searchParams: searchParamsResult.success ? searchParamsResult.data : null,
      setSearchParams,
    }),
    [searchParamsResult, setSearchParams]
  )
}
