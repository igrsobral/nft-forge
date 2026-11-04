import { describe, expect, it } from 'vitest'
import {
  clearStoredSession,
  emitSessionExpired,
  getGuestId,
  getSessionEpoch,
  getStoredToken,
  getStoredUserId,
  onSessionExpired,
  readStorage,
  setStoredSession,
  subscribeSession,
  writeStorage,
} from './storage'

describe('session storage', () => {
  it('stores and clears the token, and notifies subscribers', () => {
    let seen = 0
    const stop = subscribeSession(() => {
      seen += 1
    })
    const before = getSessionEpoch()
    setStoredSession('tok', 'user_ada')
    expect(getStoredToken()).toBe('tok')
    expect(getStoredUserId()).toBe('user_ada')
    expect(getSessionEpoch()).toBe(before + 1)
    clearStoredSession()
    expect(getStoredToken()).toBeNull()
    expect(seen).toBe(2)
    stop()
  })

  it('reuses a guest id and expires the session', () => {
    const first = getGuestId()
    expect(getGuestId()).toBe(first)
    let expired = 0
    const stop = onSessionExpired(() => {
      expired += 1
    })
    setStoredSession('tok', 'user_ada')
    emitSessionExpired()
    expect(getStoredToken()).toBeNull()
    expect(expired).toBe(1)
    stop()
    emitSessionExpired()
    expect(expired).toBe(1)
  })

  it('returns null when storage throws', () => {
    const original = window.localStorage
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error('blocked')
        },
        setItem: () => {
          throw new Error('blocked')
        },
        removeItem: () => {
          throw new Error('blocked')
        },
      },
    })
    expect(readStorage('nft-market:token')).toBeNull()
    expect(() => writeStorage('nft-market:token', 'x')).not.toThrow()
    Object.defineProperty(window, 'localStorage', { configurable: true, value: original })
  })
})
