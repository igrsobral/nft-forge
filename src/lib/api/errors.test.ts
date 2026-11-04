import axios from 'axios'
import { describe, expect, it } from 'vitest'
import { ApiError, isAbortError, normalizeAxiosError } from './errors'

function axiosError(status: number, data: unknown): unknown {
  const error = new axios.AxiosError('failed')
  error.response = {
    status,
    data,
    statusText: String(status),
    headers: {},
    config: { headers: new axios.AxiosHeaders() },
  }
  return error
}

describe('API error mapping', () => {
  it('keeps an ApiError and maps a parsed envelope', () => {
    const original = new ApiError({ code: 'conflict', status: 409, message: 'duplicate' })
    expect(normalizeAxiosError(original)).toBe(original)
    const mapped = normalizeAxiosError(
      axiosError(422, {
        error: {
          code: 'validation',
          message: 'Revise os dados.',
          details: [{ path: 'email', message: 'Informe um e-mail válido.' }],
          requestId: 'req_1',
        },
      }),
    )
    expect(mapped).toMatchObject({
      code: 'validation',
      status: 422,
      message: 'Revise os dados.',
      requestId: 'req_1',
    })
    expect(mapped.details[0]?.path).toBe('email')
  })

  it('maps status codes when the body is not the envelope', () => {
    expect(normalizeAxiosError(axiosError(401, {})).code).toBe('invalid_session')
    expect(normalizeAxiosError(axiosError(403, {})).code).toBe('forbidden')
    expect(normalizeAxiosError(axiosError(404, {})).code).toBe('not_found')
    expect(normalizeAxiosError(axiosError(409, {})).code).toBe('conflict')
    expect(normalizeAxiosError(axiosError(422, {})).code).toBe('validation')
    expect(normalizeAxiosError(axiosError(503, {})).code).toBe('transient')
  })

  it('distinguishes timeout, offline, abort, and unknown failures', () => {
    const timeout = new axios.AxiosError('timeout')
    timeout.code = 'ECONNABORTED'
    expect(normalizeAxiosError(timeout).message).toMatch(/timed out/)

    const offline = new axios.AxiosError('offline')
    expect(normalizeAxiosError(offline).message).toMatch(/Connection failed/)
    expect(normalizeAxiosError(new Error('boom')).message).toMatch(/could not complete/)

    const canceled = new axios.CanceledError('aborted')
    expect(isAbortError(canceled)).toBe(true)
    const aborted = new axios.AxiosError('aborted')
    aborted.code = 'ERR_CANCELED'
    expect(isAbortError(aborted)).toBe(true)
    expect(isAbortError(new DOMException('stopped', 'AbortError'))).toBe(true)
    expect(isAbortError(new Error('no'))).toBe(false)
  })
})
