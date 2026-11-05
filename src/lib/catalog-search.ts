import { type NftListQuery, nftListQuerySchema } from '@/contracts/catalog'
import { pickAuth } from '@/lib/auth-search'

export function toListQuery(search: unknown): NftListQuery {
  return nftListQuerySchema.parse(search ?? {})
}

/** Drop default values so links to `/` do not have to repeat them. */
export function toRouteSearch(query: NftListQuery, raw?: Record<string, unknown>) {
  const search: Partial<NftListQuery> & ReturnType<typeof pickAuth> = {}
  if (query.q) search.q = query.q
  if (query.collection) search.collection = query.collection
  if (query.category) search.category = query.category
  if (query.network) search.network = query.network
  if (query.tab !== 'all') search.tab = query.tab
  if (query.minPrice) search.minPrice = query.minPrice
  if (query.maxPrice) search.maxPrice = query.maxPrice
  if (query.inStock) search.inStock = true
  if (query.sort !== 'newest') search.sort = query.sort
  if (query.page !== 1) search.page = query.page
  if (query.pageSize !== 9) search.pageSize = query.pageSize
  return { ...search, ...pickAuth(raw ?? {}) }
}
