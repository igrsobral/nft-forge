import { describe, expect, it } from 'vitest'
import { loginBodySchema, passwordChangeSchema, registerBodySchema } from './account'
import { nftListQuerySchema, reviewSchema } from './catalog'
import { cartAddSchema, orderSchema } from './commerce'
import { apiErrorEnvelopeSchema, ethAmountSchema, walletAddressSchema } from './common'
import { editorialPostDetailSchema, editorialPostSchema, editorialPromoSchema } from './editorial'
import { nftUpdatedEventSchema, orderUpdatedEventSchema } from './events'

describe('Zod contracts', () => {
  it('accepts decimal ETH strings and rejects numbers and padded integers', () => {
    expect(ethAmountSchema.safeParse('0.08').success).toBe(true)
    expect(ethAmountSchema.safeParse('0').success).toBe(true)
    expect(ethAmountSchema.safeParse('01').success).toBe(false)
    expect(ethAmountSchema.safeParse('1.2.3').success).toBe(false)
    expect(ethAmountSchema.safeParse(0.08).success).toBe(false)
  })

  it('parses catalog search and rejects a bad review rating', () => {
    expect(
      nftListQuerySchema.parse({ page: '3', pageSize: '100', network: 'solana' }),
    ).toMatchObject({
      page: 3,
      pageSize: 9,
      network: 'solana',
    })
    expect(
      reviewSchema.safeParse({ id: 'r', author: 'Ada', rating: 6, body: 'x', createdAt: 't' })
        .success,
    ).toBe(false)
  })

  it('caps a cart add at 20 and checks registration and passwords', () => {
    expect(
      cartAddSchema.safeParse({ nftId: 'nft_01', editionId: 'ed', quantity: 21 }).success,
    ).toBe(false)
    const mismatch = registerBodySchema.safeParse({
      username: 'Nova',
      email: 'nova@collector.dev',
      password: 'orchid-harbor',
      confirmPassword: 'other-pass',
    })
    expect(mismatch.success).toBe(false)
    expect(loginBodySchema.safeParse({ email: 'ada', password: '' }).success).toBe(false)
    const password = passwordChangeSchema.safeParse({
      currentPassword: 'orchid-harbor',
      newPassword: 'short',
      confirmPassword: 'short',
    })
    expect(password.success).toBe(false)
  })

  it('requires an EVM address and a known order status', () => {
    expect(walletAddressSchema.safeParse(`0x${'a'.repeat(40)}`).success).toBe(true)
    expect(walletAddressSchema.safeParse('not-an-address').success).toBe(false)
    expect(
      orderSchema.safeParse({
        id: 'ord',
        status: 'confirmed',
        version: 2,
        walletId: 'wal',
        network: 'ethereum',
        txRef: '0xabc',
        explorerUrl: null,
        receipt: {
          lines: [],
          subtotalEth: '0',
          discountEth: '0',
          networkFeeEth: '0.0015',
          totalEth: '0.0015',
          couponCode: null,
          purchasedAt: '2026-07-29T12:00:00.000Z',
        },
        createdAt: '2026-07-29T12:00:00.000Z',
        updatedAt: '2026-07-29T12:00:00.000Z',
      }).success,
    ).toBe(true)
    expect(orderUpdatedEventSchema.safeParse({ status: 'timeout' }).success).toBe(false)
  })

  it('accepts only known editorial categories and a positive reading time', () => {
    expect(
      editorialPostSchema.safeParse({
        slug: 'prova-de-trabalho',
        title: 'Título',
        excerpt: 'Resumo',
        category: 'Criadores',
        dateLabel: '12 de setembro',
        readingMinutes: 6,
        imageUrl: 'data:image/svg+xml;base64,AAAA',
      }).success,
    ).toBe(true)
    expect(
      editorialPostSchema.safeParse({
        slug: 'prova-de-trabalho',
        title: 'Título',
        excerpt: 'Resumo',
        category: 'Guias',
        dateLabel: '12 de setembro',
        readingMinutes: 6,
        imageUrl: 'x',
      }).success,
    ).toBe(false)
    expect(
      editorialPostSchema.safeParse({
        slug: 'prova-de-trabalho',
        title: 'Título',
        excerpt: 'Resumo',
        category: 'Mercado',
        dateLabel: '12 de setembro',
        readingMinutes: 0,
        imageUrl: 'x',
      }).success,
    ).toBe(false)
    expect(
      editorialPromoSchema.safeParse({ kind: 'genesis', title: 'T', excerpt: 'E', imageUrl: 'x' })
        .success,
    ).toBe(true)
    expect(
      editorialPostDetailSchema.safeParse({
        slug: 'prova-de-trabalho',
        title: 'Título',
        excerpt: 'Resumo',
        category: 'NFTs',
        dateLabel: '12 de setembro',
        readingMinutes: 6,
        imageUrl: 'x',
        body: [],
      }).success,
    ).toBe(false)
  })

  it('parses socket payloads and error envelopes', () => {
    expect(
      nftUpdatedEventSchema.safeParse({
        eventId: 'evt_1',
        nftId: 'nft_01',
        version: 2,
        priceEth: '0.1',
        editions: [{ id: 'ed', remaining: 3, priceEth: '0.1' }],
        emittedAt: '2026-07-29T12:00:00.000Z',
      }).success,
    ).toBe(true)
    expect(
      apiErrorEnvelopeSchema.parse({
        error: { code: 'not_found', message: 'missing', requestId: 'req' },
      }).error.details,
    ).toEqual([])
  })
})
