import { createHash, timingSafeEqual } from 'node:crypto'

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

// Constant-time credential comparison. Hashing both sides to fixed-length
// digests means `timingSafeEqual` never throws on a length mismatch and the
// secret's length isn't leaked, while the compare itself stays timing-safe.
const safeEqual = (a: string, b: string): boolean =>
  timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest())

export const isAuthorized = ({
  authorizationHeader,
  tokenParam,
  secret,
  cronSecret,
}: AuthorizationInput): boolean =>
  // The `cronSecret != null` guard is essential: without it a missing cron
  // secret would compare against the literal string `Bearer undefined`.
  (cronSecret != null && safeEqual(authorizationHeader ?? '', `Bearer ${cronSecret}`)) ||
  safeEqual(authorizationHeader ?? '', secret) ||
  safeEqual(tokenParam ?? '', secret)
