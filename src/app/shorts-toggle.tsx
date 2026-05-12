'use client'

import clsx from 'clsx'
import { type ChangeEventHandler, memo, useCallback } from 'react'
import { type SearchParams, useSearchParams } from '../hooks/use-search-params'

interface ShortsToggleProps {
  className?: string
}
export const ShortsToggle = memo<ShortsToggleProps>(function ShortsToggle({ className }) {
  const { searchParams, setSearchParams } = useSearchParams()

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      event.preventDefault()
      setSearchParams({
        showShorts: event.target.checked ? '1' : undefined,
      } satisfies SearchParams)
    },
    [setSearchParams]
  )
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-white select-none">
      <span>Show shorts</span>
      <input
        type="checkbox"
        aria-label="Show shorts"
        className={clsx(
          'toggle toggle-primary toggle-sm border-white/80 bg-white shadow-sm focus-visible:outline-white',
          className
        )}
        defaultChecked={searchParams?.showShorts === '1'}
        onChange={handleChange}
      />
    </label>
  )
})
