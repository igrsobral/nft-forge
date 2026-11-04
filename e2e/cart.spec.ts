import { expect, test } from '@playwright/test'

test('changes quantity, validates coupons, opens checkout, and removes the item', async ({
  page,
}) => {
  await page.goto('/?reset=1')
  await page.goto('/login')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('E-mail').fill('ada@collector.dev')
  await dialog.getByLabel('Senha', { exact: true }).fill('orchid-harbor')
  await dialog.locator('form').getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: /seja dono do futuro/i })).toBeVisible()

  await page.goto('/nfts/nft_01')
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  const item = page.getByTestId('cart-item')
  await expect(item).toBeVisible()
  await expect(item).toContainText('ID do token:')
  await expect(
    page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Mercado' }),
  ).toHaveAttribute('aria-current', 'page')

  await item.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await expect(item.getByTestId('cart-quantity')).toHaveText('2')
  await item.getByRole('button', { name: 'Diminuir quantidade' }).click()
  await expect(item.getByTestId('cart-quantity')).toHaveText('1')

  await page.getByLabel('Código promocional').fill('WELCOME10')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByTestId('quote-discount')).not.toHaveText('(-) 0 ETH')

  await page.getByLabel('Código promocional').fill('NOPE')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByTestId('coupon-error')).toHaveText('Esse código não é válido.')

  await page.getByLabel('Código promocional').fill('SPRING24')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByTestId('coupon-error')).toHaveText('Esse código expirou.')

  await page.getByLabel('Código promocional').fill('ARCHIVE5')
  await page.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page.getByTestId('coupon-error')).toHaveCount(0)
  await expect(page.getByTestId('quote-discount')).not.toHaveText('(-) 0 ETH')

  await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible()

  await page.goBack()
  await page.getByRole('button', { name: 'Remover Aurora Relic' }).click()
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
})
