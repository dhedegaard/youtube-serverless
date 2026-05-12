// YouTube classifies eligible Shorts as videos up to three minutes long:
// https://support.google.com/youtube/answer/15424877
export const SHORT_DURATION_IN_SECONDS = 3 * 60

export const isShortDuration = (durationInSeconds: number): boolean =>
  durationInSeconds <= SHORT_DURATION_IN_SECONDS
