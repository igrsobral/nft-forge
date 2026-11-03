import axios from 'axios'
import { emitSessionExpired, getGuestId, getStoredToken } from '@/lib/storage'
import { isAbortError, normalizeAxiosError } from './errors'

export const api = axios.create({
  baseURL: '/api',
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  config.headers.set('X-Guest-Id', getGuestId())
  const token = getStoredToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAbortError(error)) return Promise.reject(error)
    const normalized = normalizeAxiosError(error)
    if (normalized.code === 'invalid_session') emitSessionExpired()
    return Promise.reject(normalized)
  },
)
