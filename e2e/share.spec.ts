import { expect, test } from '@playwright/test'

type Scene = { frame: unknown; camera: unknown; layers: unknown; land: unknown }
type StudioWindow = Window & { __studio: { getState(): { scene: Scene } } }
const readScene = () => (window as unknown as StudioWindow).__studio.getState().scene

test('link restores frame aspect and camera', async ({ page, browser }) => {
  await page.goto('/')
  const canvas = page.getByRole('img', { name: /aurora/i })
  const box = (await canvas.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 90, box.y + box.height / 2 + 40, { steps: 4 })
  await page.mouse.up()
  await page.getByRole('button', { name: 'Share' }).click()
  await expect(page).toHaveURL(/#s=/)
  const original = await page.evaluate(readScene)

  const phone = await browser.newContext({ viewport: { width: 375, height: 812 } })
  const p2 = await phone.newPage()
  await p2.goto(page.url())
  await p2.waitForFunction(() => '__studio' in window)
  const restored = await p2.evaluate(readScene)
  expect(restored.frame).toEqual(original.frame)
  expect(restored.camera).toEqual(original.camera)
  expect(restored.layers).toEqual(original.layers)
  expect(restored.land).toEqual(original.land)
  await phone.close()
})

test('broken link opens the default scene with a notice', async ({ page }) => {
  await page.goto('/#s=1.garbage')
  await expect(page.getByRole('status')).toHaveText("That link didn't work, opening the default scene")
  await expect(page.getByRole('img', { name: /aurora/i })).toBeVisible()
})
