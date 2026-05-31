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
  // Nothing to process at all also counts as total failure (succeeded === 0).
  expect(refreshStatus(0, 0)).toBe(500)
})
