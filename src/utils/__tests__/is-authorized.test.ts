import { expect, test } from 'vitest'
import { isAuthorized } from '../is-authorized'

const base = { secret: 'top-secret', cronSecret: 'cron-secret' } as const

test('accepts the Vercel cron Bearer token', () => {
  expect(
    isAuthorized({ ...base, authorizationHeader: 'Bearer cron-secret', tokenParam: null })
  ).toBe(true)
})

test('accepts the raw secret as the authorization header', () => {
  expect(isAuthorized({ ...base, authorizationHeader: 'top-secret', tokenParam: null })).toBe(true)
})

test('accepts the secret as the token query param', () => {
  expect(isAuthorized({ ...base, authorizationHeader: null, tokenParam: 'top-secret' })).toBe(true)
})

test('rejects a missing or wrong credential', () => {
  expect(isAuthorized({ ...base, authorizationHeader: null, tokenParam: null })).toBe(false)
  expect(isAuthorized({ ...base, authorizationHeader: 'Bearer wrong', tokenParam: 'nope' })).toBe(
    false
  )
})

test('does not allow "Bearer undefined" to pass when no cron secret is configured', () => {
  expect(
    isAuthorized({
      secret: 'top-secret',
      cronSecret: undefined,
      authorizationHeader: 'Bearer undefined',
      tokenParam: null,
    })
  ).toBe(false)
})
