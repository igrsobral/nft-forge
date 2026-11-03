import { z } from 'zod'
import { ethAmountSchema, orderStatusSchema } from './common'

const editionSnapshotSchema = z.object({
  id: z.string(),
  remaining: z.number().int().nonnegative(),
  priceEth: ethAmountSchema,
})

/** Stable id + resource + version. Clients drop duplicates and older versions. */
export const nftUpdatedEventSchema = z.object({
  eventId: z.string().min(1),
  nftId: z.string().min(1),
  version: z.number().int().nonnegative(),
  priceEth: ethAmountSchema,
  editions: z.array(editionSnapshotSchema),
  emittedAt: z.string(),
})

export const orderUpdatedEventSchema = z.object({
  eventId: z.string().min(1),
  orderId: z.string().min(1),
  userId: z.string().min(1),
  version: z.number().int().nonnegative(),
  status: orderStatusSchema,
  txRef: z.string().nullable(),
  explorerUrl: z.string().nullable(),
  emittedAt: z.string(),
})

export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>
