import { expect, test } from 'vitest'
import { refreshStatus } from '../refresh-status'

test('200 when everything succeeded', () => {
  expect(refreshStatus(5, 0)).toBe(200)
})

test('207 when some succeeded and some failed', () => {
  expect(refreshStatus(3, 2)).toBe(207)
})

test('500 when nothing succeeded', () => {
  expect(refreshStatus(0, 4)).toBe(500)
  // Degenerate-input contract: with no successes this maps to 500 even when
  // failed === 0. Real callers short-circuit the no-channels case at the route
  // (clean 200 no-op), so this also stays a tripwire for any future endpoint
  // that forgets that guard.
  expect(refreshStatus(0, 0)).toBe(500)
})
