import {
  authResponseSchema,
  avatarUpdateSchema,
  forgotPasswordResponseSchema,
  publicUserSchema,
  sessionResponseSchema,
  signupBodySchema,
  walletListSchema,
  walletConnectionSchema,
  walletSchema,
  type AuthResponse,
  type LoginBody,
  type PasswordChange,
  type RegisterBody,
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
  const response = await api.post('/auth/login', body)
  const parsed = authResponseSchema.parse(response.data)
  setStoredSession(parsed.token, parsed.user.id)
  return parsed
}

export async function register(body: RegisterBody): Promise<AuthResponse> {
  const response = await api.post('/auth/register', body)
  const parsed = authResponseSchema.parse(response.data)
  setStoredSession(parsed.token, parsed.user.id)
  return parsed
}

export async function requestPasswordReset(email: string): Promise<void> {
  const response = await api.post('/auth/forgot', { email })
  forgotPasswordResponseSchema.parse(response.data)
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } finally {
    clearStoredSession()
  }
}

export async function updateProfile(body: ProfileUpdate): Promise<PublicUser> {
  const response = await api.patch('/profile', body)
  return publicUserSchema.parse(response.data)
}

export async function updateAvatar(imageDataUrl: string | null): Promise<PublicUser> {
  const response = await api.post('/profile/avatar', avatarUpdateSchema.parse({ imageDataUrl }))
  return publicUserSchema.parse(response.data)
}

export async function changePassword(body: PasswordChange): Promise<void> {
  await api.post('/profile/password', body)
}

export async function listWallets(signal?: AbortSignal): Promise<Wallet[]> {
  const response = await api.get('/wallets', { signal })
  return walletListSchema.parse(response.data).items
}

export async function createWallet(body: WalletWrite): Promise<Wallet> {
  const response = await api.post('/wallets', body)
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
  const response = await api.patch(`/wallets/${encodeURIComponent(walletId)}`, body)
  return walletSchema.parse(response.data)
}
