import { describe, expect, it } from 'vitest'
import { NETWORK_FEE_ETH, quoteCart, totalsMatch } from './pricing'
import type { NftRecord } from './seed'

function nft(remaining = 10): NftRecord {
  return {
    id: 'nft_01',
    slug: 'aurora',
    name: 'Aurora Relic',
    description: '',
    collectionId: 'lumen',
    collectionName: 'Lumen',
    category: 'Arte digital',
    network: 'ethereum',
    creator: 'Ada',
    imageHue: 20,
    priceEth: '0.80',
    previousPriceEth: null,
    rarity: 'comum',
    editions: [
      {
        id: 'ed_open',
        name: 'ABERTA',
        label: 'ABERTA',
        supply: 10,
        remaining,
        priceEth: '0.80',
      },
    ],
    tokenId: '#0001',
    attributes: ['Raro'],
    rating: 4,
    reviews: [],
    contractAddress: '0xabc',
    networkNote: '',
    contractNote: '',
    royaltyNote: '',
    favoritesCount: 1,
    version: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

const cart = {
  ownerKey: 'user:ada',
  updatedAt: '2026-01-01T00:00:00.000Z',
  items: [
    {
      id: 'line',
      nftId: 'nft_01',
      editionId: 'ed_open',
      quantity: 2,
      addedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
}

describe('quote, coupons, and fees', () => {
  const now = Date.parse('2026-07-29T00:00:00.000Z')

  it('returns a zero quote for an empty cart', () => {
    const quote = quoteCart([], { ...cart, items: [] }, undefined, 'success', now)
    expect(quote.totalEth).toBe('0')
    expect(quote.networkFeeEth).toBe('0')
    expect(quote.coupon).toBeNull()
  })

  it('applies WELCOME10 and ARCHIVE5, and rejects expired or unknown codes', () => {
    const welcome = quoteCart([nft()], cart, 'welcome10', 'success', now)
    expect(welcome.subtotalEth).toBe('1.6')
    expect(welcome.discountEth).toBe('0.16')
    expect(welcome.networkFeeEth).toBe(NETWORK_FEE_ETH)
    expect(welcome.totalEth).toBe('1.4415')
    expect(welcome.coupon).toMatchObject({ valid: true, code: 'WELCOME10' })

    const archive = quoteCart([nft()], cart, 'ARCHIVE5', 'success', now)
    expect(archive.discountEth).toBe('0.08')

    const expired = quoteCart([nft()], cart, 'SPRING24', 'success', now)
    expect(expired.coupon).toMatchObject({ valid: false, reason: 'expired', discountEth: '0' })
    expect(expired.totalEth).toBe('1.6015')

    const invalid = quoteCart([nft()], cart, 'NOPE', 'success', now)
    expect(invalid.coupon).toMatchObject({ valid: false, reason: 'invalid' })
  })

  it('forces coupon scenarios and flags missing or sold-out editions', () => {
    expect(quoteCart([nft()], cart, 'WELCOME10', 'invalid_coupon', now).coupon?.reason).toBe(
      'invalid',
    )
    expect(quoteCart([nft()], cart, 'WELCOME10', 'expired_coupon', now).coupon?.reason).toBe(
      'expired',
    )
    const sold = quoteCart([nft(1)], cart, undefined, 'success', now)
    expect(sold.availabilityOk).toBe(false)
    expect(sold.issues[0]?.code).toBe('sold_out')
    const missing = quoteCart([], cart, undefined, 'success', now)
    expect(missing.issues[0]?.code).toBe('missing')
    expect(totalsMatch('1.0', '1')).toBe(true)
    expect(totalsMatch('1', '1.1')).toBe(false)
  })
})
