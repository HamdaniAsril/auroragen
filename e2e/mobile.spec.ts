import { expect, test } from '@playwright/test'

test.use({ locale: 'id-ID' })

test('phone layout has no horizontal scroll and a working sheet', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await expect(page.getByRole('img', { name: /aurora/i })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  await page.getByRole('tab', { name: 'Kamera' }).click()
  await expect(page.getByRole('slider', { name: /Sudut kamera/ })).toBeVisible()
  await page.getByRole('tab', { name: 'Ekspor' }).click()
  await expect(page.getByRole('button', { name: 'Ekspor' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
})
