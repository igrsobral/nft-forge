import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Page } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Network } from '@/contracts/common'
import { createOrder } from '@/lib/api/commerce'
import { setWalletConnection } from '@/lib/api/account'
import { ApiError } from '@/lib/api/errors'
import { requireSession } from '@/lib/auth'
import { formatEth } from '@/lib/money'
import { cartOwnerKey } from '@/lib/owner'
import { cartQuery, quoteQuery, sessionQuery, walletsQuery } from '@/lib/queries'
import { getStoredUserId } from '@/lib/storage'

const idempotencyStorageKey = 'nft-market:order-key'

export const Route = createFileRoute('/checkout')({
  validateSearch: (search: Record<string, unknown>) => {
    const coupon = typeof search.coupon === 'string' && search.coupon.trim() ? search.coupon.trim() : undefined
    return coupon ? { coupon } : {}
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
  const selected = wallets.data?.find((wallet) => wallet.id === walletId) ?? wallets.data?.[0]
  const [acceptedTotal, setAcceptedTotal] = useState<string | null>(null)
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
    <Page title="Checkout">
      {session.isPending || quote.isPending || wallets.isPending ? <Skeleton className="h-40 w-full" /> : null}
      <p className="type-b-14 text-text-secondary">
        Collector {session.data?.user?.displayName} · {session.data?.user?.email}
      </p>
      {cart.data?.items.some((item) => item.changed) ? (
        <p role="status" className="rounded-[10px] border border-accent px-3 py-2 text-accent">
          The market moved while this cart was open. Confirm the new total before paying.
        </p>
      ) : null}
      <fieldset className="grid gap-2">
        <legend className="type-b-14 text-text-secondary">Wallet and network</legend>
        {wallets.data?.map((wallet) => (
          <label key={wallet.id} className="flex items-start gap-2 rounded-[10px] border border-line p-3">
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
        <div className="flex flex-col gap-2 sm:flex-row">
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
        <p className="text-text-secondary">
          Add a wallet before paying. <a className="text-accent" href="/wallets">Wallets</a>
        </p>
      )}
      <p className="type-b-14">Network {selected?.network ?? '—'}</p>
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
              onChange={(event) => setAcceptedTotal(event.target.checked ? quote.data?.totalEth ?? null : null)}
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
      <Button
        type="button"
        className="w-full sm:w-auto"
        disabled={blocked || acceptedTotal !== quote.data?.totalEth || place.isPending || !selected}
        onClick={() => place.mutate()}
      >
        {place.isPending ? 'Sending…' : 'Confirm purchase'}
      </Button>
      <p className="type-c-12 text-text-secondary">
        Network on the wallet is {selected ? (selected.network as Network) : 'not selected'}. A repeated click reuses
        the same idempotency key.
      </p>
    </Page>
  )
}
