import { z } from 'zod'

/** Decimal ETH strings. Never transport ETH as a JavaScript number. */
export const ethAmountSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)(?:\.\d+)?$/, 'Expected a decimal ETH string')

export const errorCodes = [
  'validation',
  'invalid_session',
  'forbidden',
  'not_found',
  'availability_conflict',
  'conflict',
  'transient',
] as const

export const errorCodeSchema = z.enum(errorCodes)

export const fieldErrorSchema = z.object({
  path: z.string(),
  message: z.string(),
})

export const apiErrorEnvelopeSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    details: z.array(fieldErrorSchema).default([]),
    requestId: z.string(),
  }),
})

export const categories = [
  'Arte digital',
  'Fotografia',
  'Música',
  'Arte 3D',
  'Colecionáveis',
  'Generativa',
  'Jogos',
  'Assinaturas',
  'Utilidade',
] as const
export const categorySchema = z.enum(categories)

export const networks = ['ethereum', 'polygon', 'base'] as const
export const networkSchema = z.enum(networks)

export const catalogNetworks = ['ethereum', 'polygon', 'solana'] as const
export const catalogNetworkSchema = z.enum(catalogNetworks)

export const catalogTabs = ['all', 'new', 'trending'] as const
export const catalogTabSchema = z.enum(catalogTabs)

export const sorts = ['newest', 'price_asc', 'price_desc', 'name_asc'] as const
export const sortSchema = z.enum(sorts)

export const walletRoles = ['primary', 'secondary'] as const
export const walletRoleSchema = z.enum(walletRoles)

export const orderStatuses = ['pending', 'confirmed', 'declined'] as const
export const orderStatusSchema = z.enum(orderStatuses)

export const walletAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Enter a 20-byte hex address')

export type ErrorCode = z.infer<typeof errorCodeSchema>
export type FieldError = z.infer<typeof fieldErrorSchema>
export type ApiErrorEnvelope = z.infer<typeof apiErrorEnvelopeSchema>
export type Category = z.infer<typeof categorySchema>
export type Network = z.infer<typeof networkSchema>
export type CatalogNetwork = z.infer<typeof catalogNetworkSchema>
export type CatalogTab = z.infer<typeof catalogTabSchema>
export type Sort = z.infer<typeof sortSchema>
export type WalletRole = z.infer<typeof walletRoleSchema>
export type OrderStatus = z.infer<typeof orderStatusSchema>
