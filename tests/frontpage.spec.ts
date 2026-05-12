import { expect, test } from '@playwright/test'

test('should be able to render /', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
})

test('show shorts toggle should stay in sync with browser history', async ({ page }) => {
  await page.goto('/')

  const showShortsToggle = page.getByRole('checkbox', { name: 'Show shorts' })
  await expect(showShortsToggle).not.toBeChecked()

  await page.goto('/?showShorts=1')
  await expect(showShortsToggle).toBeChecked()

  await page.goBack()
  await expect(showShortsToggle).not.toBeChecked()

  await page.goForward()
  await expect(showShortsToggle).toBeChecked()
})

test('show shorts toggle should update URL state', async ({ page }) => {
  await page.goto('/?showShorts=1')
  const showShortsToggle = page.getByRole('checkbox', { name: 'Show shorts' })
  await expect(showShortsToggle).toBeChecked()

  await showShortsToggle.click()
  await expect(showShortsToggle).not.toBeChecked()
  await expect(page).toHaveURL('/')
})
