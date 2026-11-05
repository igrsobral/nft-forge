import { expect, test } from '@playwright/test'

async function signIn(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/?reset=1')
  await page.goto('/login')
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('E-mail').fill(email)
  await dialog.getByLabel('Senha', { exact: true }).fill(password)
  await dialog.locator('form').getByRole('button', { name: 'Entrar' }).click()
  await expect(
    page
      .getByRole('link', { name: 'Perfil', exact: true })
      .or(page.getByRole('button', { name: 'Sair' }))
      .first(),
  ).toBeVisible()
}

test('edits the profile, rejects a bad password, and updates the avatar', async ({ page }) => {
  await signIn(page, 'ada@collector.dev', 'orchid-harbor')
  await page.goto('/profile')
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  await page.getByLabel('Nome de exibição').fill('Ada Colecionadora')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText('Perfil salvo')).toBeVisible()

  await page.getByRole('textbox', { name: 'Senha atual', exact: true }).fill('senha-errada')
  await page.getByRole('textbox', { name: 'Nova senha', exact: true }).fill('orchid-harbor')
  await page.getByRole('textbox', { name: 'Confirmar nova senha', exact: true }).fill('outra-senha')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText('As senhas não coincidem.')).toBeVisible()

  await page
    .getByRole('textbox', { name: 'Confirmar nova senha', exact: true })
    .fill('orchid-harbor')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText('A senha atual não confere.')).toBeVisible()

  await page.getByRole('textbox', { name: 'Senha atual', exact: true }).fill('orchid-harbor')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText('Senha alterada')).toBeVisible()

  await page.getByTestId('avatar-file').setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    ),
  })
  await expect(page.getByText('Avatar atualizado')).toBeVisible()
  await page.getByRole('button', { name: 'Remover' }).click()
  await expect(page.getByText('Avatar atualizado')).toBeVisible()
})

test('validates a wallet address and adds a secondary wallet', async ({ page }) => {
  await signIn(page, 'leo@collector.dev', 'marble-gallery')
  await page.goto('/profile/wallets')
  const primary = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Carteira principal' }) })
  const walletType = primary.getByLabel('Tipo de carteira')
  await walletType.selectOption('secondary')
  await expect(walletType).toHaveValue('secondary')
  await walletType.selectOption('primary')
  await expect(primary.getByText('ENS ou carteira secundária (opcional)')).not.toContainText('*')
  await primary.getByLabel('Endereço da carteira').fill('xyz')
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(primary.getByText(/Endereço inválido/)).toBeVisible()

  await primary.getByLabel('Endereço da carteira').fill(`0x${'ab'.repeat(20)}`)
  await primary.getByRole('button', { name: 'Salvar carteira' }).click()
  await expect(page.getByText('Carteira salva')).toBeVisible()

  await expect(page.getByText('Você ainda não adicionou uma carteira secundária.')).toBeVisible()
  await page.getByLabel('Igual à carteira principal').check()
  await page.getByRole('button', { name: 'Adicionar' }).last().click()
  await page.getByRole('button', { name: 'Salvar carteira' }).last().click()
  await expect(page.getByText('Você ainda não adicionou uma carteira secundária.')).toHaveCount(0)
})

test('lists favorites and accepts a support message', async ({ page }) => {
  await signIn(page, 'ada@collector.dev', 'orchid-harbor')
  await page.goto('/profile/watchlist')
  await expect(page.getByRole('link', { name: /Aurora Relic/ })).toBeVisible()
  await page.goto('/profile/activity')
  await expect(page.getByText('Nenhum pedido ainda.')).toBeVisible()
  await page.goto('/profile/support')
  await page.getByLabel('Assunto').fill('Dúvida')
  await page.getByLabel('Mensagem').fill('Quero saber como receber o NFT comprado.')
  await page.locator('main').getByRole('button', { name: 'Enviar' }).click()
  await expect(page.getByText('Mensagem enviada ao suporte')).toBeVisible()
})
