import { expect, test, type Locator, type Page } from '@playwright/test'

type StudioWindow = Window & { __studio: { getState(): { scene: { camera: { yaw: number } } } } }

/** Mean luma (0–255) of an element, decoded in the browser from a Playwright screenshot. */
async function elementLuma(page: Page, el: Locator): Promise<number> {
  const b64 = (await el.screenshot()).toString('base64')
  return page.evaluate(async (data) => {
    const img = new Image()
    img.src = `data:image/png;base64,${data}`
    await img.decode()
    const c = document.createElement('canvas')
    c.width = img.width
    c.height = img.height
    const ctx = c.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const px = ctx.getImageData(0, 0, c.width, c.height).data
    let s = 0
    for (let i = 0; i < px.length; i += 4) s += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]
    return s / (px.length / 4)
  }, b64)
}

test('studio opens with a rendered aurora', async ({ page }) => {
  await page.goto('/')
  const canvas = page.getByRole('img', { name: /aurora/i })
  await expect(canvas).toBeVisible()
  await page.waitForTimeout(1500)
  expect(await elementLuma(page, canvas)).toBeGreaterThan(8)
})

test('undo shortcut reverts a camera drag', async ({ page }) => {
  await page.goto('/')
  const box = (await page.getByRole('img', { name: /aurora/i }).boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 5 })
  await page.mouse.up()
  const yaw = () => page.evaluate(() => (window as unknown as StudioWindow).__studio.getState().scene.camera.yaw)
  expect(await yaw()).not.toBe(0)
  await page.keyboard.press('Control+z')
  expect(await yaw()).toBe(0)
})
