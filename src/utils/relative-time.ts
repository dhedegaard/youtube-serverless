// Reproduces `dayjs(date).fromNow(true)` for the English locale without the
// dayjs dependency. The threshold table, rounding, and calendar-aware month/year
// diff mirror dayjs's relativeTime plugin so the rendered text stays identical to
// the previous implementation (verified against dayjs in the unit test).

const STRINGS: Record<string, string> = {
  s: 'a few seconds',
  m: 'a minute',
  mm: '%d minutes',
  h: 'an hour',
  hh: '%d hours',
  d: 'a day',
  dd: '%d days',
  M: 'a month',
  MM: '%d months',
  y: 'a year',
  yy: '%d years',
}

type Unit = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year'
interface Threshold {
  l: string
  r?: number
  d?: Unit
}

// dayjs's default relativeTime thresholds. Entries without `d` reuse the diff
// computed by the previous entry that had one (e.g. "26-45 days" -> "a month").
const THRESHOLDS: readonly Threshold[] = [
  { l: 's', r: 44, d: 'second' },
  { l: 'm', r: 89 },
  { l: 'mm', r: 44, d: 'minute' },
  { l: 'h', r: 89 },
  { l: 'hh', r: 21, d: 'hour' },
  { l: 'd', r: 35 },
  { l: 'dd', r: 25, d: 'day' },
  { l: 'M', r: 45 },
  { l: 'MM', r: 10, d: 'month' },
  { l: 'y', r: 17 },
  { l: 'yy', d: 'year' },
]

const UNIT_MS = { second: 1e3, minute: 6e4, hour: 36e5, day: 864e5 } as const

// dayjs/moment-style month add with day clamping (Jan 31 + 1mo -> Feb 28/29).
// UTC methods keep this timezone-independent (dayjs's local ones weren't).
const addMonths = (date: Date, n: number): Date => {
  const day = date.getUTCDate()
  const d = new Date(date.getTime())
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + n)
  const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(day, daysInMonth))
  return d
}

// Port of dayjs Utils.monthDiff(a, b): signed fractional months between a and b.
const monthDiff = (a: Date, b: Date): number => {
  if (a.getUTCDate() < b.getUTCDate()) return -monthDiff(b, a)
  const wholeMonthDiff =
    (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth())
  const anchor = addMonths(a, wholeMonthDiff)
  const beforeAnchor = b.getTime() - anchor.getTime() < 0
  const anchor2 = addMonths(a, wholeMonthDiff + (beforeAnchor ? -1 : 1))
  const denom = beforeAnchor
    ? anchor.getTime() - anchor2.getTime()
    : anchor2.getTime() - anchor.getTime()
  return -(wholeMonthDiff + (b.getTime() - anchor.getTime()) / denom) || 0
}

// dayjs `now.diff(then, unit, true)` (float), with now the later instant.
const diffIn = (now: Date, then: Date, unit: Unit): number => {
  if (unit === 'month') return monthDiff(now, then)
  if (unit === 'year') return monthDiff(now, then) / 12
  return (now.getTime() - then.getTime()) / UNIT_MS[unit]
}

const fromNow = (then: Date, now: Date): string => {
  let result = 0
  for (let i = 0; i < THRESHOLDS.length; i += 1) {
    let t = THRESHOLDS[i]
    if (t == null) continue
    if (t.d != null) {
      result = diffIn(now, then, t.d)
    }
    const abs = Math.round(Math.abs(result))
    if (t.r == null || abs <= t.r) {
      if (abs <= 1 && i > 0) {
        const prev = THRESHOLDS[i - 1]
        if (prev != null) t = prev
      }
      const fmt = STRINGS[t.l]
      return fmt == null ? '' : fmt.replace('%d', String(abs))
    }
  }
  return ''
}

/** Equivalent to `${dayjs(date).fromNow(true)} ago`. */
export const relativeTimeAgo = (date: Date, now: Date = new Date()): string => {
  // Fail visibly on an unparseable date rather than letting NaN fall through the
  // thresholds and render a confidently-wrong "a month ago".
  if (Number.isNaN(date.getTime())) return 'Invalid Date'
  return `${fromNow(date, now)} ago`
}
