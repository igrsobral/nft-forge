import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
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
  head: () => ({ meta: [{ title: 'Checkout · Kurio' }] }),
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
  const activeWalletId = selected?.id ?? ''
  const stale = Boolean(quote.data && acceptedTotal && acceptedTotal !== quote.data.totalEth)
  const blocked = !quote.data?.availabilityOk || stale || !selected?.connected

  const connect = useMutation({
    mutationFn: (action: 'connect' | 'disconnect' | 'decline') =>
      setWalletConnection(activeWalletId, action),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
    onError: async (error) => {
      toast.error(error instanceof ApiError ? error.message : 'The wallet did not connect.')
      await queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
  })

  const place = useMutation({
    mutationFn: () => {
      if (!quote.data || !selected) throw new Error('Review the order first')
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
      toast.error(error instanceof ApiError ? error.message : 'The order was not created.')
      void queryClient.invalidateQueries({ queryKey: ['quote'] })
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  return (
    <Page
      title="Checkout"
      titleClassName="type-t-18-bold text-foreground max-lg:sr-only lg:text-[32px] lg:leading-tight"
      className="max-lg:pb-40"
    >
      <div className="lg:hidden">
        <a href="/cart" aria-label="Voltar" className="mb-3 flex size-11 items-center">
          <ChevronLeft className="size-5" />
        </a>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-[#c9a27a]">Carteira conectada</p>
            <p className="font-bold">{roleLabel(selected?.role)}</p>
            <p className="text-xs break-all text-[#c9a27a]">
              {selected
                ? `${shortAddress(selected.address)} · ${networkLabel(selected.network)}`
                : 'Nenhuma carteira'}
            </p>
          </div>
          <a
            href="/profile/wallets"
            className="flex min-h-11 shrink-0 items-center text-sm text-primary"
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
                    ? 'flex min-h-11 items-start gap-3 rounded-xl border border-primary bg-[#24140f] px-3 py-3'
                    : 'flex min-h-11 items-start gap-3 rounded-xl border border-transparent bg-[#24140f] px-3 py-3'
                }
              >
                <input
                  type="radio"
                  name="wallet-mobile"
                  className="mt-1 size-4 accent-primary"
                  checked={checked}
                  onChange={() => setWalletId(wallet.id)}
                />
                <span className="min-w-0">
                  <span className="block font-bold">{roleLabel(wallet.role)}</span>
                  <span className="block text-xs break-all text-[#c9a27a]">
                    {shortAddress(wallet.address)} · {networkLabel(wallet.network)}
                  </span>
                </span>
              </label>
            )
          })}
        </fieldset>
        <fieldset className="mt-5 grid gap-2">
          <legend className="mb-2 text-sm text-foreground">Carteira e rede</legend>
          {(['WalletConnect', 'MetaMask', 'Coinbase Wallet'] as const).map((name) => (
            <label
              key={name}
              className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-[#24140f] px-3"
            >
              <span>{name}</span>
              <input
                type="radio"
                name="provider"
                className="size-4 accent-primary"
                checked={provider === name}
                disabled={!selected}
                onChange={() => {
                  setProvider(name)
                  if (selected && !selected.connected) connect.mutate('connect')
                }}
              />
            </label>
          ))}
        </fieldset>
      </div>
      {session.isPending || quote.isPending || wallets.isPending ? (
        <Skeleton className="h-40 w-full" />
      ) : null}
      <p className="type-b-14 hidden text-text-secondary lg:block">
        Collector {session.data?.user?.displayName} · {session.data?.user?.email}
      </p>
      {cart.data?.items.some((item) => item.changed) ? (
        <p role="status" className="rounded-[10px] border border-accent px-3 py-2 text-accent">
          The market moved while this cart was open. Confirm the new total before paying.
        </p>
      ) : null}
      <fieldset className="hidden gap-2 lg:grid">
        <legend className="type-b-14 text-text-secondary">Wallet and network</legend>
        {wallets.data?.map((wallet) => (
          <label
            key={wallet.id}
            className="flex items-start gap-2 rounded-[10px] border border-line p-3"
          >
            <input
              type="radio"
              name="wallet"
              checked={(selected?.id ?? '') === wallet.id}
              onChange={() => setWalletId(wallet.id)}
            />
            <span>
              <span className="type-b-14-bold block">{wallet.label}</span>
              <span className="type-c-12 block text-text-secondary">
                {wallet.role} · {wallet.network} · {wallet.connected ? 'connected' : 'disconnected'}
              </span>
              <span className="type-c-12 block break-all">{wallet.address}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {selected ? (
        <div className="hidden flex-col gap-2 sm:flex-row lg:flex">
          <Button type="button" variant="outline" onClick={() => connect.mutate('connect')}>
            Connect
          </Button>
          <Button type="button" variant="outline" onClick={() => connect.mutate('disconnect')}>
            Disconnect
          </Button>
          <Button type="button" variant="outline" onClick={() => connect.mutate('decline')}>
            Simulate refusal
          </Button>
        </div>
      ) : (
        <p className="hidden text-text-secondary lg:block">
          Add a wallet before paying.{' '}
          <a className="text-accent" href="/profile/wallets">
            Wallets
          </a>
        </p>
      )}
      <p className="type-b-14 hidden lg:block">Network {selected?.network ?? '—'}</p>
      {quote.data ? (
        <div className="grid gap-2">
          {!quote.data.availabilityOk ? (
            <p role="alert" className="text-destructive">
              {quote.data.issues.map((issue) => issue.message).join(' ')}
            </p>
          ) : null}
          <p className="type-b-16-bold text-accent" data-testid="checkout-total">
            Total {formatEth(quote.data.totalEth)}
          </p>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={acceptedTotal === quote.data.totalEth}
              onChange={(event) =>
                setAcceptedTotal(event.target.checked ? (quote.data?.totalEth ?? null) : null)
              }
            />
            <span className="type-b-14">I confirm this total, fee, and availability.</span>
          </label>
          {stale ? (
            <p role="status" className="text-accent">
              The quote changed. Confirm the new total.
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="max-lg:fixed max-lg:inset-x-0 max-lg:bottom-[calc(4.25rem+env(safe-area-inset-bottom))] max-lg:z-30 max-lg:bg-[#140d0a] max-lg:p-3">
        <Button
          type="button"
          className="h-11 w-full sm:w-auto"
          disabled={
            blocked || acceptedTotal !== quote.data?.totalEth || place.isPending || !selected
          }
          onClick={() => place.mutate()}
        >
          {place.isPending ? (
            'Sending…'
          ) : (
            <>
              <span className="lg:hidden">Confirmar compra</span>
              <span className="hidden lg:inline">Confirm purchase</span>
            </>
          )}
        </Button>
      </div>
      <p className="type-c-12 hidden text-text-secondary lg:block">
        Network on the wallet is {selected ? (selected.network as Network) : 'not selected'}. A
        repeated click reuses the same idempotency key.
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

function shortAddress(address: string): string {
  if (address.length < 12) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
