import type { NftListQuery } from '@/contracts/catalog'
import type { QuoteRequest } from '@/contracts/commerce'

/**
 * Every key includes the user id (or `anon`) and the params that change the result.
 * Logging out or switching accounts changes the id segment, so private caches cannot collide.
 */
export const queryKeys = {
  session: (userId: string | null) => ['session', userId ?? 'anon'] as const,
  nfts: (userId: string | null, params: NftListQuery) =>
    ['nfts', userId ?? 'anon', params] as const,
  nft: (userId: string | null, nftId: string) => ['nft', userId ?? 'anon', nftId] as const,
  favorites: (userId: string | null) => ['favorites', userId ?? 'anon'] as const,
  cart: (ownerKey: string) => ['cart', ownerKey] as const,
  quote: (ownerKey: string, params: QuoteRequest) => ['quote', ownerKey, params] as const,
  orders: (userId: string | null) => ['orders', userId ?? 'anon'] as const,
  order: (userId: string | null, orderId: string) => ['order', userId ?? 'anon', orderId] as const,
  editorial: (userId: string | null) => ['editorial', userId ?? 'anon'] as const,
  editorialPost: (userId: string | null, slug: string) =>
    ['editorial-post', userId ?? 'anon', slug] as const,
  profile: (userId: string | null) => ['profile', userId ?? 'anon'] as const,
  wallets: (userId: string | null) => ['wallets', userId ?? 'anon'] as const,
}
