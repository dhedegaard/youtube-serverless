import { Header } from './header'
import { VideoGridSkeleton } from './video-grid-skeleton'

export default function IndexLoading() {
  return (
    <>
      <Header />
      <div className="mx-auto mb-8 grid max-w-7xl grid-cols-2 gap-x-4 gap-y-8 px-4 md:grid-cols-3 lg:grid-cols-4">
        <VideoGridSkeleton />
      </div>
    </>
  )
}
