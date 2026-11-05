import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { signIn } from './support'

async function expectNoSeriousViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze()
  const serious = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  )
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([])
}

test('home, detail, cart, and login have no serious accessibility violations', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/?reset=1')
  await expect(page.getByRole('heading', { name: /seja dono/i })).toBeVisible()
  await expectNoSeriousViolations(page)

  await page.goto('/nfts/nft_01')
  await expect(page.getByRole('heading', { level: 1, name: 'Aurora Relic' })).toBeVisible()
  await expectNoSeriousViolations(page)

  await page.goto('/journal/raridade-atributos-e-procedencia')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Raridade, atributos e procedência' }),
  ).toBeVisible()
  await expectNoSeriousViolations(page)

  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  await expectNoSeriousViolations(page)

  await signIn(page)
  await page.goto('/?auth=login')
  await expect(page.getByRole('dialog')).toBeVisible()
  await expectNoSeriousViolations(page)
})
