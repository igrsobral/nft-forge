import { queryOptions } from '@tanstack/react-query'
import type { NftListQuery } from '@/contracts/catalog'
import type { QuoteRequest } from '@/contracts/commerce'
import { getSession, listWallets } from '@/lib/api/account'
import { getNft, listNfts } from '@/lib/api/catalog'
import { createQuote, getCart, getOrder, listFavorites } from '@/lib/api/commerce'
import { queryKeys } from '@/lib/query-keys'

export function sessionQuery(userId: string | null) {
  return queryOptions({
    queryKey: queryKeys.session(userId),
    queryFn: ({ signal }) => getSession(signal),
  })
}

export function nftListQuery(userId: string | null, params: NftListQuery) {
  return queryOptions({
    queryKey: queryKeys.nfts(userId, params),
    queryFn: ({ signal }) => listNfts(params, signal),
  })
}

export function nftDetailQuery(userId: string | null, nftId: string) {
  return queryOptions({
    queryKey: queryKeys.nft(userId, nftId),
    queryFn: ({ signal }) => getNft(nftId, signal),
  })
}

export function favoritesQuery(userId: string | null) {
  return queryOptions({
    queryKey: queryKeys.favorites(userId),
    queryFn: ({ signal }) => listFavorites(signal),
  })
}

export function cartQuery(ownerKey: string) {
  return queryOptions({
    queryKey: queryKeys.cart(ownerKey),
    queryFn: ({ signal }) => getCart(signal),
  })
}

export function quoteQuery(ownerKey: string, params: QuoteRequest) {
  return queryOptions({
    queryKey: queryKeys.quote(ownerKey, params),
    queryFn: ({ signal }) => createQuote(params, signal),
  })
}

export function orderQuery(userId: string | null, orderId: string) {
  return queryOptions({
    queryKey: queryKeys.order(userId, orderId),
    queryFn: ({ signal }) => getOrder(orderId, signal),
  })
}

export function walletsQuery(userId: string | null) {
  return queryOptions({
    queryKey: queryKeys.wallets(userId),
    queryFn: ({ signal }) => listWallets(signal),
  })
}
