import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getChannels } from '../../../clients/dynamodb'
import { DumpedChannel, dumpedChannelSchema } from '../../../schemas/dumped-channel'
import { isApiRequestAuthenticated } from '../../../utils/api-helpers'

const resultSchema = z.object({
  statusCode: z.number().int().positive(),
  channels: z.array(dumpedChannelSchema as z.ZodType<DumpedChannel>),
  message: z.string().min(1),
})
interface Result extends z.TypeOf<typeof resultSchema> {}

export const GET = async (request: NextRequest): Promise<NextResponse<Result>> => {
  const result = await handleRequest({ request })
  return NextResponse.json<Result>(result, { status: result.statusCode })
}

const handleRequest = z
  .function()
  .args(z.object({ request: z.instanceof(Request) as z.ZodType<NextRequest> }))
  .returns(z.promise(resultSchema))
  .implement(async function handleRequest({ request }): Promise<Result> {
    if (!isApiRequestAuthenticated(request)) {
      const result: Result = {
        channels: [],
        statusCode: 401,
        message: 'Missing or bad authorization header',
      }
      return result
    }

    const channels = await getChannels().then((channels) =>
      channels.map((channel): DumpedChannel => {
        const result: DumpedChannel = {
          channelId: channel.channelId,
          channelTitle: channel.channelTitle,
        }
        return result
      })
    )
    const result: Result = {
      statusCode: 200,
      channels,
      message: `Total number of channels: ${channels.length}`,
    }
    return result
  })
