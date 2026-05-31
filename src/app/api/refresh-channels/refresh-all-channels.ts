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
 */
export const refreshAllChannels = async (
  channels: readonly Channel[],
  refreshOne: (channel: Channel) => Promise<Channel>
): Promise<RefreshAllChannelsResult> => {
  const result: Channel[] = []
  const errors: { channel: Channel; error: unknown }[] = []

  for (const channel of channels) {
    try {
      result.push(await refreshOne(channel))
    } catch (error: unknown) {
      errors.push({ channel, error })
      result.push(channel)
    }
  }

  return {
    channels: result,
    succeededCount: channels.length - errors.length,
    failedCount: errors.length,
    errors,
  }
}
