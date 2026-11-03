import type { QueryClient } from '@tanstack/react-query'
import type { SessionResponse } from '@/contracts/account'
import type { NftDetail, NftListResponse } from '@/contracts/catalog'
import type { Cart, Order } from '@/contracts/commerce'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts/events'
import { mulEth } from '@/lib/money'
import { getStoredUserId } from '@/lib/storage'

export function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent): boolean {
  let priceChanged = false

  queryClient.setQueriesData<NftListResponse>({ queryKey: ['nfts'] }, (current) => {
    if (!current) return current
    let changed = false
    const items = current.items.map((item) => {
      if (item.id !== event.nftId || item.version >= event.version) return item
      changed = true
      if (item.priceEth !== event.priceEth) priceChanged = true
      return {
        ...item,
        priceEth: event.priceEth,
        version: event.version,
        updatedAt: event.emittedAt,
        available: event.editions.some((edition) => edition.remaining > 0),
      }
    })
    return changed ? { ...current, items } : current
  })

  queryClient.setQueriesData<NftDetail>({ queryKey: ['nft'] }, (current) => {
    if (!current || current.id !== event.nftId || current.version >= event.version) return current
    if (current.priceEth !== event.priceEth) priceChanged = true
    return {
      ...current,
      priceEth: event.priceEth,
      version: event.version,
      updatedAt: event.emittedAt,
      available: event.editions.some((edition) => edition.remaining > 0),
      editions: current.editions.map((edition) => {
        const next = event.editions.find((item) => item.id === edition.id)
        return next ? { ...edition, remaining: next.remaining, priceEth: next.priceEth } : edition
      }),
    }
  })

  queryClient.setQueriesData<Cart>({ queryKey: ['cart'] }, (current) => {
    if (!current) return current
    let changed = false
    const items = current.items.map((item) => {
      if (item.nftId !== event.nftId || item.version >= event.version) return item
      const edition = event.editions.find((entry) => entry.id === item.editionId)
      if (!edition) return item
      changed = true
      if (item.unitPriceEth !== edition.priceEth) priceChanged = true
      return {
        ...item,
        unitPriceEth: edition.priceEth,
        lineTotalEth: mulEth(edition.priceEth, item.quantity),
        remaining: edition.remaining,
        version: event.version,
        changed: item.unitPriceEth !== edition.priceEth || item.remaining !== edition.remaining,
      }
    })
    return changed ? { ...current, items } : current
  })

  if (priceChanged) void queryClient.invalidateQueries({ queryKey: ['quote'] })
  return priceChanged
}

export function applyOrderUpdated(queryClient: QueryClient, event: OrderUpdatedEvent): boolean {
  if (event.userId !== activeUserId(queryClient)) return false
  let applied = false
  queryClient.setQueriesData<Order>({ queryKey: ['order'] }, (current) => {
    if (!current || current.id !== event.orderId || current.version >= event.version) return current
    applied = true
    return {
      ...current,
      status: event.status,
      version: event.version,
      txRef: event.txRef,
      explorerUrl: event.explorerUrl,
      updatedAt: event.emittedAt,
    }
  })
  return applied
}

function activeUserId(queryClient: QueryClient): string | null {
  const entries = queryClient.getQueriesData<SessionResponse>({ queryKey: ['session'] })
  for (const [, data] of entries) {
    if (data?.user?.id) return data.user.id
  }
  return getStoredUserId()
}

export function nftName(queryClient: QueryClient, nftId: string): string | undefined {
  const lists = queryClient.getQueriesData<NftListResponse>({ queryKey: ['nfts'] })
  for (const [, data] of lists) {
    const match = data?.items.find((item) => item.id === nftId)
    if (match) return match.name
  }
  const details = queryClient.getQueriesData<NftDetail>({ queryKey: ['nft'] })
  for (const [, data] of details) {
    if (data?.id === nftId) return data.name
  }
  return undefined
}
