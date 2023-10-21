import { expect, test } from '@playwright/test'
test('should be able to render /', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
})
