import { defineConfig } from 'vitest/config'

// Unit tests are Vitest `*.test.ts` files in a `__tests__` directory next to the
// module they cover. Playwright owns the `*.spec.ts` integration suites under
// `tests/` (see playwright.config.ts).
export default defineConfig({
  test: {
    include: ['src/**/__tests__/**/*.test.ts'],
    environment: 'node',
    // Pin TZ so date-sensitive tests behave the same locally and in CI (both UTC).
    env: { TZ: 'UTC' },
  },
})
