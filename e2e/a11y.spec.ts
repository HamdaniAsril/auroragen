import { expect, test } from '@playwright/test'

test.use({ locale: 'id-ID' })

type StudioWindow = Window & { __studio: { getState(): { scene: { camera: { lens: number } } } } }

test('keyboard can change a slider', async ({ page }) => {
  await page.goto('/')
  const lens = page.getByRole('slider', { name: 'Lensa' })
  await lens.focus()
  await page.keyboard.press('ArrowRight')
  expect(await page.evaluate(() => (window as unknown as StudioWindow).__studio.getState().scene.camera.lens)).toBe(18)
})

test('reduced motion starts paused', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Putar' })).toBeVisible()
})

test('unsupported browsers get a message', async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      return type === 'webgl2' ? null : (orig as (...a: unknown[]) => RenderingContext | null).call(this, type, ...rest)
    } as typeof orig
  })
  await page.goto('/')
  await expect(page.getByText('Browser ini tidak mendukung WebGL2', { exact: false })).toBeVisible()
})
