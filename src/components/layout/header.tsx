import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  Compass,
  Heart,
  House,
  LogIn,
  ScanLine,
  Search,
  ShoppingCart,
  UserRound,
} from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { MockLab } from '@/components/mock-lab'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useOpenAuth } from '@/components/auth/auth-modal'
import { logout } from '@/lib/api/account'
import { cartOwnerKey } from '@/lib/owner'
import { cartQuery, sessionQuery } from '@/lib/queries'
import { getSessionEpoch, getStoredUserId, subscribeSession } from '@/lib/storage'
import { getSocketStatus, subscribeSocketStatus } from '@/realtime/socket'

const statusLabel = {
  connecting: 'Conectando',
  live: 'Live',
  offline: 'Offline',
} as const

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
  const navigate = useNavigate()
  const openAuth = useOpenAuth()
  const [query, setQuery] = useState('')
  const typed = useRef(false)

  useEffect(() => {
    if (!typed.current) return
    const handle = window.setTimeout(() => {
      void navigate({
        to: '/',
        search: (previous) => ({
          ...previous,
          q: query.trim() || undefined,
          page: 1,
        }),
        replace: true,
      })
    }, 300)
    return () => window.clearTimeout(handle)
  }, [navigate, query])

  return (
    <header className="z-40 lg:sticky lg:top-0 lg:bg-background">
      <div className="relative mx-auto hidden max-w-[1440px] items-center justify-between gap-3 px-4 py-4 lg:flex lg:px-10">
        <Link to="/" aria-label="Kurio, início" className="type-wordmark text-foreground">
          KURIO
        </Link>
        <nav
          aria-label="Principal"
          className="absolute left-1/2 hidden -translate-x-1/2 items-start gap-8 lg:flex"
        >
          <TopLink to="/" label="Início" active={pathname === '/'} />
          <MercadoLink active={isMercado(pathname)} />
          <button type="button" className="type-b-16 text-foreground hover:text-primary">
            Criadores
          </button>
          <button type="button" className="type-b-16 text-foreground hover:text-primary">
            Aprenda
          </button>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <span data-testid="socket-status" role="status" className="sr-only">
            {statusLabel[status]}
          </span>
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label="Buscar"
                className="text-foreground hover:text-accent"
              >
                <Search className="size-5" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buscar edições</DialogTitle>
              </DialogHeader>
              <label className="grid gap-2">
                <span className="sr-only">Busca</span>
                <input
                  value={query}
                  placeholder="Nome, criador ou coleção"
                  onChange={(event) => {
                    typed.current = true
                    setQuery(event.target.value)
                  }}
                  className="type-b-14 h-11 rounded-[10px] border border-line bg-background px-3"
                />
              </label>
              <MockLab />
            </DialogContent>
          </Dialog>
          <Link
            to="/cart"
            aria-label={`Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`}
            className="relative text-foreground hover:text-accent"
          >
            <ShoppingCart className="size-5" />
            <span className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] leading-none font-bold text-primary-foreground">
              {count}
            </span>
          </Link>
          {user ? (
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-lg px-4"
              onClick={() => {
                void logout().finally(() => {
                  window.location.assign('/')
                })
              }}
            >
              Sair
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="h-9 gap-2 rounded-lg px-4"
              onClick={() => openAuth('login')}
            >
              <LogIn className="size-4" />
              Entrar
            </Button>
          )}
        </div>
      </div>
      <div aria-hidden className="hidden border-t border-[#6a4332] lg:block" />
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#6a4332] bg-background px-2 pt-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] lg:hidden"
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
          <Link
            to="/cart"
            aria-label={`Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`}
            className="-mt-5 flex size-14 items-center justify-center justify-self-center rounded-full bg-primary text-primary-foreground shadow-lg"
          >
            <ScanLine className="size-6" />
          </Link>
          <a
            href="/#catalogo"
            className="flex min-h-11 flex-col items-center justify-center gap-0.5 text-[10px] text-foreground"
          >
            <Compass className="size-5" />
            Explorar
          </a>
          {user ? (
            <TabLink to="/profile" label="Perfil" active={pathname.startsWith('/profile')}>
              <UserRound className="size-5" />
            </TabLink>
          ) : (
            <button
              type="button"
              className="flex min-h-11 flex-col items-center justify-center gap-0.5 text-[10px] text-foreground"
              onClick={() => openAuth('login')}
            >
              <UserRound className="size-5" />
              Entrar
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
      {user ? (
        <nav
          aria-label="Conta"
          className="mx-auto hidden max-w-[1440px] gap-4 overflow-x-auto px-4 py-2 lg:flex lg:px-10"
        >
          <Link to="/profile" className="type-c-12 text-text-secondary">
            Perfil
          </Link>
          <Link to="/profile/wallets" className="type-c-12 text-text-secondary">
            Carteiras
          </Link>
        </nav>
      ) : null}
    </header>
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
      aria-current={active ? 'page' : undefined}
      className={
        active
          ? 'flex min-h-11 flex-col items-center justify-center gap-0.5 text-[10px] font-bold text-primary'
          : 'flex min-h-11 flex-col items-center justify-center gap-0.5 text-[10px] text-foreground'
      }
    >
      {children}
      {label}
    </Link>
  )
}

function isMercado(pathname: string): boolean {
  return pathname.startsWith('/nfts') || pathname === '/cart' || pathname === '/checkout'
}

function MercadoLink({ active }: { active: boolean }) {
  return (
    <a
      href="/#catalogo"
      aria-current={active ? 'page' : undefined}
      className="flex flex-col items-center gap-2"
    >
      <span className={active ? 'type-b-16 font-bold text-primary' : 'type-b-16 text-foreground'}>
        Mercado
      </span>
      <span
        aria-hidden
        className={active ? 'h-[3px] w-full bg-primary' : 'h-[3px] w-full bg-transparent'}
      />
    </a>
  )
}

function TopLink({ to, label, active }: { to: '/'; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className="flex flex-col items-center gap-2"
    >
      <span className={active ? 'type-b-16 font-bold text-primary' : 'type-b-16 text-foreground'}>
        {label}
      </span>
      <span
        aria-hidden
        className={active ? 'h-[3px] w-full bg-primary' : 'h-[3px] w-full bg-transparent'}
      />
    </Link>
  )
}
