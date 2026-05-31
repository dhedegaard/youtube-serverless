import { revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { createMongoDbClient } from '../../../clients/mongodb'
import { getChannelInfo } from '../../../clients/youtube'
import { channelFromInfoItem } from '../../../clients/youtube/channel-from-info-item'
import type { Channel } from '../../../models/channel'
import { isApiRequestAuthenticated } from '../../../utils/api-helpers'
import { refreshStatus } from '../../../utils/refresh-status'
import { SERVER_ENV } from '../../../utils/server-env'
import { refreshAllChannels } from './refresh-all-channels'

export const revalidate = 0

export const POST = async (request: NextRequest) => {
  if (!isApiRequestAuthenticated(request)) {
    return NextResponse.json({ error: 'Missing or bad authorization header' }, { status: 401 })
  }

  const dbClient = await createMongoDbClient({
    connectionString: SERVER_ENV.MONGODB_URI,
  })

  try {
    const existingChannels = await dbClient.getChannels()

    // No channels configured is a valid, expected state (fresh install or the
    // last channel removed), not a failure — return a clean no-op rather than
    // tripping monitoring with a 500.
    if (existingChannels.length === 0) {
      console.info('No channels configured; skipping refresh')
      return NextResponse.json({ channels: [], failedChannels: 0 }, { status: 200 })
    }

    // Refresh each channel's metadata; one failing channel must not abort the
    // run. A missing item (channel not found on YouTube) is a benign no-op that
    // keeps the existing data.
    const refreshOne = async (channel: Channel): Promise<Channel> => {
      const item = await getChannelInfo({
        type: 'channelId',
        channelId: channel.channelId,
      }).then((data) => data.items?.[0])
      if (item == null) {
        return channel
      }
      const updatedChannel = channelFromInfoItem(item)
      await dbClient.updateChannel({ channel: updatedChannel })
      return updatedChannel
    }

    const { channels, succeededCount, failedCount, errors } = await refreshAllChannels(
      existingChannels,
      refreshOne
    )
    errors.forEach(({ channel, error }) => {
      console.error(`Failed to refresh channel ${channel.channelId}:`, error)
    })

    const status = refreshStatus(succeededCount, failedCount)
    // Nothing refreshed — surface a hard failure (status is 500 here). Branch on
    // the semantic condition, not the status value, mirroring fetch-data.
    if (succeededCount === 0) {
      return NextResponse.json(
        {
          error: 'All channels failed to refresh',
          channelCount: existingChannels.length,
          failedChannels: failedCount,
        },
        { status }
      )
    }

    revalidatePath('/')

    return NextResponse.json({ channels, failedChannels: failedCount }, { status })
  } catch (error: unknown) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await dbClient.close()
  }
}
