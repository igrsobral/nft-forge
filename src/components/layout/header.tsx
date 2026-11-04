import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { LogIn, Search, ShoppingCart } from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { MockLab } from '@/components/mock-lab'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
    <header className="sticky top-0 z-40 bg-background">
      <div className="relative mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-4 lg:px-10">
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
            aria-label={count > 0 ? `Carrinho, ${count} itens` : 'Carrinho'}
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
              onClick={() => void navigate({ to: '/login', search: {} })}
            >
              <LogIn className="size-4" />
              Entrar
            </Button>
          )}
        </div>
      </div>
      <div aria-hidden className="border-t border-[#6a4332]" />
      <nav aria-label="Principal" className="flex gap-5 overflow-x-auto px-4 py-3 lg:hidden">
        <Link
          to="/"
          className={
            pathname === '/'
              ? 'type-c-13 shrink-0 font-bold text-primary'
              : 'type-c-13 shrink-0 text-foreground'
          }
        >
          Início
        </Link>
        <a
          href="/#catalogo"
          aria-current={isMercado(pathname) ? 'page' : undefined}
          className={
            isMercado(pathname)
              ? 'type-c-13 shrink-0 font-bold text-primary'
              : 'type-c-13 shrink-0 text-foreground'
          }
        >
          Mercado
        </a>
        <span className="type-c-13 shrink-0 text-foreground">Criadores</span>
        <span className="type-c-13 shrink-0 text-foreground">Aprenda</span>
      </nav>
      {user ? (
        <nav
          aria-label="Conta"
          className="mx-auto flex max-w-[1440px] gap-4 overflow-x-auto px-4 py-2 lg:px-10"
        >
          <Link to="/profile" className="type-c-12 text-text-secondary">
            Perfil
          </Link>
          <Link to="/wallets" className="type-c-12 text-text-secondary">
            Carteiras
          </Link>
        </nav>
      ) : null}
    </header>
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
