import { NextRequest } from 'next/server'
import { isAuthorized } from './is-authorized'
import { SERVER_ENV } from './server-env'

// NOTE: CRON_SECRET is vercel specific, documented here:
// <https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs>
// SECRET (header or `?token=`) is also accepted for easy deployment elsewhere.
export const isApiRequestAuthenticated = (request: NextRequest): boolean =>
  isAuthorized({
    authorizationHeader: request.headers.get('authorization'),
    tokenParam: request.nextUrl.searchParams.get('token'),
    secret: SERVER_ENV.SECRET,
    cronSecret: SERVER_ENV.CRON_SECRET,
  })
