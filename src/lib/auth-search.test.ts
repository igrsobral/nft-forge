import { describe, expect, it } from 'vitest'
import { hrefWithAuth, pickAuth } from './auth-search'

describe('auth search', () => {
  it('keeps login, signup, and forgot, and drops open redirects', () => {
    expect(pickAuth(undefined)).toEqual({})
    expect(pickAuth({ auth: 'signup', next: '/cart' })).toEqual({ auth: 'signup', next: '/cart' })
    expect(pickAuth({ auth: 'admin', next: '//evil.test' })).toEqual({})
    expect(pickAuth({ next: 'https://evil.test' })).toEqual({})
  })

  it('writes and clears the modal params on the current url', () => {
    window.history.replaceState({}, '', '/nfts/nft_01?q=relic#edicao')
    expect(hrefWithAuth('login', '/checkout')).toBe(
      '/nfts/nft_01?q=relic&auth=login&next=%2Fcheckout#edicao',
    )
    window.history.replaceState({}, '', '/nfts/nft_01?auth=login&next=%2Fcheckout')
    expect(hrefWithAuth(null)).toBe('/nfts/nft_01')
  })
})
