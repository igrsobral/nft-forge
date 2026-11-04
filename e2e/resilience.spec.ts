import { expect, test } from '@playwright/test'
import { addEdition, signIn } from './support'

test('sends anonymous visitors away from protected routes and shows a 404', async ({ page }) => {
  await page.goto('/?reset=1')
  await page.goto('/checkout')
  await expect(page).toHaveURL(/auth=login/)
  await expect(page.getByRole('dialog')).toBeVisible()

  await page.goto('/profile')
  await expect(page).toHaveURL(/auth=login/)

  await page.goto('/no-such-room')
  await expect(page.getByRole('heading', { name: 'This page is not in the market' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Browse editions' })).toBeVisible()
})

test('shows catalog errors when the API is offline or unavailable', async ({ page }) => {
  await page.goto('/?reset=1&scenario=offline')
  await expect(page.getByRole('heading', { name: 'This page did not load' })).toBeVisible()
  await expect(page.getByText(/Connection failed/)).toBeVisible()

  await page.goto('/?reset=1&scenario=http_error')
  await expect(page.getByRole('heading', { name: 'This page did not load' })).toBeVisible()
  await expect(page.getByText('The marketplace is temporarily unavailable.')).toBeVisible()
})

test('clears an expired session and keeps the cart when payment is declined', async ({ page }) => {
  await signIn(page)
  await page.evaluate(() => localStorage.setItem('nft-market:scenario', 'expired_session'))
  await page.goto('/cart')
  await expect(page.getByText('Your session expired. Sign in again to continue.')).toBeVisible()
  await expect(page.getByRole('banner').getByRole('button', { name: 'Entrar' })).toBeVisible()

  await signIn(page)
  await addEdition(page)
  await page.evaluate(() => localStorage.setItem('nft-market:scenario', 'payment_declined'))
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await page.getByRole('checkbox', { name: /I confirm this total/ }).check()
  await page.getByRole('button', { name: /confirm purchase|confirmar compra/i }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
  await expect(page.getByTestId('order-status')).toHaveText('declined')
  await page.goto('/cart')
  await expect(page.getByTestId('cart-item')).toBeVisible()
})

test('retries a timed-out order with the same idempotency key', async ({ page }) => {
  test.setTimeout(45_000)
  await signIn(page)
  await addEdition(page)
  await page.evaluate(() => localStorage.setItem('nft-market:scenario', 'order_timeout'))
  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await page.getByRole('checkbox', { name: /I confirm this total/ }).check()
  await page.getByRole('button', { name: /confirm purchase|confirmar compra/i }).click()
  await expect(page.getByText(/timed out/)).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: /confirm purchase|confirmar compra/i }).click()
  await expect(
    page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
  ).toBeVisible()
})
