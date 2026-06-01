'use client'

import { useEffect } from 'react'
import { Logo } from '../components/Logo'

// Route error boundary: shown when the homepage data load (getVideos) throws.
export default function IndexError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-7xl flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo width={48} height={48} />
      <h1 className="text-xl font-semibold text-gray-800">Something went wrong</h1>
      <p className="text-gray-500">Failed to load the latest videos.</p>
      <button type="button" onClick={reset} className="btn btn-primary">
        Try again
      </button>
    </main>
  )
}
