import { describe, expect, it } from 'vitest'
import { addEth, cmpEth, eqEth, formatEth, mulEth, subEth, toEth } from './money'

describe('ETH decimal strings', () => {
  it('trims trailing zeros and keeps a leading zero', () => {
    expect(toEth('1.5000')).toBe('1.5')
    expect(toEth('0.000')).toBe('0')
    expect(toEth(0)).toBe('0')
  })

  it('rounds half up at 18 places without using binary floats', () => {
    expect(toEth('0.0000000000000000005')).toBe('0.000000000000000001')
    expect(addEth('0.1', '0.2')).toBe('0.3')
    expect(subEth('1', '0.0001')).toBe('0.9999')
    expect(mulEth('0.08', 3)).toBe('0.24')
  })

  it('compares decimal strings', () => {
    expect(cmpEth('0.10', '0.1')).toBe(0)
    expect(cmpEth('0.2', '0.19')).toBe(1)
    expect(eqEth('2.00', '2')).toBe(true)
  })

  it('formats a display amount and drops trailing zeros', () => {
    expect(formatEth('0.08150')).toBe('0.0815 ETH')
    expect(formatEth('18')).toBe('18 ETH')
    expect(formatEth('1.236', 2)).toBe('1.24 ETH')
  })
})
