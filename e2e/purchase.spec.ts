import { expect, test } from '@playwright/test'

test('signs in, checks out, and shows the confirmed receipt', async ({ page }) => {
  await page.goto('/?reset=1')
  await page.goto('/login')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('E-mail').fill('ada@collector.dev')
  await dialog.getByLabel('Senha', { exact: true }).fill('orchid-harbor')
  await dialog.locator('form').getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: /seja dono/i })).toBeVisible()

  await page.goto('/nfts/nft_01')
  await page.getByRole('button', { name: /comprar/i }).click()
  await expect(page.getByTestId('cart-item')).toBeVisible()
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible()
  await page.getByRole('checkbox', { name: /I confirm this total/ }).check()
  await page.getByRole('button', { name: /confirm purchase|confirmar compra/i }).click()
  await expect(page.getByTestId('order-status')).toHaveText('confirmed', { timeout: 15_000 })
  await expect(page.getByTestId('tx-ref')).toBeVisible()
})
