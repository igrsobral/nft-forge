import { expect, test } from '@playwright/test'
import { addEdition, goToPayment, signIn } from './support'

test('mobile hero advances with a horizontal swipe', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 1440) >= 1024, 'Mobile interaction')
  await page.goto('/?reset=1&scenario=success')
  const hero = page.getByRole('link', { name: /Ver / }).first()
  await expect(hero).toBeVisible()
  const initialHref = await hero.getAttribute('href')
  const box = await hero.boundingBox()
  if (!initialHref || !box) throw new Error('O destaque não tem área visível para o gesto.')

  const startX = box.x + box.width * 0.8
  const endX = box.x + box.width * 0.2
  const y = box.y + box.height / 2
  await hero.dispatchEvent('pointerdown', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    clientX: startX,
    clientY: y,
  })
  await hero.dispatchEvent('pointerup', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    clientX: endX,
    clientY: y,
  })

  await expect(page.getByRole('link', { name: /Ver / }).first()).not.toHaveAttribute(
    'href',
    initialHref,
  )
  expect(new URL(page.url()).pathname).toBe('/')
})

test('mobile checkout lets the collector select a wallet provider', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 1440) >= 1024, 'Mobile checkout')
  await signIn(page)
  await addEdition(page)
  await goToPayment(page)

  const metamask = page.getByRole('radio', { name: 'MetaMask' })
  const coinbase = page.getByRole('radio', { name: 'Coinbase Wallet' })
  await expect(metamask).toBeEnabled()
  await metamask.check()
  await expect(metamask).toBeChecked()
  await coinbase.check()
  await expect(coinbase).toBeChecked()
})
