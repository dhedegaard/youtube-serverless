import { NextRequest } from 'next/server'
import { SERVER_ENV } from './server-env'

export const isApiRequestAuthenticated = (request: NextRequest): boolean =>
  // NOTE: CRON_SECRET is a vercel specific, documented here:
  // <https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs>
  (SERVER_ENV.CRON_SECRET != null &&
    request.headers.get('authorization') === `Bearer ${SERVER_ENV.CRON_SECRET}`) ||
  // We also accept an auth header or token search param for easy deployment elsewhere.
  request.headers.get('authorization') === SERVER_ENV.SECRET ||
  request.nextUrl.searchParams.get('token') === SERVER_ENV.SECRET
