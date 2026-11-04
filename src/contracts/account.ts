import { z } from 'zod'
import { networkSchema, walletAddressSchema, walletRoleSchema } from './common'

export const publicUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  displayName: z.string(),
  bio: z.string(),
  avatarUrl: z.string().nullable(),
  createdAt: z.string(),
})

export const sessionSchema = z.object({
  expiresAt: z.string(),
})

export const sessionResponseSchema = z.object({
  user: publicUserSchema.nullable(),
  session: sessionSchema.nullable(),
})

export const authResponseSchema = z.object({
  user: publicUserSchema,
  session: sessionSchema,
  token: z.string().min(1),
})

export const signupBodySchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
  displayName: z.string().trim().min(2).max(40),
})

export const loginBodySchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.').max(72),
})

export const registerBodySchema = z
  .object({
    username: z.string().trim().min(2, 'Use pelo menos 2 caracteres.').max(40),
    email: z.email('Informe um e-mail válido.'),
    password: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.').max(72),
    confirmPassword: z.string().min(1, 'Confirme a senha.'),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'As senhas não coincidem.',
      })
    }
  })

export const forgotPasswordSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
})

export const forgotPasswordResponseSchema = z.object({
  ok: z.literal(true),
})

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(2).max(40),
  bio: z.string().trim().max(280),
})

export const avatarUpdateSchema = z.object({
  imageDataUrl: z
    .string()
    .regex(/^data:image\/(?:png|jpeg|webp);base64,/, 'Use a PNG, JPEG, or WebP data URL')
    .max(400_000),
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: z.string().min(8).max(72),
})

export const walletSchema = z.object({
  id: z.string(),
  label: z.string(),
  address: walletAddressSchema,
  network: networkSchema,
  role: walletRoleSchema,
  connected: z.boolean(),
  updatedAt: z.string(),
})

export const walletConnectionSchema = z.object({
  action: z.enum(['connect', 'disconnect', 'decline']),
})

export const walletWriteSchema = z.object({
  label: z.string().trim().min(2).max(40),
  address: walletAddressSchema,
  network: networkSchema,
  role: walletRoleSchema,
})

export const walletListSchema = z.object({
  items: z.array(walletSchema),
})

export type PublicUser = z.infer<typeof publicUserSchema>
export type SessionResponse = z.infer<typeof sessionResponseSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
export type SignupBody = z.infer<typeof signupBodySchema>
export type LoginBody = z.infer<typeof loginBodySchema>
export type RegisterBody = z.infer<typeof registerBodySchema>
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>
export type PasswordChange = z.infer<typeof passwordChangeSchema>
export type Wallet = z.infer<typeof walletSchema>
export type WalletWrite = z.infer<typeof walletWriteSchema>
