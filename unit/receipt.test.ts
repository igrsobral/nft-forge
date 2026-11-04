import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  confirmationNote,
  etherscanTxUrl,
  formatReceiptDate,
  shortTxHash,
} from '../src/lib/receipt.ts'

describe('receipt formatting', () => {
  it('shortens a transaction hash like 0xA91F…E82C', () => {
    const hash = `0xa91f${'0'.repeat(56)}e82c`
    assert.equal(shortTxHash(hash), '0xA91F…E82C')
  })

  it('keeps a short reference unchanged', () => {
    assert.equal(shortTxHash('0xabc'), '0xabc')
  })

  it('formats the purchase date in pt-BR as day, month, year', () => {
    assert.equal(formatReceiptDate('2026-07-29T12:00:00.000Z'), '29 Jul, 2026')
  })

  it('points the explorer link at the mock hash on Etherscan', () => {
    assert.equal(etherscanTxUrl('0xabc'), 'https://etherscan.io/tx/0xabc')
  })

  it('names the network that confirmed the transfer', () => {
    assert.match(confirmationNote('ethereum'), /Transação confirmada na Ethereum/)
    assert.match(confirmationNote('polygon'), /Transação confirmada na Polygon/)
  })
})
