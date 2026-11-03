import { nftListQuerySchema, type NftListQuery } from '@/contracts/catalog'

export function toListQuery(search: unknown): NftListQuery {
  return nftListQuerySchema.parse(search ?? {})
}

/** Drop default values so links to `/` do not have to repeat them. */
export function toRouteSearch(query: NftListQuery): Partial<NftListQuery> {
  const search: Partial<NftListQuery> = {}
  if (query.q) search.q = query.q
  if (query.collection) search.collection = query.collection
  if (query.category) search.category = query.category
  if (query.minPrice) search.minPrice = query.minPrice
  if (query.maxPrice) search.maxPrice = query.maxPrice
  if (query.inStock) search.inStock = true
  if (query.sort !== 'newest') search.sort = query.sort
  if (query.page !== 1) search.page = query.page
  if (query.pageSize !== 8) search.pageSize = query.pageSize
  return search
}
