import { expect, type Page } from '@playwright/test'

export async function signIn(page: Page, email = 'ada@collector.dev', password = 'orchid-harbor') {
  await page.goto('/?reset=1&scenario=success')
  await page.goto('/login')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('E-mail').fill(email)
  await dialog.getByLabel('Senha', { exact: true }).fill(password)
  await dialog.locator('form').getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: /seja dono/i })).toBeVisible()
}

export async function addEdition(page: Page, nftId = 'nft_01') {
  await page.goto(`/nfts/${nftId}`)
  await page.getByRole('button', { name: /comprar/i }).click()
  await expect(page.getByTestId('cart-item')).toBeVisible()
}
