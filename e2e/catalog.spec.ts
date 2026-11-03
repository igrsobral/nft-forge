import { expect, test } from '@playwright/test'

test('lists editions, keeps a filter in the url, and opens the detail', async ({ page }) => {
  await page.goto('/?reset=1')
  await expect(page.getByRole('heading', { name: 'Discover editions' })).toBeVisible()
  await expect(page.getByTestId('result-count')).toContainText('40 editions')
  await expect(page.getByTestId('nft-card')).toHaveCount(8)

  const filtersButton = page.getByRole('button', { name: 'Filters' })
  if (await filtersButton.isVisible()) {
    await filtersButton.click()
    await page.getByRole('dialog', { name: 'Filters' }).getByLabel('Category').selectOption('Photography')
  } else {
    await page.locator('#desktop-category').selectOption('Photography')
  }

  await expect(page).toHaveURL(/category=Photography/)
  await expect(page.getByTestId('result-count')).toContainText('10 editions')
  for (const card of await page.getByTestId('nft-card').all()) {
    await expect(card).toHaveAttribute('data-category', 'Photography')
  }

  const name = (
    await page.getByTestId('nft-card').first().getByTestId('nft-name').innerText()
  ).trim()
  await page.getByTestId('nft-card').first().click()
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  await expect(page).toHaveURL(/\/nfts\/nft_/)

  await expect(page.getByTestId('socket-status')).toHaveText('Live', { timeout: 15_000 })
  const price = page.getByTestId('nft-price')
  const before = (await price.innerText()).trim()
  await page.getByRole('button', { name: 'Simulate market move' }).click()
  await expect(price).not.toHaveText(before, { timeout: 10_000 })
  const after = (await price.innerText()).trim()

  await page.goBack()
  await expect(page).toHaveURL(/category=Photography/)
  await expect(
    page.getByTestId('nft-card').filter({ hasText: name }).getByTestId('nft-card-price'),
  ).toHaveText(after)
})
