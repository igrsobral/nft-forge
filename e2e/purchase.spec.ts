import { expect, test } from '@playwright/test'

test('signs in, checks out, and shows the confirmed receipt', async ({ page }) => {
  await page.goto('/?reset=1')
  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@collector.dev')
  await page.getByLabel('Password').fill('orchid-harbor')
  await page.locator('#content').getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /seja dono do futuro/i })).toBeVisible()

  await page.goto('/nfts/nft_01')
  await page.getByRole('button', { name: 'Add to cart' }).click()
  await expect(page.getByTestId('cart-item')).toBeVisible()
  await page.getByRole('link', { name: 'Checkout' }).click()
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible()
  await page.getByRole('checkbox', { name: /I confirm this total/ }).check()
  await page.getByRole('button', { name: 'Confirm purchase' }).click()
  await expect(page.getByTestId('order-status')).toHaveText('confirmed', { timeout: 15_000 })
  await expect(page.getByTestId('tx-ref')).toBeVisible()
})
