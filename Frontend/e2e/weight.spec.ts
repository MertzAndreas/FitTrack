import { deflateSync, crc32 } from 'node:zlib'
import { expect, test } from '@playwright/test'

/** A width×height RGB PNG, generated rather than committed as a fixture. */
function png(width: number, height: number): Buffer {
  const raw = Buffer.alloc((width * 3 + 1) * height)
  let at = 0
  for (let y = 0; y < height; y++) {
    raw[at++] = 0 // filter: none
    for (let x = 0; x < width; x++) {
      raw[at++] = (x * 5) % 256
      raw[at++] = (y * 3) % 256
      raw[at++] = 90
    }
  }

  const chunk = (type: string, data: Buffer) => {
    const head = Buffer.concat([Buffer.from(type), data])
    const out = Buffer.alloc(head.length + 8)
    out.writeUInt32BE(data.length, 0)
    head.copy(out, 4)
    out.writeUInt32BE(crc32(head), head.length + 4)
    return out
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // colour type: truecolour

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const list = (page) =>
  page.evaluate(() => fetch('/api/weight').then((r) => r.json()))

test('logs, edits and deletes a weight entry with a photo', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  // Record what the browser actually uploads, to prove it downsized.
  await page.addInitScript(() => {
    const sizes: number[] = []
    Object.defineProperty(window, '__uploadSizes', { value: sizes })
    const original = window.fetch
    window.fetch = (input, init) => {
      if (init?.body instanceof FormData) {
        for (const [, value] of init.body.entries()) {
          if (value instanceof Blob) sizes.push(value.size)
        }
      }
      return original(input, init)
    }
  })

  await page.goto('/weight')
  await expect(page.getByText('No entries yet')).toBeVisible()

  const addSheet = page.getByRole('dialog', { name: 'Log weight' })
  const editSheet = page.getByRole('dialog', { name: 'Edit entry' })

  // --- create ---
  await page.getByRole('button', { name: 'Log weight' }).click()
  await addSheet.locator('#add-weight').fill('78.4')
  await addSheet.locator('#add-measure-waist').fill('84')
  const source = png(2000, 1500)
  await addSheet.locator('input[type=file]').setInputFiles({
    name: 'photo.png',
    mimeType: 'image/png',
    buffer: source,
  })
  await expect(addSheet.locator('img').first()).toBeVisible()
  await addSheet.getByRole('button', { name: 'Add entry' }).click()

  await expect(page.locator('li button').first()).toBeVisible()
  let entries = await list(page)
  expect(entries).toHaveLength(1)
  expect(entries[0].weightKg).toBe(78.4)
  expect(entries[0].measurements).toEqual([{ kind: 'waist', valueCm: 84 }])
  expect(entries[0].photos).toHaveLength(1)

  // Client-side downsampling: the upload is far smaller than the source.
  const sizes = await page.evaluate(() => window.__uploadSizes)
  expect(sizes[0]).toBeGreaterThan(0)
  expect(sizes[0]).toBeLessThan(source.length / 2)

  // The stored photo is served as an image.
  const type = await page.evaluate(
    (url) => fetch(url).then((r) => r.headers.get('content-type')),
    entries[0].photos[0].url
  )
  expect(type).toBe('image/jpeg')

  // --- edit: change weight, drop the photo ---
  await page.locator('li button').first().click()
  await expect(editSheet.locator('#edit-weight')).toHaveValue('78.4')

  // The photo opens full screen and dismisses on Escape.
  await editSheet.getByRole('button', { name: 'View Photo 1' }).click()
  const viewer = page.getByRole('dialog', { name: 'Photo' })
  await expect(viewer).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(viewer).toBeHidden()

  await editSheet.locator('#edit-weight').fill('78')
  await editSheet.locator('button[aria-label^="Remove"]').first().click()
  await editSheet.getByRole('button', { name: 'Save' }).click()
  // The sheet closes only once the save (which is async) has finished.
  await expect(editSheet).toBeHidden()

  entries = await list(page)
  expect(entries[0].weightKg).toBe(78)
  expect(entries[0].photos).toHaveLength(0)

  // --- persists across a reload ---
  await page.reload()
  await expect(page.locator('li button').first()).toBeVisible()

  // --- delete ---
  await page.locator('li button').first().click()
  await editSheet.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('No entries yet')).toBeVisible()
  expect(await list(page)).toHaveLength(0)

  expect(errors).toEqual([])
})
