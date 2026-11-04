import { z } from 'zod'
import {
  catalogNetworkSchema,
  catalogTabSchema,
  categorySchema,
  ethAmountSchema,
  sortSchema,
} from './common'

export const editionSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string().min(1),
  supply: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
  priceEth: ethAmountSchema,
})

export const reviewSchema = z.object({
  id: z.string(),
  author: z.string(),
  rating: z.number().int().min(1).max(5),
  body: z.string(),
  createdAt: z.string(),
})

export const nftSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  collectionId: z.string(),
  collectionName: z.string(),
  category: categorySchema,
  network: catalogNetworkSchema,
  creator: z.string(),
  priceEth: ethAmountSchema,
  previousPriceEth: ethAmountSchema.nullable(),
  imageUrl: z.string().min(1),
  available: z.boolean(),
  version: z.number().int().nonnegative(),
  updatedAt: z.string(),
})

export const nftDetailSchema = nftSummarySchema.extend({
  description: z.string(),
  editions: z.array(editionSchema).min(1),
  favoritesCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  tokenId: z.string().min(1),
  attributes: z.array(z.string()).min(1),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
  reviews: z.array(reviewSchema),
  gallery: z.array(z.string().min(1)).min(1),
  contractAddress: z.string().min(1),
  networkNote: z.string(),
  contractNote: z.string(),
  royaltyNote: z.string(),
})

const optionalInStock = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .optional()
  .catch(undefined)
  .transform((value) => (value === undefined ? undefined : value === true || value === 'true'))

export const nftListQuerySchema = z.object({
  q: z.string().trim().min(1).max(80).optional().catch(undefined),
  collection: z.string().trim().min(1).max(80).optional().catch(undefined),
  category: categorySchema.optional().catch(undefined),
  minPrice: ethAmountSchema.optional().catch(undefined),
  maxPrice: ethAmountSchema.optional().catch(undefined),
  network: catalogNetworkSchema.optional().catch(undefined),
  tab: catalogTabSchema.catch('all'),
  inStock: optionalInStock,
  sort: sortSchema.catch('newest'),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(24).catch(9),
})

export const facetCountSchema = z.object({
  value: z.string(),
  label: z.string(),
  count: z.number().int().nonnegative(),
})

export const nftListResponseSchema = z.object({
  items: z.array(nftSummarySchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  facets: z.object({
    categories: z.array(facetCountSchema),
    collections: z.array(facetCountSchema),
    networks: z.array(facetCountSchema),
    price: z.object({ min: ethAmountSchema, max: ethAmountSchema }),
  }),
  featured: nftSummarySchema.nullable(),
})

export type Edition = z.infer<typeof editionSchema>
export type Review = z.infer<typeof reviewSchema>
export type NftSummary = z.infer<typeof nftSummarySchema>
export type NftDetail = z.infer<typeof nftDetailSchema>
export type NftListQuery = z.infer<typeof nftListQuerySchema>
export type NftListResponse = z.infer<typeof nftListResponseSchema>
