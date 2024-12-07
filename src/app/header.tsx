import { memo } from 'react'
import { Logo } from '../components/Logo'

export const Header = memo(function Header() {
  return (
    <nav className="mb-4 flex w-full items-end gap-4 bg-gray-700 py-4 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap gap-3 px-4">
        <Logo className="flex-none" width={24} height={24} />
        New youtube videos
      </div>
    </nav>
  )
})
