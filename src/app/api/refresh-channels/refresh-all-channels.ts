import type { Channel } from '../../../models/channel'

export interface RefreshAllChannelsResult {
  /** Every channel in its best-known state: refreshed where it succeeded, existing data otherwise. */
  channels: Channel[]
  succeededCount: number
  failedCount: number
  errors: { channel: Channel; error: unknown }[]
}

/**
 * Refresh each channel independently so one failure can't abort the run.
 * `refreshOne` does the per-channel I/O and returns the channel to keep
 * (refreshed, or the existing one for a benign not-found); a thrown error marks
 * that channel failed and leaves its existing data in place. Pure aside from the
 * injected `refreshOne`, so the continue-on-failure behaviour is unit-testable.
 *
 * Channels are refreshed in batches of `concurrency` (bounded so a large channel
 * set can't fan out into a burst of concurrent `channels.list` calls and trip
 * YouTube rate limits). Results and errors are assembled in input order.
 */
export const refreshAllChannels = async (
  channels: readonly Channel[],
  refreshOne: (channel: Channel) => Promise<Channel>,
  concurrency = 8
): Promise<RefreshAllChannelsResult> => {
  const result: Channel[] = []
  const errors: { channel: Channel; error: unknown }[] = []
  const batchSize = Math.max(1, concurrency)

  for (let start = 0; start < channels.length; start += batchSize) {
    const batch = channels.slice(start, start + batchSize)
    const settled = await Promise.allSettled(batch.map((channel) => refreshOne(channel)))
    settled.forEach((outcome, index) => {
      const channel = batch[index]
      if (channel == null) return
      if (outcome.status === 'fulfilled') {
        result.push(outcome.value)
      } else {
        errors.push({ channel, error: outcome.reason })
        result.push(channel)
      }
    })
  }

  return {
    channels: result,
    succeededCount: channels.length - errors.length,
    failedCount: errors.length,
    errors,
  }
}
