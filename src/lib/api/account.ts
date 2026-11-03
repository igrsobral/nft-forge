import {
  authResponseSchema,
  avatarUpdateSchema,
  loginBodySchema,
  passwordChangeSchema,
  profileUpdateSchema,
  publicUserSchema,
  sessionResponseSchema,
  signupBodySchema,
  walletListSchema,
  walletConnectionSchema,
  walletSchema,
  walletWriteSchema,
  type AuthResponse,
  type LoginBody,
  type PasswordChange,
  type ProfileUpdate,
  type PublicUser,
  type SessionResponse,
  type SignupBody,
  type Wallet,
  type WalletWrite,
} from '@/contracts/account'
import { clearStoredSession, setStoredSession } from '@/lib/storage'
import { api } from './client'

export async function getSession(signal?: AbortSignal): Promise<SessionResponse> {
  const response = await api.get('/auth/session', { signal })
  return sessionResponseSchema.parse(response.data)
}

export async function signup(body: SignupBody): Promise<AuthResponse> {
  const response = await api.post('/auth/signup', signupBodySchema.parse(body))
  const parsed = authResponseSchema.parse(response.data)
  setStoredSession(parsed.token, parsed.user.id)
  return parsed
}

export async function login(body: LoginBody): Promise<AuthResponse> {
  const response = await api.post('/auth/login', loginBodySchema.parse(body))
  const parsed = authResponseSchema.parse(response.data)
  setStoredSession(parsed.token, parsed.user.id)
  return parsed
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } finally {
    clearStoredSession()
  }
}

export async function updateProfile(body: ProfileUpdate): Promise<PublicUser> {
  const response = await api.patch('/profile', profileUpdateSchema.parse(body))
  return publicUserSchema.parse(response.data)
}

export async function updateAvatar(imageDataUrl: string): Promise<PublicUser> {
  const response = await api.post('/profile/avatar', avatarUpdateSchema.parse({ imageDataUrl }))
  return publicUserSchema.parse(response.data)
}

export async function changePassword(body: PasswordChange): Promise<void> {
  await api.post('/profile/password', passwordChangeSchema.parse(body))
}

export async function listWallets(signal?: AbortSignal): Promise<Wallet[]> {
  const response = await api.get('/wallets', { signal })
  return walletListSchema.parse(response.data).items
}

export async function createWallet(body: WalletWrite): Promise<Wallet> {
  const response = await api.post('/wallets', walletWriteSchema.parse(body))
  return walletSchema.parse(response.data)
}

export async function setWalletConnection(
  walletId: string,
  action: 'connect' | 'disconnect' | 'decline',
): Promise<Wallet> {
  const response = await api.post(
    `/wallets/${encodeURIComponent(walletId)}/connection`,
    walletConnectionSchema.parse({ action }),
  )
  return walletSchema.parse(response.data)
}

export async function updateWallet(walletId: string, body: WalletWrite): Promise<Wallet> {
  const response = await api.patch(
    `/wallets/${encodeURIComponent(walletId)}`,
    walletWriteSchema.parse(body),
  )
  return walletSchema.parse(response.data)
}
