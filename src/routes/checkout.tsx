import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronLeft, MoreVertical, Wallet } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Page } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Network } from '@/contracts/common'
import { setWalletConnection } from '@/lib/api/account'
import { createOrder } from '@/lib/api/commerce'
import { ApiError } from '@/lib/api/errors'
import { requireSession } from '@/lib/auth'
import { pickAuth } from '@/lib/auth-search'
import { formatEth } from '@/lib/money'
import { cartOwnerKey } from '@/lib/owner'
import { cartQuery, quoteQuery, sessionQuery, walletsQuery } from '@/lib/queries'
import { getStoredUserId } from '@/lib/storage'
import { pickWallet } from '@/lib/wallet'

const idempotencyStorageKey = 'nft-market:order-key'

export const Route = createFileRoute('/checkout')({
  validateSearch: (search: Record<string, unknown>) => {
    const coupon =
      typeof search.coupon === 'string' && search.coupon.trim() ? search.coupon.trim() : undefined
    return { ...(coupon ? { coupon } : {}), ...pickAuth(search) }
  },
  beforeLoad: ({ location }) => requireSession(location.href),
  head: () => ({ meta: [{ title: 'Pagamento com carteira · Kurio' }] }),
  component: CheckoutPage,
})

function orderKey(): string {
  const existing = sessionStorage.getItem(idempotencyStorageKey)
  if (existing) return existing
  const created = crypto.randomUUID()
  sessionStorage.setItem(idempotencyStorageKey, created)
  return created
}

function CheckoutPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userId = getStoredUserId()
  const session = useQuery(sessionQuery(userId))
  const wallets = useQuery({ ...walletsQuery(userId), enabled: Boolean(userId) })
  const owner = cartOwnerKey(userId)
  const cart = useQuery(cartQuery(owner))
  const quote = useQuery(quoteQuery(owner, search.coupon ? { couponCode: search.coupon } : {}))
  const [walletId, setWalletId] = useState('')
  const selected = pickWallet(wallets.data, walletId)
  const [acceptedTotal, setAcceptedTotal] = useState<string | null>(null)
  const [provider, setProvider] = useState('WalletConnect')
  const [menuFor, setMenuFor] = useState<string | undefined>(undefined)
  const activeWalletId = selected?.id ?? ''
  const stale = Boolean(quote.data && acceptedTotal && acceptedTotal !== quote.data.totalEth)
  const blocked = !quote.data?.availabilityOk || stale || !selected?.connected

  const connect = useMutation({
    mutationFn: ({
      walletId: target,
      action,
    }: {
      walletId: string
      action: 'connect' | 'disconnect' | 'decline'
    }) => setWalletConnection(target, action),
    onSuccess: async () => {
      setMenuFor(undefined)
      await queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
    onError: async (error) => {
      toast.error(error instanceof ApiError ? error.message : 'A carteira não conectou.')
      await queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
  })

  const place = useMutation({
    mutationFn: () => {
      if (!quote.data || !selected) throw new Error('Revise o pedido antes de pagar')
      return createOrder(
        {
          walletId: selected.id,
          network: selected.network,
          couponCode: search.coupon,
          expectedTotalEth: quote.data.totalEth,
        },
        orderKey(),
      )
    },
    onSuccess: async (order) => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      await queryClient.setQueryData(['order', userId ?? 'anon', order.id], order)
      void navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'O pedido não foi criado.')
      void queryClient.invalidateQueries({ queryKey: ['quote'] })
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  const pending = session.isPending || quote.isPending || wallets.isPending

  return (
    <Page title="" titleClassName="sr-only" className="max-lg:pb-16">
      <header className="relative mb-2 flex min-h-11 items-center justify-center">
        <a
          href="/cart"
          aria-label="Voltar"
          className="absolute left-0 flex size-11 items-center justify-center rounded-full border border-[#3f2319] bg-[#241612] text-foreground transition-colors hover:bg-[#2f1d15]"
        >
          <ChevronLeft className="size-5" />
        </a>
        <h1 className="type-b-16-bold text-foreground lg:text-[22px]">Pagamento com carteira</h1>
      </header>

      {pending ? <Skeleton className="h-40 w-full" /> : null}

      {cart.data?.items.some((item) => item.changed) ? (
        <p
          role="status"
          className="type-c-13 rounded-xl border border-accent px-3 py-2 text-accent"
        >
          O mercado andou enquanto o carrinho estava aberto. Confirme o novo total antes de pagar.
        </p>
      ) : null}

      <section aria-label="Carteira conectada">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="type-b-14-bold text-foreground">Carteira conectada</h2>
          <a
            href="/profile/wallets"
            className="type-b-14 font-bold text-primary underline-offset-2 hover:underline"
          >
            Trocar carteira
          </a>
        </div>
        <fieldset className="grid gap-2">
          <legend className="sr-only">Carteiras salvas</legend>
          {wallets.data?.map((wallet) => {
            const checked = (selected?.id ?? '') === wallet.id
            return (
              <label
                key={wallet.id}
                className={
                  checked
                    ? 'relative flex min-w-0 items-center gap-3 rounded-2xl border border-primary/60 bg-[#24140f] px-3 py-3'
                    : 'relative flex min-w-0 items-center gap-3 rounded-2xl border border-[#3f2319] bg-[#24140f] px-3 py-3'
                }
              >
                <input
                  type="radio"
                  name="wallet"
                  className="size-4 shrink-0 cursor-pointer accent-primary"
                  checked={checked}
                  onChange={() => setWalletId(wallet.id)}
                />
                <span className="min-w-0 flex-1">
                  <span className="type-b-14-bold block truncate text-foreground">
                    {roleLabel(wallet.role)}
                  </span>
                  <span className="type-b-14 block truncate text-foreground">
                    {shortAddress(wallet.address)}
                  </span>
                  <span className="type-c-12 block text-[#8d847c]">
                    {redeLabel(wallet.network)}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`Ações da carteira ${roleLabel(wallet.role)}`}
                  aria-haspopup="menu"
                  onClick={() =>
                    setMenuFor((current) => (current === wallet.id ? undefined : wallet.id))
                  }
                  className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#c9a27a] transition-colors hover:text-foreground"
                >
                  <MoreVertical className="size-4" />
                </button>
                {menuFor === wallet.id ? (
                  <div
                    role="menu"
                    aria-label={`Carteira ${roleLabel(wallet.role)}`}
                    className="absolute right-2 bottom-2 z-20 flex flex-col rounded-xl border border-[#3f2319] bg-[#2f1d15] p-1 shadow-lg"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="type-b-14 cursor-pointer rounded-lg px-3 py-2 text-left whitespace-nowrap text-foreground hover:bg-[#1a100c]"
                      onClick={() =>
                        connect.mutate({
                          walletId: wallet.id,
                          action: wallet.connected ? 'disconnect' : 'connect',
                        })
                      }
                    >
                      {wallet.connected ? 'Desconectar' : 'Conectar'}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="type-b-14 cursor-pointer rounded-lg px-3 py-2 text-left whitespace-nowrap text-[#c9a27a] hover:bg-[#1a100c]"
                      onClick={() => connect.mutate({ walletId: wallet.id, action: 'decline' })}
                    >
                      Simular recusa
                    </button>
                  </div>
                ) : null}
              </label>
            )
          })}
        </fieldset>
        {wallets.data && wallets.data.length === 0 ? (
          <p className="type-c-13 text-[#c9a27a]">
            Adicione uma carteira em{' '}
            <a className="text-primary underline-offset-2 hover:underline" href="/profile/wallets">
              Minhas carteiras
            </a>{' '}
            antes de pagar.
          </p>
        ) : null}
      </section>

      <section aria-label="Carteira e rede" className="mt-6">
        <h2 className="type-b-14-bold mb-3 text-foreground">Carteira e rede</h2>
        <fieldset className="grid gap-2">
          <legend className="sr-only">Provedor de carteira</legend>
          {(['WalletConnect', 'MetaMask', 'Coinbase Wallet'] as const).map((name) => (
            <label
              key={name}
              className="flex min-h-11 items-center gap-3 rounded-2xl border border-[#3f2319] bg-[#24140f] px-3 py-2.5"
            >
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#6a4332] bg-[#1a100c] text-[13px] font-bold text-primary"
              >
                {name === 'Coinbase Wallet' ? <Wallet className="size-4" /> : name.charAt(0)}
              </span>
              <span className="type-b-14 min-w-0 flex-1 truncate text-foreground">{name}</span>
              <input
                type="radio"
                name="provider"
                className="size-4 shrink-0 cursor-pointer accent-primary"
                checked={provider === name}
                disabled={!selected}
                onChange={() => {
                  setProvider(name)
                  if (selected && !selected.connected) {
                    connect.mutate({ walletId: activeWalletId, action: 'connect' })
                  }
                }}
              />
            </label>
          ))}
        </fieldset>
      </section>

      <p className="type-c-13 mt-6 hidden text-[#c9a27a] lg:block">
        Colecionador {session.data?.user?.displayName} · {session.data?.user?.email}
      </p>

      <div className="mt-7 flex items-baseline justify-end gap-3">
        <span className="type-b-16-bold text-foreground">Total:</span>
        {quote.data ? (
          <span className="type-b-16-bold text-foreground" data-testid="checkout-total">
            {formatEth(quote.data.totalEth)}
          </span>
        ) : (
          <Skeleton className="h-4 w-28" />
        )}
      </div>

      {quote.data && !quote.data.availabilityOk ? (
        <p role="alert" className="type-c-13 mt-3 text-destructive">
          {quote.data.issues.map((issue) => issue.message).join(' ')}
        </p>
      ) : null}
      {stale ? (
        <p role="status" className="type-c-13 mt-3 text-accent">
          A cotação mudou. Confirme o novo total.
        </p>
      ) : null}
      {quote.data ? (
        <label className="mt-3 flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            className="mt-0.5 size-4 cursor-pointer accent-primary"
            checked={acceptedTotal === quote.data.totalEth}
            onChange={(event) =>
              setAcceptedTotal(event.target.checked ? (quote.data?.totalEth ?? null) : null)
            }
          />
          <span className="type-c-13 text-[#c9a27a]">
            Confirmo este total, a taxa e a disponibilidade.
          </span>
        </label>
      ) : null}

      <Button
        type="button"
        className="mt-8 h-14 w-full rounded-full text-[15px] font-bold"
        disabled={blocked || acceptedTotal !== quote.data?.totalEth || place.isPending || !selected}
        onClick={() => place.mutate()}
      >
        {place.isPending ? 'Enviando…' : 'Confirmar compra'}
      </Button>

      <div className="hidden justify-center gap-2 lg:flex">
        <Button
          type="button"
          variant="outline"
          onClick={() => connect.mutate({ walletId: activeWalletId, action: 'connect' })}
        >
          Conectar
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => connect.mutate({ walletId: activeWalletId, action: 'disconnect' })}
        >
          Desconectar
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => connect.mutate({ walletId: activeWalletId, action: 'decline' })}
        >
          Simular recusa
        </Button>
      </div>
      <p className="type-c-12 hidden text-[#c9a27a] lg:block">
        Rede da carteira: {selected ? (selected.network as Network) : 'não selecionada'}. Um clique
        repetido reutiliza a mesma chave de idempotência.
      </p>
    </Page>
  )
}

function roleLabel(role: string | undefined): string {
  if (role === 'primary') return 'Principal'
  if (role === 'secondary') return 'Reserva'
  return 'Nenhuma carteira'
}

function networkLabel(network: string): string {
  if (network === 'ethereum') return 'Ethereum'
  if (network === 'polygon') return 'Polygon'
  if (network === 'base') return 'Base'
  return network
}

function redeLabel(network: string): string {
  if (network === 'ethereum') return 'Rede principal Ethereum'
  return `Rede ${networkLabel(network)}`
}

function shortAddress(address: string): string {
  if (address.length < 12) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
