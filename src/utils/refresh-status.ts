// Shared HTTP-status policy for the refresh endpoints (fetch-data,
// refresh-channels) so both report partial/total failure identically:
//   - no unit succeeded   → 500 (total failure; trips monitoring)
//   - every unit succeeded → 200
//   - some succeeded, some failed → 207 (partial)
// `succeeded === 0` wins even when `failed === 0` (e.g. nothing to process),
// matching the original fetch-data behaviour.
export const refreshStatus = (succeededCount: number, failedCount: number): 200 | 207 | 500 =>
  succeededCount === 0 ? 500 : failedCount === 0 ? 200 : 207
