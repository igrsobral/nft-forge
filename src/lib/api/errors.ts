import axios from 'axios'
import { apiErrorEnvelopeSchema, type ErrorCode, type FieldError } from '@/contracts/common'

export class ApiError extends Error {
  readonly code: ErrorCode
  readonly status: number
  readonly details: FieldError[]
  readonly requestId: string | null

  constructor(options: {
    code: ErrorCode
    status: number
    message: string
    details?: FieldError[]
    requestId?: string | null
  }) {
    super(options.message)
    this.name = 'ApiError'
    this.code = options.code
    this.status = options.status
    this.details = options.details ?? []
    this.requestId = options.requestId ?? null
  }
}

export function isAbortError(error: unknown): boolean {
  if (axios.isCancel(error)) return true
  if (error instanceof DOMException && error.name === 'AbortError') return true
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ERR_CANCELED'
  )
}

export function normalizeAxiosError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (!axios.isAxiosError(error)) {
    return new ApiError({
      code: 'transient',
      status: 0,
      message: 'The marketplace could not complete that request.',
    })
  }

  if (error.code === 'ECONNABORTED') {
    return new ApiError({
      code: 'transient',
      status: 0,
      message:
        'The request timed out. If you were placing an order, retry with the same idempotency key.',
    })
  }

  if (!error.response) {
    return new ApiError({
      code: 'transient',
      status: 0,
      message: 'Connection failed. Check the network and try again.',
    })
  }

  const parsed = apiErrorEnvelopeSchema.safeParse(error.response.data)
  if (parsed.success) {
    return new ApiError({
      code: parsed.data.error.code,
      status: error.response.status,
      message: parsed.data.error.message,
      details: parsed.data.error.details,
      requestId: parsed.data.error.requestId,
    })
  }

  const status = error.response.status
  const code: ErrorCode =
    status === 401
      ? 'invalid_session'
      : status === 403
        ? 'forbidden'
        : status === 404
          ? 'not_found'
          : status === 409
            ? 'conflict'
            : status === 422
              ? 'validation'
              : 'transient'

  return new ApiError({
    code,
    status,
    message: 'The marketplace returned an unexpected error.',
  })
}
