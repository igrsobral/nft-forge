import type { Quote } from '@/contracts/commerce'
import { eqEth, mulEth, toEth } from '@/lib/money'
import Decimal from 'decimal.js'
import type { Scenario } from './scenario'
import type { CartRecord, NftRecord, ReceiptLineRecord } from './seed'

export const NETWORK_FEE_ETH = '0.0015'

const coupons: Record<string, { percent: string; expiresAt: string }> = {
  WELCOME10: { percent: '0.10', expiresAt: '2027-01-01T00:00:00.000Z' },
  ARCHIVE5: { percent: '0.05', expiresAt: '2027-06-01T00:00:00.000Z' },
  SPRING24: { percent: '0.20', expiresAt: '2024-06-01T00:00:00.000Z' },
}

export function findNft(nfts: NftRecord[], nftId: string): NftRecord | undefined {
  return nfts.find((nft) => nft.id === nftId)
}

export function findEdition(nft: NftRecord, editionId: string) {
  return nft.editions.find((edition) => edition.id === editionId)
}

export function quoteCart(
  nfts: NftRecord[],
  cart: CartRecord,
  couponCode: string | undefined,
  scenario: Scenario,
  now = Date.now(),
): Quote {
  if (cart.items.length === 0) {
    return {
      lines: [],
      subtotalEth: '0',
      discountEth: '0',
      networkFeeEth: '0',
      totalEth: '0',
      coupon: null,
      availabilityOk: true,
      issues: [],
    }
  }

  const lines: ReceiptLineRecord[] = []
  const issues: Quote['issues'] = []
  let subtotal = new Decimal(0)

  for (const item of cart.items) {
    const nft = findNft(nfts, item.nftId)
    const edition = nft ? findEdition(nft, item.editionId) : undefined
    if (!nft || !edition) {
      issues.push({
        code: 'missing',
        nftId: item.nftId,
        editionId: item.editionId,
        message: 'That edition is no longer in the catalog.',
      })
      continue
    }
    if (edition.remaining < item.quantity) {
      issues.push({
        code: 'sold_out',
        nftId: nft.id,
        editionId: edition.id,
        message: `${nft.name} (${edition.name}) does not have ${item.quantity} left.`,
      })
    }
    const lineTotal = mulEth(edition.priceEth, item.quantity)
    subtotal = subtotal.plus(lineTotal)
    lines.push({
      nftId: nft.id,
      editionId: edition.id,
      name: nft.name,
      editionName: edition.name,
      quantity: item.quantity,
      unitPriceEth: edition.priceEth,
      lineTotalEth: lineTotal,
    })
  }

  const subtotalEth = toEth(subtotal)
  const coupon = evaluateCoupon(couponCode, subtotalEth, scenario, now)
  const discountEth = coupon?.valid ? coupon.discountEth : '0'
  const networkFeeEth = NETWORK_FEE_ETH
  const totalEth = toEth(new Decimal(subtotalEth).minus(discountEth).plus(networkFeeEth))

  return {
    lines,
    subtotalEth,
    discountEth,
    networkFeeEth,
    totalEth,
    coupon,
    availabilityOk: issues.length === 0,
    issues,
  }
}

function evaluateCoupon(
  couponCode: string | undefined,
  subtotalEth: string,
  scenario: Scenario,
  now: number,
): Quote['coupon'] {
  if (!couponCode) return null
  if (scenario === 'invalid_coupon') {
    return { code: couponCode, valid: false, reason: 'invalid', discountEth: '0' }
  }
  if (scenario === 'expired_coupon') {
    return { code: couponCode, valid: false, reason: 'expired', discountEth: '0' }
  }
  const coupon = coupons[couponCode.trim().toUpperCase()]
  if (!coupon) return { code: couponCode, valid: false, reason: 'invalid', discountEth: '0' }
  if (Date.parse(coupon.expiresAt) <= now) {
    return { code: couponCode, valid: false, reason: 'expired', discountEth: '0' }
  }
  return {
    code: couponCode.trim().toUpperCase(),
    valid: true,
    reason: null,
    discountEth: mulEth(subtotalEth, coupon.percent),
  }
}

export function totalsMatch(left: string, right: string): boolean {
  return eqEth(left, right)
}
