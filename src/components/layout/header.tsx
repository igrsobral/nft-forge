import { useQuery } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'
import { useSyncExternalStore } from 'react'
import { DesktopHeader } from '@/components/layout/desktop-header'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { cartOwnerKey } from '@/lib/owner'
import { cartQuery, sessionQuery } from '@/lib/queries'
import { getSessionEpoch, getStoredUserId, subscribeSession } from '@/lib/storage'
import { getSocketStatus, subscribeSocketStatus } from '@/realtime/socket'

export function Header() {
  useSyncExternalStore(subscribeSession, getSessionEpoch, () => 0)
  const status = useSyncExternalStore(
    subscribeSocketStatus,
    getSocketStatus,
    () => 'connecting' as const,
  )
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const userId = getStoredUserId()
  const session = useQuery(sessionQuery(userId))
  const user = session.data?.user ?? null
  const cart = useQuery(cartQuery(cartOwnerKey(user?.id ?? userId)))
  const count = cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  return (
    <header className="z-40 lg:sticky lg:top-0 lg:bg-background">
      <DesktopHeader status={status} count={count} user={user} />
      <MobileTabBar pathname={pathname} count={count} user={user} />
    </header>
  )
}
