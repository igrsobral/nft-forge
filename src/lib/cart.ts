export const CART_QUANTITY_CAP = 20

export type QuantityDecision =
  | { ok: true; quantity: number }
  | { ok: false; reason: 'stock' | 'cap' | 'invalid'; remaining: number }

/** Absolute quantity for a cart line, capped by stock and the per-line maximum. */
export function nextLineQuantity(
  current: number,
  requested: number,
  remaining: number,
): QuantityDecision {
  if (!Number.isInteger(requested) || requested < 1) {
    return { ok: false, reason: 'invalid', remaining }
  }
  const next = current + requested
  if (next > CART_QUANTITY_CAP) return { ok: false, reason: 'cap', remaining }
  if (next > remaining) return { ok: false, reason: 'stock', remaining }
  return { ok: true, quantity: next }
}

/** Guest-cart merge keeps the smaller of stock, the cap, and the combined quantity. */
export function mergedLineQuantity(current: number, incoming: number, remaining: number): number {
  const combined = current + Math.max(0, incoming)
  return Math.min(CART_QUANTITY_CAP, Math.max(0, remaining), Math.max(0, combined))
}
