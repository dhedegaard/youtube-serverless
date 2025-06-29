import { Suspense, memo } from 'react'
import { Logo } from '../components/Logo'
import { ShortsToggle } from './shorts-toggle'

export const Header = memo(function Header() {
  return (
    <nav className="mb-4 flex w-full items-end gap-4 bg-gray-700 py-4">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap gap-3 px-4">
        <Logo className="flex-none" width={24} height={24} />
        <div className="flex-auto text-white">New youtube videos</div>
        <Suspense fallback={<div className="skeleton w-36 rounded" />}>
          <ShortsToggle className="flex-none" />
        </Suspense>
      </div>
    </nav>
  )
})
