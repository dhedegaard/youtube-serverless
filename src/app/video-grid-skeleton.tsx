import { LoadingVideoElement } from './loading-video-element'

// Grid skeleton cells shared by loading.tsx and the homepage Suspense fallback.
// Renders direct grid children, so place it inside the grid container.
export function VideoGridSkeleton() {
  return Array.from({ length: 12 }, (_, index) => <LoadingVideoElement key={index} />)
}
