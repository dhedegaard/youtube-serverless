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
    <label className="flex items-center gap-2">
      <div className="text-white">Show shorts</div>
      <input
        type="checkbox"
        className={clsx('toggle toggle-primary', className)}
        defaultChecked={searchParams?.showShorts === '1'}
        onChange={handleChange}
      />
    </label>
  )
})
