export const storageKeys = {
  db: 'nft-market:db',
  scenario: 'nft-market:scenario',
  token: 'nft-market:token',
  userId: 'nft-market:user-id',
  guestId: 'nft-market:guest-id',
} as const

export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Private mode and quota failures stay in memory.
  }
}

export function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore storage failures.
  }
}

export function getStoredToken(): string | null {
  return readStorage(storageKeys.token)
}

export function getStoredUserId(): string | null {
  return readStorage(storageKeys.userId)
}

let sessionEpoch = 0
const sessionListeners = new Set<() => void>()

function bumpSession(): void {
  sessionEpoch += 1
  for (const listener of sessionListeners) listener()
}

export function subscribeSession(listener: () => void): () => void {
  sessionListeners.add(listener)
  return () => sessionListeners.delete(listener)
}

export function getSessionEpoch(): number {
  return sessionEpoch
}

export function setStoredSession(token: string, userId: string): void {
  writeStorage(storageKeys.token, token)
  writeStorage(storageKeys.userId, userId)
  bumpSession()
}

export function clearStoredSession(): void {
  removeStorage(storageKeys.token)
  removeStorage(storageKeys.userId)
  bumpSession()
}

export function getGuestId(): string {
  const existing = readStorage(storageKeys.guestId)
  if (existing) return existing
  const created = crypto.randomUUID()
  writeStorage(storageKeys.guestId, created)
  return created
}

type SessionListener = () => void

const sessionExpiredListeners = new Set<SessionListener>()

export function onSessionExpired(listener: SessionListener): () => void {
  sessionExpiredListeners.add(listener)
  return () => sessionExpiredListeners.delete(listener)
}

export function emitSessionExpired(): void {
  clearStoredSession()
  for (const listener of sessionExpiredListeners) listener()
}
