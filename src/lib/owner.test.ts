import { describe, expect, it } from 'vitest'
import { cartOwnerKey } from './owner'

describe('cart owner', () => {
  it('scopes a cart to the user or the guest', () => {
    expect(cartOwnerKey('user_ada')).toBe('user:user_ada')
    expect(cartOwnerKey(null)).toMatch(/^guest:[\w-]+$/)
  })
})
