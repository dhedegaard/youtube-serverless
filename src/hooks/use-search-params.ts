'use client'

import { useSearchParams as useNextSearchParams, usePathname, useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { z } from 'zod/v4-mini'

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

  const router = useRouter()
  const setSearchParams = useCallback(
    (searchParams: SearchParams) => {
      const newSearchParams = new URLSearchParams()
      for (const [key, value] of Object.entries(searchParams)) {
        if (value != null && value !== '') {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          newSearchParams.set(key, String(value))
        }
      }

      if (newSearchParams.size === 0) {
        router.replace(pathname)
      } else {
        router.replace(`?${new URLSearchParams(searchParams).toString()}`)
      }
    },
    [pathname, router]
  )

  return useMemo(
    () => ({
      searchParams: searchParamsResult.success ? searchParamsResult.data : null,
      setSearchParams,
    }),
    [searchParamsResult, setSearchParams]
  )
}
