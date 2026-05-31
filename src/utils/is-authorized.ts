// Pure authorization check, decoupled from NextRequest and SERVER_ENV so it can
// be unit tested without the Next runtime or env. `api-helpers.ts` adapts a
// NextRequest into these primitives.
export interface AuthorizationInput {
  authorizationHeader: string | null
  tokenParam: string | null
  secret: string
  /** Vercel-provided cron secret; undefined when not configured. */
  cronSecret: string | undefined
}

export const isAuthorized = ({
  authorizationHeader,
  tokenParam,
  secret,
  cronSecret,
}: AuthorizationInput): boolean =>
  // The `cronSecret != null` guard is essential: without it a missing cron
  // secret would compare against the literal string `Bearer undefined`.
  (cronSecret != null && authorizationHeader === `Bearer ${cronSecret}`) ||
  authorizationHeader === secret ||
  tokenParam === secret
