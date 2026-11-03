import { getGuestId } from '@/lib/storage'

export function cartOwnerKey(userId: string | null): string {
  return userId ? `user:${userId}` : `guest:${getGuestId()}`
}
