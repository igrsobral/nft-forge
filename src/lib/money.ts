import Decimal from 'decimal.js'

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP })

export function toEth(value: Decimal.Value): string {
  const fixed = new Decimal(value).toDecimalPlaces(18, Decimal.ROUND_HALF_UP).toFixed(18)
  const [whole, fraction = ''] = fixed.split('.')
  const trimmed = fraction.replace(/0+$/, '')
  return trimmed.length > 0 ? `${whole ?? '0'}.${trimmed}` : (whole ?? '0')
}

export function addEth(left: string, right: string): string {
  return toEth(new Decimal(left).plus(right))
}

export function subEth(left: string, right: string): string {
  return toEth(new Decimal(left).minus(right))
}

export function mulEth(left: string, right: Decimal.Value): string {
  return toEth(new Decimal(left).mul(right))
}

export function cmpEth(left: string, right: string): number {
  return new Decimal(left).cmp(right)
}

export function eqEth(left: string, right: string): boolean {
  return new Decimal(left).eq(right)
}

export function formatEth(value: string, maxFraction = 4): string {
  const fixed = new Decimal(value)
    .toDecimalPlaces(maxFraction, Decimal.ROUND_HALF_UP)
    .toFixed(maxFraction)
  const [whole, fraction = ''] = fixed.split('.')
  const trimmed = fraction.replace(/0+$/, '')
  const shown = trimmed.length > 0 ? `${whole ?? '0'}.${trimmed}` : (whole ?? '0')
  return `${shown} ETH`
}
