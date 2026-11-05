import { expect, test } from '@playwright/test'

test('opens the login modal, rejects a bad password, and signs in', async ({ page }) => {
  await page.goto('/?reset=1')
  await page.getByRole('banner').getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/auth=login/)
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Entre para gerenciar sua carteira')

  await dialog.getByLabel('E-mail').fill('ada@collector.dev')
  await dialog.getByLabel('Senha', { exact: true }).fill('wrong-password')
  await dialog.locator('form').getByRole('button', { name: 'Entrar' }).click()
  await expect(dialog.getByRole('alert')).toHaveText('E-mail ou senha incorretos.')

  await dialog.getByLabel('Senha', { exact: true }).fill('orchid-harbor')
  await dialog.locator('form').getByRole('button', { name: 'Entrar' }).click()
  await expect(
    page
      .getByRole('link', { name: 'Perfil', exact: true })
      .or(page.getByRole('button', { name: 'Sair' }))
      .first(),
  ).toBeVisible()
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('switches modes, validates signup, rejects a duplicate, and creates an account', async ({
  page,
}) => {
  await page.goto('/?auth=signup&reset=1')
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByLabel('Nome de usuário')).toBeVisible()

  await dialog.getByRole('button', { name: /entrar|já tem uma conta/i }).click()
  await expect(page).toHaveURL(/auth=login/)
  await expect(dialog.getByRole('button', { name: 'Esqueceu a senha?' })).toBeVisible()
  await dialog.getByRole('button', { name: /criar perfil|crie uma conta/i }).click()
  await expect(page).toHaveURL(/auth=signup/)

  await dialog.getByLabel('Nome de usuário').fill('Nova')
  await dialog.getByLabel('E-mail').fill('nao-e-email')
  await dialog.getByLabel('Senha', { exact: true }).fill('curta')
  await dialog.getByLabel('Confirmar senha').fill('outra')
  await dialog.locator('form').getByRole('button', { name: 'Criar perfil' }).click()
  await expect(dialog.getByRole('alert')).toHaveText('Revise os dados da conta.')
  await expect(dialog.getByText('Informe um e-mail válido.')).toBeVisible()
  await expect(dialog.getByText('As senhas não coincidem.')).toBeVisible()

  await dialog.getByLabel('E-mail').fill('ada@collector.dev')
  await dialog.getByLabel('Senha', { exact: true }).fill('orchid-harbor')
  await dialog.getByLabel('Confirmar senha').fill('orchid-harbor')
  await dialog.locator('form').getByRole('button', { name: 'Criar perfil' }).click()
  await expect(dialog.getByText('Esse e-mail já está cadastrado.')).toBeVisible()

  await dialog.getByLabel('E-mail').fill(`nova-${Date.now()}@collector.dev`)
  await dialog.locator('form').getByRole('button', { name: 'Criar perfil' }).click()
  await expect(
    page
      .getByRole('link', { name: 'Perfil', exact: true })
      .or(page.getByRole('button', { name: 'Sair' }))
      .first(),
  ).toBeVisible()
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('asks for a password reset and refuses social login', async ({ page }) => {
  await page.goto('/?reset=1')
  await page.goto('/login')
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Continuar com Google' }).click()
  await expect(page.getByText('Não disponível na demo.')).toBeVisible()

  await dialog.getByRole('button', { name: 'Esqueceu a senha?' }).click()
  await expect(page).toHaveURL(/auth=forgot/)
  await dialog.getByLabel('E-mail').fill('ada@collector.dev')
  await dialog.getByRole('button', { name: 'Enviar link' }).click()
  await expect(page.getByText(/enviaremos um link para redefinir a senha/)).toBeVisible()
})

test('resumes checkout after the login modal', async ({ page }) => {
  await page.goto('/?reset=1')
  await page.goto('/nfts/nft_03')
  await page.getByRole('button', { name: 'Favoritar' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('E-mail').fill('ada@collector.dev')
  await dialog.getByLabel('Senha', { exact: true }).fill('orchid-harbor')
  await dialog.locator('form').getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('button', { name: 'Favorito' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.getByRole('button', { name: /comprar/i }).click()
  await expect(page).toHaveURL(/\/cart/)
  if ((page.viewportSize()?.width ?? 1440) < 1024) {
    await page.getByRole('link', { name: 'Perfil', exact: true }).click()
    await page.getByLabel('Seção do perfil').selectOption('sair')
  } else {
    await page.getByRole('button', { name: 'Sair' }).click()
  }
  await expect(page.getByRole('banner').getByRole('button', { name: 'Entrar' })).toBeVisible()

  await expect(page).toHaveURL(/\/$/)
  await page.goto('/nfts/nft_02')
  await page.getByRole('button', { name: /comprar/i }).click()
  await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('dialog').getByLabel('E-mail').fill('ada@collector.dev')
  await page.getByRole('dialog').getByLabel('Senha', { exact: true }).fill('orchid-harbor')
  await page.getByRole('dialog').locator('form').getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento com carteira' })).toBeVisible()
})

test('closes the modal with escape', async ({ page }) => {
  await page.goto('/?auth=login')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page).not.toHaveURL(/auth=/)
})
