import { expect, test } from 'vitest'
import { relativeTimeAgo } from '../relative-time'

// Reference instant; each `then` is an exact UTC timestamp with its expected
// "x ago" string. UTC-pinned (code uses getUTC*, vitest sets TZ=UTC) so results
// don't vary by timezone. Covers every threshold band and its boundaries.
const NOW = new Date('2026-06-01T12:00:00.000Z')

const cases: [label: string, then: string, expected: string][] = [
  ['0s', '2026-06-01T12:00:00.000Z', 'a few seconds ago'],
  ['44s', '2026-06-01T11:59:16.000Z', 'a few seconds ago'],
  ['45s', '2026-06-01T11:59:15.000Z', 'a minute ago'],
  ['89s', '2026-06-01T11:58:31.000Z', 'a minute ago'],
  ['90s', '2026-06-01T11:58:30.000Z', '2 minutes ago'],
  ['44m', '2026-06-01T11:16:00.000Z', '44 minutes ago'],
  ['45m', '2026-06-01T11:15:00.000Z', 'an hour ago'],
  ['89m', '2026-06-01T10:31:00.000Z', 'an hour ago'],
  ['90m', '2026-06-01T10:30:00.000Z', '2 hours ago'],
  ['21h', '2026-05-31T15:00:00.000Z', '21 hours ago'],
  ['22h', '2026-05-31T14:00:00.000Z', 'a day ago'],
  ['25h', '2026-05-31T11:00:00.000Z', 'a day ago'],
  ['1d', '2026-05-31T12:00:00.000Z', 'a day ago'],
  ['2d', '2026-05-30T12:00:00.000Z', '2 days ago'],
  ['25d', '2026-05-07T12:00:00.000Z', '25 days ago'],
  ['26d', '2026-05-06T12:00:00.000Z', 'a month ago'],
  ['45d', '2026-04-17T12:00:00.000Z', 'a month ago'],
  ['46d', '2026-04-16T12:00:00.000Z', '2 months ago'],
  ['1mo', '2026-05-01T12:00:00.000Z', 'a month ago'],
  ['2mo', '2026-04-01T12:00:00.000Z', '2 months ago'],
  ['10mo', '2025-08-01T12:00:00.000Z', '10 months ago'],
  ['11mo', '2025-07-01T12:00:00.000Z', 'a year ago'],
  ['12mo', '2025-06-01T12:00:00.000Z', 'a year ago'],
  ['17mo', '2025-01-01T12:00:00.000Z', 'a year ago'],
  ['18mo', '2024-12-01T12:00:00.000Z', '2 years ago'],
  ['24mo', '2024-06-01T12:00:00.000Z', '2 years ago'],
  ['36mo', '2023-06-01T12:00:00.000Z', '3 years ago'],
]

test.each(cases)('relativeTimeAgo: %s', (_label, then, expected) => {
  expect(relativeTimeAgo(new Date(then), NOW)).toBe(expected)
})

test('returns a visible sentinel for an unparseable date', () => {
  expect(relativeTimeAgo(new Date('not-a-date'), NOW)).toBe('Invalid Date')
})
