import axios from 'axios'
import { afterEach, describe, expect, it } from 'vitest'
import { api } from './client'
import {
  clearStoredSession,
  getStoredToken,
  onSessionExpired,
  setStoredSession,
} from '@/lib/storage'

afterEach(() => {
  api.defaults.adapter = undefined
  clearStoredSession()
})

describe('axios client', () => {
  it('sends the guest id and the bearer token', async () => {
    setStoredSession('tok_ada', 'user_ada')
    let authorization = ''
    let guest = ''
    api.defaults.adapter = (config) => {
      const headers = axios.AxiosHeaders.from(config.headers)
      authorization = headers.get('Authorization')?.toString() ?? ''
      guest = headers.get('X-Guest-Id')?.toString() ?? ''
      return Promise.resolve({
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      })
    }
    await api.get('/ping')
    expect(authorization).toBe('Bearer tok_ada')
    expect(guest.length).toBeGreaterThan(8)
  })

  it('clears the session when the API says it expired', async () => {
    setStoredSession('tok_ada', 'user_ada')
    let expired = 0
    const stop = onSessionExpired(() => {
      expired += 1
    })
    api.defaults.adapter = (config) => {
      const error = new axios.AxiosError('expired')
      error.response = {
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
        data: {
          error: {
            code: 'invalid_session',
            message: 'Your session has expired. Sign in again to continue.',
            details: [],
            requestId: 'req_expired',
          },
        },
      }
      return Promise.reject(error)
    }
    await expect(api.get('/cart')).rejects.toMatchObject({ code: 'invalid_session', status: 401 })
    expect(getStoredToken()).toBeNull()
    expect(expired).toBe(1)
    stop()
  })

  it('does not clear the session when the request is aborted', async () => {
    setStoredSession('tok_ada', 'user_ada')
    api.defaults.adapter = () => Promise.reject(new axios.CanceledError('aborted'))
    await expect(api.get('/cart')).rejects.toBeInstanceOf(axios.CanceledError)
    expect(getStoredToken()).toBe('tok_ada')
  })
})
