import type { VideoWithoutShortClassification } from '../../../models/video'
import { refreshStatus } from '../../../utils/refresh-status'

export type { VideoWithoutShortClassification }

export interface RefreshAggregate {
  /** Newest-first, capped to `limit`. `null` means "do not write" (no channel succeeded). */
  videosToStore: readonly VideoWithoutShortClassification[] | null
  succeededCount: number
  failedCount: number
  status: 200 | 207 | 500
}

/**
 * Decide what a refresh run should persist and report, given the per-channel
 * settled outcomes. Pure so the resilience contract is unit-testable:
 *
 * - no channel succeeded  → don't overwrite stored data (`null`), status 500
 * - every channel succeeded → status 200
 * - some succeeded, some failed → status 207 (store the survivors)
 *
 * The empty-guard keys on *channels that succeeded*, not on the video count: a
 * channel that legitimately has no uploads is still a success.
 */
export const aggregateRefresh = (
  results: readonly PromiseSettledResult<readonly VideoWithoutShortClassification[]>[],
  limit: number
): RefreshAggregate => {
  const succeeded = results.filter(
    (result): result is PromiseFulfilledResult<readonly VideoWithoutShortClassification[]> =>
      result.status === 'fulfilled'
  )
  const succeededCount = succeeded.length
  const failedCount = results.length - succeededCount
  const status = refreshStatus(succeededCount, failedCount)

  if (succeededCount === 0) {
    return { videosToStore: null, succeededCount, failedCount, status }
  }

  const videosToStore = succeeded
    .flatMap((result) => result.value)
    // Newest-first, then keep only the most recent `limit`.
    .sort((a, b) => b.videoPublishedAt.localeCompare(a.videoPublishedAt))
    .slice(0, limit)

  return { videosToStore, succeededCount, failedCount, status }
}
