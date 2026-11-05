import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { LogIn, Search, ShoppingCart } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useOpenAuth } from '@/components/auth/auth-modal'
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

const statusLabel = {
  connecting: 'Conectando',
  live: 'Live',
  offline: 'Offline',
} as const

const navItems: { label: string; to?: '/'; href?: string; isMercadoTarget?: boolean }[] = [
  { label: 'Início', to: '/' },
  { label: 'Mercado', href: '/#catalogo', isMercadoTarget: true },
  { label: 'Criadores' },
  { label: 'Aprenda' },
]

export function DesktopHeader({
  status,
  count,
  user,
}: {
  status: 'connecting' | 'live' | 'offline'
  count: number
  user: { id: string; displayName: string } | null
}) {
  const openAuth = useOpenAuth()
  const [query, setQuery] = useState('')
  const typed = useRef(false)
  const navigate = useNavigate()

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

  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <>
      <div className="relative mx-auto hidden max-w-[1440px] items-center justify-between gap-3 px-4 py-4 lg:flex lg:px-10">
        <Link to="/" aria-label="Kurio, início" className="flex items-center gap-2">
          <span className="type-wordmark text-foreground">KURIO</span>
        </Link>
        <nav
          aria-label="Principal"
          className="absolute inset-y-0 left-1/2 hidden -translate-x-1/2 items-stretch gap-8 lg:flex"
        >
          {navItems.map((item) => (
            <DesktopNavItem
              key={item.label}
              label={item.label}
              to={item.to}
              href={item.href}
              active={isNavTarget(pathname, item)}
            />
          ))}
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
    </>
  )
}

function DesktopNavItem({
  label,
  active,
  to,
  href,
  onClick,
}: {
  label: string
  active: boolean
  to?: '/'
  href?: string
  onClick?: () => void
}) {
  const className = 'group relative flex items-center px-1'
  const content = (
    <>
      <span
        className={
          active ? 'type-b-16 text-primary' : 'type-b-16 text-foreground group-hover:text-primary'
        }
      >
        {label}
      </span>
      {/* Indicator pinned to the bottom edge of the bar so it lines up with the divider below */}
      <span
        aria-hidden
        className={`absolute inset-x-0 bottom-0 h-[3px] ${active ? 'bg-primary' : 'bg-transparent'}`}
      />
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        aria-current={active ? 'page' : undefined}
        className={className}
        onClick={onClick}
      >
        {content}
      </Link>
    )
  }
  if (href) {
    return (
      <a
        href={href}
        aria-current={active ? 'page' : undefined}
        className={className}
        onClick={onClick}
      >
        {content}
      </a>
    )
  }
  return (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  )
}

function isNavTarget(
  pathname: string,
  item: { label: string; isMercadoTarget?: boolean },
): boolean {
  if (item.label === 'Início' && pathname === '/') return true
  return Boolean(item.isMercadoTarget) && isMercado(pathname)
}

function isMercado(pathname: string): boolean {
  return pathname.startsWith('/nfts') || pathname === '/cart' || pathname === '/checkout'
}
