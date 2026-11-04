import { describe, expect, it } from 'vitest'
import { pickWallet } from './wallet'

describe('wallet selection', () => {
  const wallets = [
    { id: 'primary', label: 'Studio vault' },
    { id: 'secondary', label: 'Travel key' },
  ]

  it('uses the chosen wallet and otherwise the first saved one', () => {
    expect(pickWallet(wallets, 'secondary')?.label).toBe('Travel key')
    expect(pickWallet(wallets, '')?.id).toBe('primary')
    expect(pickWallet(wallets, 'missing')?.id).toBe('primary')
    expect(pickWallet([], 'primary')).toBeUndefined()
    expect(pickWallet(undefined, 'primary')).toBeUndefined()
  })
})
