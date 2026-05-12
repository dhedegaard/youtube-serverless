'use client'

import clsx from 'clsx'
import { type ChangeEventHandler, memo, useCallback, useEffect, useRef } from 'react'
import { type SearchParams, useSearchParams } from '../hooks/use-search-params'

interface ShortsToggleProps {
  className?: string
}
export const ShortsToggle = memo<ShortsToggleProps>(function ShortsToggle({ className }) {
  const { searchParams, setSearchParams } = useSearchParams()
  const showShorts = searchParams?.showShorts === '1'
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current != null) {
      inputRef.current.checked = showShorts
    }
  }, [showShorts])

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      setSearchParams({
        showShorts: event.currentTarget.checked ? '1' : undefined,
      } satisfies SearchParams)
    },
    [setSearchParams]
  )
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-white select-none">
      <span>Show shorts</span>
      <input
        ref={inputRef}
        type="checkbox"
        aria-label="Show shorts"
        className={clsx(
          'toggle toggle-primary toggle-sm border-white/80 bg-white shadow-sm focus-visible:outline-white',
          className
        )}
        defaultChecked={showShorts}
        onChange={handleChange}
      />
    </label>
  )
})
