import { z } from 'zod'
import { ethAmountSchema, networkSchema, orderStatusSchema } from './common'

export const favoriteListSchema = z.object({
  nftIds: z.array(z.string()),
})

export const favoriteWriteSchema = z.object({
  nftId: z.string().min(1),
})

export const newsletterSubscribeSchema = z.object({
  email: z.email(),
})

export const newsletterResponseSchema = z.object({
  ok: z.literal(true),
})

export const cartItemSchema = z.object({
  id: z.string(),
  nftId: z.string(),
  editionId: z.string(),
  name: z.string(),
  editionName: z.string(),
  tokenId: z.string(),
  imageUrl: z.string(),
  quantity: z.number().int().positive(),
  unitPriceEth: ethAmountSchema,
  lineTotalEth: ethAmountSchema,
  remaining: z.number().int().nonnegative(),
  version: z.number().int().nonnegative(),
  changed: z.boolean(),
})

export const cartSchema = z.object({
  ownerKey: z.string(),
  items: z.array(cartItemSchema),
  updatedAt: z.string(),
})

export const cartAddSchema = z.object({
  nftId: z.string().min(1),
  editionId: z.string().min(1),
  quantity: z.number().int().positive().max(20),
})

export const cartUpdateSchema = z.object({
  quantity: z.number().int().positive().max(20),
})

export const couponStateSchema = z.object({
  code: z.string(),
  valid: z.boolean(),
  reason: z.enum(['invalid', 'expired']).nullable(),
  discountEth: ethAmountSchema,
})

export const quoteLineSchema = z.object({
  nftId: z.string(),
  editionId: z.string(),
  name: z.string(),
  editionName: z.string(),
  quantity: z.number().int().positive(),
  unitPriceEth: ethAmountSchema,
  lineTotalEth: ethAmountSchema,
})

export const quoteIssueSchema = z.object({
  code: z.enum(['sold_out', 'missing', 'price_changed']),
  nftId: z.string(),
  editionId: z.string().nullable(),
  message: z.string(),
})

export const quoteSchema = z.object({
  lines: z.array(quoteLineSchema),
  subtotalEth: ethAmountSchema,
  discountEth: ethAmountSchema,
  networkFeeEth: ethAmountSchema,
  totalEth: ethAmountSchema,
  coupon: couponStateSchema.nullable(),
  availabilityOk: z.boolean(),
  issues: z.array(quoteIssueSchema),
})

export const quoteRequestSchema = z.object({
  couponCode: z.string().trim().min(1).max(40).optional(),
})

export const receiptLineSchema = quoteLineSchema.extend({
  tokenId: z.string().default(''),
  imageUrl: z.string().default(''),
})

export const receiptSchema = z.object({
  lines: z.array(receiptLineSchema),
  subtotalEth: ethAmountSchema,
  discountEth: ethAmountSchema,
  networkFeeEth: ethAmountSchema,
  totalEth: ethAmountSchema,
  couponCode: z.string().nullable(),
  purchasedAt: z.string(),
})

export const orderSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  version: z.number().int().nonnegative(),
  walletId: z.string(),
  network: networkSchema,
  txRef: z.string().nullable(),
  explorerUrl: z.string().nullable(),
  walletLabel: z.string().default(''),
  receipt: receiptSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const createOrderSchema = z.object({
  walletId: z.string().min(1),
  network: networkSchema,
  couponCode: z.string().trim().min(1).max(40).optional(),
  expectedTotalEth: ethAmountSchema,
})

export type NewsletterSubscribe = z.infer<typeof newsletterSubscribeSchema>
export type Cart = z.infer<typeof cartSchema>
export type CartItem = z.infer<typeof cartItemSchema>
export type CartAdd = z.infer<typeof cartAddSchema>
export type Quote = z.infer<typeof quoteSchema>
export type QuoteRequest = z.infer<typeof quoteRequestSchema>
export const orderListSchema = z.object({
  items: z.array(orderSchema),
})

export const supportRequestSchema = z.object({
  subject: z.string().trim().min(3, 'Informe um assunto.').max(80),
  message: z.string().trim().min(10, 'Descreva o pedido com pelo menos 10 caracteres.').max(1000),
})

export const supportResponseSchema = z.object({
  id: z.string(),
  ok: z.literal(true),
})

export type Order = z.infer<typeof orderSchema>
export type OrderList = z.infer<typeof orderListSchema>
export type SupportRequest = z.infer<typeof supportRequestSchema>
export type CreateOrderBody = z.infer<typeof createOrderSchema>
export type Receipt = z.infer<typeof receiptSchema>
