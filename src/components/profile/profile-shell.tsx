import { useRouterState } from '@tanstack/react-router'
import {
  Activity,
  Download,
  Heart,
  LifeBuoy,
  LogOut,
  Tag,
  UserRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { logout } from '@/lib/api/account'

const items: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/profile', label: 'Dados do perfil', icon: UserRound },
  { to: '/profile/wallets', label: 'Carteiras', icon: Wallet },
  { to: '/profile/activity', label: 'Atividade', icon: Activity },
  { to: '/profile/watchlist', label: 'Lista de interesse', icon: Heart },
  { to: '/profile/offers', label: 'Ofertas', icon: Tag },
  { to: '/profile/downloads', label: 'Arquivos baixados', icon: Download },
  { to: '/profile/support', label: 'Suporte', icon: LifeBuoy },
]

export function ProfileShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <main className="mx-auto grid w-full max-w-[1440px] min-w-0 gap-6 px-4 py-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:px-10 lg:py-8">
      <aside className="rounded-xl bg-[#24140f] p-4">
        <h1 className="type-b-16-bold mb-4 text-foreground">Meu perfil</h1>
        <label className="mb-3 block lg:hidden">
          <span className="sr-only">Seção do perfil</span>
          <select
            className="h-11 w-full rounded-md border border-[#6a4332] bg-[#140d0a] px-3"
            value={items.some((item) => item.to === pathname) ? pathname : '/profile'}
            onChange={(event) => {
              if (event.target.value === 'sair') {
                void logout().finally(() => window.location.assign('/'))
                return
              }
              window.location.assign(event.target.value)
            }}
          >
            {items.map((item) => (
              <option key={item.to} value={item.to}>
                {item.label}
              </option>
            ))}
            <option value="sair">Sair</option>
          </select>
        </label>
        <nav aria-label="Meu perfil" className="hidden flex-col gap-1 lg:flex">
          {items.map((item) => (
            <ProfileLink
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              active={pathname === item.to}
            />
          ))}
          <button
            type="button"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-primary hover:bg-[#1a100c]"
            onClick={() => {
              void logout().finally(() => window.location.assign('/'))
            }}
          >
            <LogOut className="size-4" />
            Sair
          </button>
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </main>
  )
}

function ProfileLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string
  label: string
  icon: LucideIcon
  active: boolean
}) {
  return (
    <a
      href={to}
      aria-current={active ? 'page' : undefined}
      className={
        active
          ? 'flex items-center gap-2 border-l-2 border-primary px-3 py-2 text-sm font-bold text-primary'
          : 'flex items-center gap-2 border-l-2 border-transparent px-3 py-2 text-sm text-primary/80 hover:text-primary'
      }
    >
      <Icon className="size-4" />
      {label}
    </a>
  )
}

export const profileInputClass =
  'h-11 w-full rounded-md border border-[#6a4332] bg-[#140d0a] px-3 text-sm text-foreground outline-none placeholder:text-[#c9a27a]/70 focus:border-primary focus:ring-1 focus:ring-primary'

export function RequiredLabel({ children }: { children: string }) {
  return (
    <span className="text-sm text-foreground">
      {children}
      <span className="text-primary">*</span>
    </span>
  )
}

export function ProfileField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-1.5">
      <RequiredLabel>{label}</RequiredLabel>
      {children}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  )
}
