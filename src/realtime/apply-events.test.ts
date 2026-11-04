import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { NftDetail, NftListResponse } from '@/contracts/catalog'
import type { Cart, Order } from '@/contracts/commerce'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts/events'
import { applyNftUpdated, applyOrderUpdated, nftName } from './apply-events'

const nftEvent = (version: number, price = '0.2'): NftUpdatedEvent => ({
  eventId: `evt_${version}`,
  nftId: 'nft_01',
  version,
  priceEth: price,
  editions: [{ id: 'ed', remaining: 4, priceEth: price }],
  emittedAt: '2026-07-29T12:00:00.000Z',
})

describe('realtime cache updates', () => {
  it('applies a newer price and ignores a stale or duplicate version', () => {
    const client = new QueryClient()
    client.setQueryData(['nfts'], {
      items: [{ id: 'nft_01', priceEth: '0.08', version: 1, updatedAt: 't0', available: true }],
    } as NftListResponse)
    client.setQueryData(['nft', 'nft_01'], {
      id: 'nft_01',
      priceEth: '0.08',
      version: 1,
      updatedAt: 't0',
      available: true,
      editions: [
        { id: 'ed', remaining: 8, priceEth: '0.08', name: 'ABERTA', label: 'ABERTA', supply: 10 },
      ],
    } as NftDetail)
    client.setQueryData(['cart'], {
      ownerKey: 'user:ada',
      updatedAt: 't0',
      items: [
        {
          id: 'line',
          nftId: 'nft_01',
          editionId: 'ed',
          quantity: 2,
          unitPriceEth: '0.08',
          lineTotalEth: '0.16',
          remaining: 8,
          version: 1,
          changed: false,
        },
      ],
    } as Cart)

    expect(applyNftUpdated(client, nftEvent(2))).toBe(true)
    expect(client.getQueryData<NftListResponse>(['nfts'])?.items[0]?.priceEth).toBe('0.2')
    expect(client.getQueryData<NftDetail>(['nft', 'nft_01'])?.editions[0]?.remaining).toBe(4)
    expect(client.getQueryData<Cart>(['cart'])?.items[0]?.lineTotalEth).toBe('0.4')
    expect(client.getQueryData<Cart>(['cart'])?.items[0]?.changed).toBe(true)

    expect(applyNftUpdated(client, nftEvent(2, '9'))).toBe(false)
    expect(client.getQueryData<NftListResponse>(['nfts'])?.items[0]?.priceEth).toBe('0.2')
    expect(nftName(client, 'nft_01')).toBeUndefined()
  })

  it('updates only the signed-in collector order and ignores an older event', () => {
    const client = new QueryClient()
    client.setQueryData(['session', 'user_ada'], {
      user: { id: 'user_ada' },
      session: { expiresAt: '2026-07-30T00:00:00.000Z' },
    })
    client.setQueryData(['order', 'ord_1'], {
      id: 'ord_1',
      status: 'pending',
      version: 1,
      txRef: null,
      explorerUrl: null,
      updatedAt: 't0',
    } as Order)

    const event: OrderUpdatedEvent = {
      eventId: 'ord_evt',
      orderId: 'ord_1',
      userId: 'user_other',
      version: 2,
      status: 'declined',
      txRef: null,
      explorerUrl: null,
      emittedAt: 't1',
    }
    expect(applyOrderUpdated(client, event)).toBe(false)

    expect(
      applyOrderUpdated(client, {
        ...event,
        userId: 'user_ada',
        status: 'confirmed',
        txRef: '0xabc',
      }),
    ).toBe(true)
    expect(client.getQueryData<Order>(['order', 'ord_1'])?.status).toBe('confirmed')
    expect(
      applyOrderUpdated(client, { ...event, userId: 'user_ada', version: 2, status: 'declined' }),
    ).toBe(false)
    expect(client.getQueryData<Order>(['order', 'ord_1'])?.status).toBe('confirmed')
  })
})
