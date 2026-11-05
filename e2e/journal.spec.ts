import { expect, test } from '@playwright/test'

test('shows the promo duo and the journal after the catalog pagination', async ({ page }) => {
  await page.goto('/?reset=1')
  await expect(page.getByTestId('nft-card').first()).toBeVisible()

  const promos = page.getByRole('region', { name: 'Destaques da plataforma' })
  await expect(promos.getByRole('article')).toHaveCount(2)
  await expect(promos.getByRole('heading', { name: /Lançamentos gênese/ })).toBeVisible()
  await expect(promos.getByRole('link', { name: 'Explorar lançamentos gênese' })).toBeVisible()

  const journal = page.getByRole('region', { name: 'Diário da Cunhagem' })
  await expect(journal.getByRole('heading', { level: 2, name: 'Diário da Cunhagem' })).toBeVisible()
  await expect(journal.getByRole('article')).toHaveCount(4)
  await expect(journal.getByRole('article').filter({ hasText: 'Raridade' })).toContainText(
    'Leitura de 3 min',
  )

  await promos.getByRole('link', { name: 'Explorar lançamentos gênese' }).click()
  await expect(page).toHaveURL(/tab=new/)
  await expect(page).toHaveURL(/#catalogo/)
})

test('opens a journal article and returns to the diary', async ({ page }) => {
  await page.goto('/?reset=1')
  const article = page
    .getByRole('region', { name: 'Diário da Cunhagem' })
    .getByRole('article')
    .filter({ hasText: 'Raridade, atributos e procedência' })
  await article.getByRole('link', { name: /ler mais: raridade/i }).click()

  await expect(page).toHaveURL(/\/journal\/raridade-atributos-e-procedencia/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Raridade, atributos e procedência' }),
  ).toBeVisible()
  await expect(
    page.getByText(/Atributo raro sem procedência limpa é desconto disfarçado/),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Voltar ao diário' }).click()
  await expect(page).toHaveURL(/#journal/)
})

test('shows the missing state for an unknown slug', async ({ page }) => {
  await page.goto('/journal/inexistente')
  await expect(page.getByRole('heading', { level: 1, name: 'Artigo não encontrado' })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar ao diário' }).click()
  await expect(page).toHaveURL(/#journal/)
})
