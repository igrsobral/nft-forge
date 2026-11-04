import { describe, expect, it } from 'vitest'
import { CART_QUANTITY_CAP, mergedLineQuantity, nextLineQuantity } from './cart'

describe('cart quantity', () => {
  it('adds until the stock or the cap of 20', () => {
    expect(nextLineQuantity(0, 2, 8)).toEqual({ ok: true, quantity: 2 })
    expect(nextLineQuantity(18, 3, 40)).toEqual({ ok: false, reason: 'cap', remaining: 40 })
    expect(nextLineQuantity(2, 4, 5)).toEqual({ ok: false, reason: 'stock', remaining: 5 })
    expect(nextLineQuantity(0, 0, 5)).toEqual({ ok: false, reason: 'invalid', remaining: 5 })
    expect(CART_QUANTITY_CAP).toBe(20)
  })

  it('replaces a line when the current quantity is zero', () => {
    expect(nextLineQuantity(0, 20, 20)).toEqual({ ok: true, quantity: 20 })
    expect(nextLineQuantity(0, 21, 30)).toEqual({ ok: false, reason: 'cap', remaining: 30 })
  })

  it('merges a guest line without passing stock or the cap', () => {
    expect(mergedLineQuantity(15, 10, 40)).toBe(20)
    expect(mergedLineQuantity(4, 4, 6)).toBe(6)
    expect(mergedLineQuantity(0, 0, 3)).toBe(0)
    expect(mergedLineQuantity(2, -1, 5)).toBe(2)
  })
})
