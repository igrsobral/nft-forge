import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useSyncExternalStore } from 'react'
import { MockLab } from '@/components/mock-lab'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/api/account'
import { cartOwnerKey } from '@/lib/owner'
import { cartQuery, sessionQuery } from '@/lib/queries'
import { getSessionEpoch, getStoredUserId, subscribeSession } from '@/lib/storage'
import { getSocketStatus, subscribeSocketStatus } from '@/realtime/socket'

const statusLabel = {
  connecting: 'Connecting',
  live: 'Live',
  offline: 'Offline',
} as const

export function Header() {
  useSyncExternalStore(subscribeSession, getSessionEpoch, () => 0)
  const status = useSyncExternalStore(subscribeSocketStatus, getSocketStatus, () => 'connecting' as const)
  const userId = getStoredUserId()
  const session = useQuery(sessionQuery(userId))
  const user = session.data?.user ?? null
  const cart = useQuery(cartQuery(cartOwnerKey(user?.id ?? userId)))
  const count = cart.data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 lg:items-start lg:justify-between lg:px-10 lg:pt-6">
        <Link to="/" aria-label="Kurio, home" className="type-wordmark text-foreground">
          KURIO
        </Link>
        <nav aria-label="Primary" className="hidden items-start gap-6 lg:flex">
          <NavLink to="/" label="Marketplace" />
          <NavLink to="/cart" label={count > 0 ? `Cart (${count})` : 'Cart'} />
          {user ? <NavLink to="/profile" label="Profile" /> : null}
          {user ? <NavLink to="/wallets" label="Wallets" /> : null}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:gap-4">
          <span
            data-testid="socket-status"
            role="status"
            className="type-c-12 tracking-wide text-text-secondary uppercase"
          >
            {statusLabel[status]}
          </span>
          <span className="hidden sm:contents">
            <MockLab />
          </span>
          {user ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                void logout().finally(() => {
                  window.location.assign('/')
                })
              }}
            >
              Log out
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={() => void navigate({ to: '/login', search: {} })}>
              Sign in
            </Button>
          )}
        </div>
      </div>
      <nav aria-label="Mobile" className="flex gap-4 overflow-x-auto px-4 pb-3 lg:hidden">
        <Link to="/cart" className="type-c-12 shrink-0 text-text-secondary">
          Cart{count > 0 ? ` (${count})` : ''}
        </Link>
        {user ? (
          <>
            <Link to="/profile" className="type-c-12 shrink-0 text-text-secondary">
              Profile
            </Link>
            <Link to="/wallets" className="type-c-12 shrink-0 text-text-secondary">
              Wallets
            </Link>
          </>
        ) : null}
      </nav>
      <div aria-hidden className="mx-4 hidden border-t border-primary/30 lg:mx-10 lg:block" />
    </header>
  )
}

function NavLink({ to, label }: { to: '/' | '/cart' | '/profile' | '/wallets'; label: string }) {
  return (
    <Link to={to} className="type-b-16 text-foreground hover:text-accent">
      {label}
    </Link>
  )
}
