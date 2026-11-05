import { Link } from '@tanstack/react-router'
import { Heart, House, ScanLine, ShoppingCart, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { useOpenAuth } from '@/components/auth/auth-modal'

export function MobileTabBar({
  pathname,
  count,
  user,
}: {
  pathname: string
  count: number
  user: { id: string; displayName: string } | null
}) {
  const openAuth = useOpenAuth()
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-line-strong bg-background px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end">
        <TabLink to="/" label="Início" active={pathname === '/'}>
          <House className="size-5" />
        </TabLink>
        <TabLink
          to="/profile/watchlist"
          label="Favoritos"
          active={pathname === '/profile/watchlist'}
        >
          <Heart className="size-5" />
        </TabLink>
        <ScanFab count={count} />
        <Link
          to="/cart"
          aria-label={`Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`}
          className="flex min-h-11 items-center justify-center text-foreground/85 transition-colors hover:text-primary"
        >
          <ShoppingCart className="size-5" />
        </Link>
        {user ? (
          <TabLink to="/profile" label="Perfil" active={pathname.startsWith('/profile')}>
            <UserRound className="size-5" />
          </TabLink>
        ) : (
          <button
            type="button"
            aria-label="Entrar"
            className="flex min-h-11 items-center justify-center text-foreground/85 transition-colors hover:text-primary"
            onClick={() => openAuth('login')}
          >
            <UserRound className="size-5" />
            <span className="sr-only">Entrar</span>
          </button>
        )}
      </div>
      <a
        href="/#catalogo"
        className="sr-only"
        aria-current={isMercado(pathname) ? 'page' : undefined}
      >
        Mercado
      </a>
    </nav>
  )
}

function ScanFab({ count }: { count: number }) {
  return (
    <Link
      to="/cart"
      aria-label={`Abrir carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`}
      className="relative -mt-7 flex size-14 items-center justify-center justify-self-center rounded-full bg-primary text-primary-foreground shadow-tab-float"
    >
      <ScanLine className="size-6" />
      {count > 0 ? (
        <span className="absolute -top-0.5 -left-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-line-strong bg-muted px-1 text-[10px] leading-none font-bold text-foreground">
          {count}
        </span>
      ) : null}
    </Link>
  )
}

function TabLink({
  to,
  label,
  active,
  children,
}: {
  to: '/' | '/profile' | '/profile/watchlist'
  label: string
  active: boolean
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={
        active
          ? 'flex min-h-11 w-full items-center justify-center text-foreground [&>svg]:fill-current'
          : 'flex min-h-11 w-full items-center justify-center text-foreground/85 transition-colors hover:text-primary'
      }
    >
      {children}
      <span className="sr-only">{label}</span>
    </Link>
  )
}

function isMercado(pathname: string): boolean {
  return pathname.startsWith('/nfts') || pathname === '/cart' || pathname === '/checkout'
}
