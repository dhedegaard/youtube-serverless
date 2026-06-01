/**
 * Run `worker` over `items` with at most `limit` calls in flight at once, using
 * a rolling pool: each of the (up to `limit`) workers pulls the next item as
 * soon as it finishes, so a slow item occupies a single slot without blocking
 * the others (unlike fixed batches, where the whole batch waits on its slowest
 * item). Bounding the fan-out keeps a large input from bursting into a flood of
 * concurrent I/O that could trip rate limits. Returns the settled results in
 * input order. Never throws: a per-item failure comes back as a `rejected`
 * result so callers can isolate failures. A non-positive `limit` is clamped to 1.
 */
export const settleWithConcurrency = async <T, R>({
  items,
  limit,
  worker,
}: {
  items: readonly T[]
  limit: number
  worker: (item: T, index: number) => Promise<R>
}): Promise<PromiseSettledResult<R>[]> => {
  const results = new Array<PromiseSettledResult<R>>(items.length)
  const entries = [...items.entries()]
  let cursor = 0

  const runWorker = async (): Promise<void> => {
    // Grab-and-advance is synchronous (no await between), so two workers never
    // claim the same item.
    let entry = entries[cursor]
    cursor += 1
    while (entry != null) {
      const [index, item] = entry
      try {
        results[index] = { status: 'fulfilled', value: await worker(item, index) }
      } catch (reason: unknown) {
        results[index] = { status: 'rejected', reason }
      }
      entry = entries[cursor]
      cursor += 1
    }
  }

  const workerCount = Math.min(Math.max(1, limit), items.length)
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()))
  return results
}
