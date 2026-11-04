import { describe, expect, it, vi } from 'vitest'
import { requireSession, safeRedirect } from './auth'
import { clearStoredSession, setStoredSession } from './storage'

describe('session gate', () => {
  it('allows only same-origin paths', () => {
    expect(safeRedirect('/checkout?coupon=WELCOME10')).toBe('/checkout?coupon=WELCOME10')
    expect(safeRedirect('https://evil.test')).toBe('/')
    expect(safeRedirect('//evil.test')).toBe('/')
    expect(safeRedirect(undefined)).toBe('/')
  })

  it('redirects anonymous visitors to the login modal and lets a stored token through', () => {
    clearStoredSession()
    expect(() => requireSession('/checkout')).toThrowError(
      expect.objectContaining({
        options: expect.objectContaining({
          to: '/',
          search: { auth: 'login', next: '/checkout' },
        }),
      }),
    )
    expect(() => requireSession('/')).toThrowError(
      expect.objectContaining({
        options: expect.objectContaining({ search: { auth: 'login' } }),
      }),
    )
    setStoredSession('token', 'user_ada')
    expect(() => requireSession('/profile')).not.toThrow()
    clearStoredSession()
    vi.unstubAllGlobals()
  })
})
