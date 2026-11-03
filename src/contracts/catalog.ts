import { z } from 'zod'
import { categorySchema, ethAmountSchema, sortSchema } from './common'

export const editionSchema = z.object({
  id: z.string(),
  name: z.string(),
  supply: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
  priceEth: ethAmountSchema,
})

export const nftSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  collectionId: z.string(),
  collectionName: z.string(),
  category: categorySchema,
  creator: z.string(),
  priceEth: ethAmountSchema,
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
  inStock: optionalInStock,
  sort: sortSchema.catch('newest'),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(24).catch(8),
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
  }),
})

export type Edition = z.infer<typeof editionSchema>
export type NftSummary = z.infer<typeof nftSummarySchema>
export type NftDetail = z.infer<typeof nftDetailSchema>
export type NftListQuery = z.infer<typeof nftListQuerySchema>
export type NftListResponse = z.infer<typeof nftListResponseSchema>
