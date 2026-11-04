import { expect, test } from '@playwright/test'

test('lists editions, keeps a filter in the url, and opens the detail', async ({ page }) => {
  await page.goto('/?reset=1')
  await expect(page.getByRole('heading', { name: /seja dono do futuro/i })).toBeVisible()
  await expect(page.getByTestId('result-count')).toContainText('40 edições')
  await expect(page.getByTestId('nft-card')).toHaveCount(9)

  const filtersButton = page.getByRole('button', { name: 'Filtros' })
  if (await filtersButton.isVisible()) {
    await filtersButton.click()
    await page
      .getByRole('dialog', { name: 'Filtros' })
      .getByRole('button', { name: 'Fotografia' })
      .click()
  } else {
    await page.getByRole('button', { name: 'Fotografia' }).click()
  }

  await expect(page).toHaveURL(/category=Fotografia/)
  await expect(page.getByTestId('result-count')).toContainText('5 edições')
  for (const card of await page.getByTestId('nft-card').all()) {
    await expect(card).toHaveAttribute('data-category', 'Fotografia')
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
  await expect(page).toHaveURL(/category=Fotografia/)
  await expect(
    page.getByTestId('nft-card').filter({ hasText: name }).getByTestId('nft-card-price'),
  ).toHaveText(after)
})

test('keeps tab, sort, pagination, network, and price in the query string', async ({ page }) => {
  await page.goto('/?reset=1')
  await expect(page.getByTestId('nft-card')).toHaveCount(9)

  const firstName = (await page.getByTestId('nft-name').first().innerText()).trim()
  await page.getByRole('button', { name: '2', exact: true }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByRole('button', { name: '2', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.getByTestId('nft-card')).toHaveCount(9)
  await expect(page.getByTestId('nft-name').first()).not.toHaveText(firstName)

  await page.getByRole('tab', { name: 'Em alta' }).click()
  await expect(page).toHaveURL(/tab=trending/)
  await expect(page).not.toHaveURL(/page=2/)

  await page.getByLabel('Ordenar por').selectOption('price_desc')
  await expect(page).toHaveURL(/sort=price_desc/)

  await page.getByRole('tab', { name: 'Novos lançamentos' }).click()
  await expect(page).toHaveURL(/tab=new/)

  const mobileFilters = await page.getByRole('button', { name: 'Filtros' }).isVisible()
  const openFilters = async () => {
    if (!mobileFilters) return page.locator('#catalogo')
    await page.getByRole('button', { name: 'Filtros' }).click()
    return page.getByRole('dialog', { name: 'Filtros' })
  }

  const filters = await openFilters()
  await filters.getByRole('button', { name: 'Solana' }).click()
  await expect(page).toHaveURL(/network=solana/)

  const priceFilters = await openFilters()
  await priceFilters.getByLabel('Preço máximo').evaluate((element) => {
    const input = element as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, '500')
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await priceFilters.getByRole('button', { name: 'Aplicar' }).click()
  await expect(page).toHaveURL(/maxPrice=%225%22/)
  await expect(page.getByTestId('result-count')).toContainText('0 edições')
})
