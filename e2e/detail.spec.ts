import { expect, test } from '@playwright/test'

test('selects an edition, changes quantity, favorites, and adds to the cart', async ({ page }) => {
  await page.goto('/?reset=1')
  await page.goto('/login')
  await page.getByLabel('Email').fill('ada@collector.dev')
  await page.getByLabel('Password').fill('orchid-harbor')
  await page.locator('#content').getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: /seja dono do futuro/i })).toBeVisible()

  await page.goto('/nfts/nft_03')
  await expect(page.getByRole('heading', { level: 1, name: 'Glass Orchard' })).toBeVisible()
  await expect(
    page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Mercado' }),
  ).toHaveAttribute('aria-current', 'page')

  await page.getByRole('button', { name: '1/50', exact: true }).click()
  await expect(page.getByRole('button', { name: '1/50', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await expect(page.getByTestId('quantity')).toHaveText('2')

  await page.getByRole('button', { name: 'Favoritar' }).click()
  await expect(page.getByRole('button', { name: 'Favorito' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.getByRole('tab', { name: /Avaliações de colecionadores/ }).click()
  await expect(page.getByTestId('review')).toHaveCount(3)

  await page.getByRole('button', { name: 'COMPRAR' }).click()
  const item = page.getByTestId('cart-item')
  await expect(item).toBeVisible()
  await expect(item).toContainText('1/50')
  await expect(item.getByTestId('cart-quantity')).toHaveText('2')
})

test('newsletter rejects an invalid email and accepts a valid one', async ({ page }) => {
  await page.goto('/?reset=1')
  const footer = page.getByRole('contentinfo')
  await footer.getByRole('button', { name: 'Enviar' }).click()
  await expect(
    page.locator('[data-sonner-toast]').filter({ hasText: 'Informe um e-mail válido.' }),
  ).toBeVisible()

  await footer.getByLabel('E-mail').fill('colecionador@kurio.test')
  await footer.getByRole('button', { name: 'Enviar' }).click()
  await expect(
    page.locator('[data-sonner-toast]').filter({ hasText: 'Inscrição confirmada.' }),
  ).toBeVisible()
})
