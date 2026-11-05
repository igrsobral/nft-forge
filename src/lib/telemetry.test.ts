import { describe, expect, it, vi } from 'vitest'
import { initTelemetry, withSpan } from '@/lib/telemetry'

describe('telemetry', () => {
  it('does not throw when booting without a collector endpoint', () => {
    const warn = vi.spyOn(console, 'warn')
    expect(() => initTelemetry()).not.toThrow()
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('withSpan resolves the call and answers even without a provider', async () => {
    await expect(withSpan('test.operation', () => 'ok')).resolves.toBe('ok')
  })

  it('withSpan rethrows failures from the wrapped call', async () => {
    const failure = withSpan('test.operation', () => {
      throw new Error('endpoint unreachable')
    })
    await expect(failure).rejects.toThrow('endpoint unreachable')
  })
})
