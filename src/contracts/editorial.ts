import { z } from 'zod'

export const editorialPromoKindSchema = z.enum(['genesis', 'selection'])

export const editorialPromoSchema = z.object({
  kind: editorialPromoKindSchema,
  title: z.string().min(1),
  excerpt: z.string().min(1),
  imageUrl: z.string().min(1),
})

export const editorialCategorySchema = z.enum(['NFTs', 'Criadores', 'Mercado'])

export const editorialPostSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  category: editorialCategorySchema,
  dateLabel: z.string().min(1),
  readingMinutes: z.number().int().positive(),
  imageUrl: z.string().min(1),
})

export const editorialHomeSchema = z.object({
  promos: z.array(editorialPromoSchema),
  journal: z.array(editorialPostSchema),
})

export const editorialPostDetailSchema = editorialPostSchema.extend({
  body: z.array(z.string().min(1)).min(1),
})

export type EditorialPromo = z.infer<typeof editorialPromoSchema>
export type EditorialPromoKind = z.infer<typeof editorialPromoKindSchema>
export type EditorialCategory = z.infer<typeof editorialCategorySchema>
export type EditorialPost = z.infer<typeof editorialPostSchema>
export type EditorialPostDetail = z.infer<typeof editorialPostDetailSchema>
export type EditorialHome = z.infer<typeof editorialHomeSchema>
