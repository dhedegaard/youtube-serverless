import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // Look for test files in the "tests" directory, relative to this configuration file.
  testDir: './tests',

  // Playwright owns `*.spec.ts` integration tests only. Unit tests are Vitest
  // `*.test.ts` files under `src/**/__tests__/` — exclude Playwright's default
  // `.test.ts` matching so it never picks them up.
  testMatch: /.*\.spec\.ts$/,

  // Run all tests in parallel.
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env['CI'],

  // Retry on CI only.
  retries: process.env['CI'] ? 2 : 0,

  // Opt out of parallel tests on CI.
  workers: process.env['CI'] ? 1 : 2,

  // Reporter to use
  // reporter: 'html',

  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: 'http://127.0.0.1:3000',

    // Collect trace when retrying the failed test.
    trace: 'on-first-retry',
  },
  // Configure projects for major browsers.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Build and serve the production app before the tests run. The integration
  // suite must run against a production build (the Next dev server does not
  // reliably hydrate under Playwright), and chaining the build in means a run
  // can never serve stale code. `reuseExistingServer` still lets you skip the
  // rebuild by leaving a server running on :3000 locally.
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://127.0.0.1:3000',
    // A cold production build can exceed Playwright's 60s webServer default.
    timeout: 180_000,
    reuseExistingServer: !process.env['CI'],
  },
})
