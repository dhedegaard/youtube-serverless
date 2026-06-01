import { expect, test } from 'vitest'
import {
  classifyShortVideo,
  isShortDuration,
  reusableShortClassifications,
  SHORT_DURATION_IN_SECONDS,
} from '../youtube-shorts'

test('the URL signal wins over duration when present', () => {
  // Served as a short → short, regardless of a long duration.
  expect(classifyShortVideo({ isServedAsShort: true, durationInSeconds: 6000 })).toEqual({
    isShort: true,
    shortDetectionMethod: 'youtube-shorts-url',
  })
  // Explicitly not served as a short → not short, even with a short duration.
  expect(classifyShortVideo({ isServedAsShort: false, durationInSeconds: 5 })).toEqual({
    isShort: false,
    shortDetectionMethod: 'youtube-shorts-url',
  })
})

test('falls back to duration only when the URL signal is unknown', () => {
  expect(classifyShortVideo({ isServedAsShort: null, durationInSeconds: 120 })).toEqual({
    isShort: true,
    shortDetectionMethod: 'duration',
  })
  expect(classifyShortVideo({ isServedAsShort: null, durationInSeconds: 600 })).toEqual({
    isShort: false,
    shortDetectionMethod: 'unknown',
  })
})

test('is unknown when neither signal is available', () => {
  expect(classifyShortVideo({ isServedAsShort: null, durationInSeconds: null })).toEqual({
    isShort: false,
    shortDetectionMethod: 'unknown',
  })
})

test('treats the 3-minute cutoff as inclusive', () => {
  expect(isShortDuration(SHORT_DURATION_IN_SECONDS)).toBe(true) // exactly 180s
  expect(isShortDuration(SHORT_DURATION_IN_SECONDS + 1)).toBe(false) // 181s
})

test('reuses only authoritative youtube-shorts-url classifications', () => {
  const reusable = reusableShortClassifications([
    { videoId: 'a', isShort: true, shortDetectionMethod: 'youtube-shorts-url' },
    { videoId: 'b', isShort: false, shortDetectionMethod: 'youtube-shorts-url' },
    { videoId: 'c', isShort: true, shortDetectionMethod: 'duration' },
    { videoId: 'd', isShort: false, shortDetectionMethod: 'unknown' },
  ])
  expect(reusable.get('a')).toEqual({ isShort: true, shortDetectionMethod: 'youtube-shorts-url' })
  expect(reusable.get('b')).toEqual({ isShort: false, shortDetectionMethod: 'youtube-shorts-url' })
  // duration/unknown fallbacks are re-resolved, not reused.
  expect(reusable.has('c')).toBe(false)
  expect(reusable.has('d')).toBe(false)
  expect(reusable.size).toBe(2)
})
