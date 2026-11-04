import { describe, expect, it } from 'vitest'
import {
  confirmationNote,
  etherscanTxUrl,
  formatReceiptDate,
  networkDisplayName,
  shortTxHash,
} from './receipt'

describe('receipt formatting', () => {
  it('shortens a transaction hash like 0xA91F…E82C', () => {
    expect(shortTxHash(`0xa91f${'0'.repeat(56)}e82c`)).toBe('0xA91F…E82C')
    expect(shortTxHash('0xabc')).toBe('0xabc')
    expect(shortTxHash('abcdef1234567890')).toBe('0xABCD…7890')
  })

  it('formats the purchase date in pt-BR and keeps an invalid value', () => {
    expect(formatReceiptDate('2026-07-29T12:00:00.000Z')).toBe('29 Jul, 2026')
    expect(formatReceiptDate('not-a-date')).toBe('not-a-date')
  })

  it('names the network and points at Etherscan', () => {
    expect(networkDisplayName('base')).toBe('Base')
    expect(networkDisplayName('unknown')).toBe('unknown')
    expect(etherscanTxUrl('0xabc')).toBe('https://etherscan.io/tx/0xabc')
    expect(confirmationNote('ethereum')).toMatch(/Transação confirmada na Ethereum/)
    expect(confirmationNote('polygon')).toMatch(/Polygon/)
  })
})
