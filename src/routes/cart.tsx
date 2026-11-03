import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSyncExternalStore, useState } from 'react'
import { Page } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth } from '@/lib/money'
import { cartOwnerKey } from '@/lib/owner'
import { cartQuery, quoteQuery, sessionQuery } from '@/lib/queries'
import { removeCartItem, updateCartItem } from '@/lib/api/commerce'
import { ApiError } from '@/lib/api/errors'
import { getSessionEpoch, getStoredUserId, subscribeSession } from '@/lib/storage'

export const Route = createFileRoute('/cart')({
  head: () => ({ meta: [{ title: 'Cart · Kurio' }] }),
  component: CartPage,
})

function CartPage() {
  useSyncExternalStore(subscribeSession, getSessionEpoch, () => 0)
  const userId = getStoredUserId()
  const session = useQuery(sessionQuery(userId))
  const owner = cartOwnerKey(session.data?.user?.id ?? userId)
  const cart = useQuery(cartQuery(owner))
  const [coupon, setCoupon] = useState('')
  const [applied, setApplied] = useState<string | undefined>(undefined)
  const quote = useQuery({
    ...quoteQuery(owner, applied ? { couponCode: applied } : {}),
    enabled: Boolean(cart.data),
  })
  const queryClient = useQueryClient()
  const changed = cart.data?.items.some((item) => item.changed) ?? false

  const update = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => updateCartItem(id, quantity),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      await queryClient.invalidateQueries({ queryKey: ['quote'] })
    },
  })
  const remove = useMutation({
    mutationFn: (id: string) => removeCartItem(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      await queryClient.invalidateQueries({ queryKey: ['quote'] })
    },
  })

  return (
    <Page title="Cart">
      {cart.isPending ? <Skeleton className="h-40 w-full" /> : null}
      {cart.isError ? (
        <p role="alert" className="text-destructive">
          {cart.error instanceof ApiError ? cart.error.message : 'The cart could not be loaded.'}
        </p>
      ) : null}
      {cart.data && cart.data.items.length === 0 ? (
        <p className="text-text-secondary">Your cart is empty.</p>
      ) : null}
      {changed ? (
        <p role="status" className="rounded-[10px] border border-accent px-3 py-2 text-accent">
          A price or the remaining stock changed. The summary below uses the latest quote.
        </p>
      ) : null}
      <ul className="grid gap-4">
        {cart.data?.items.map((item) => (
          <li key={item.id} data-testid="cart-item" className="grid gap-3 rounded-[14px] border border-line p-3 sm:grid-cols-[72px_1fr_auto]">
            <img src={item.imageUrl} alt="" width={72} height={72} className="size-[72px] rounded-[10px] object-cover" />
            <div className="min-w-0">
              <p className="type-b-14-bold truncate">{item.name}</p>
              <p className="type-c-12 text-text-secondary">{item.editionName}</p>
              <p className="type-b-14 text-accent">{formatEth(item.unitPriceEth)}</p>
              {item.changed ? <p className="type-c-12 text-accent">Updated</p> : null}
            </div>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor={`qty-${item.id}`}>
                Quantity for {item.name}
              </label>
              <input
                id={`qty-${item.id}`}
                type="number"
                min={1}
                max={Math.min(20, item.remaining)}
                defaultValue={item.quantity}
                key={`${item.id}-${item.quantity}`}
                className="type-b-14 h-11 w-16 rounded-[10px] border border-line bg-background px-2"
                onBlur={(event) => {
                  const quantity = Number(event.target.value)
                  if (quantity !== item.quantity && quantity >= 1) update.mutate({ id: item.id, quantity })
                }}
              />
              <Button type="button" variant="outline" onClick={() => remove.mutate(item.id)}>
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          setApplied(coupon.trim() || undefined)
        }}
      >
        <label className="sr-only" htmlFor="coupon">
          Coupon
        </label>
        <input
          id="coupon"
          value={coupon}
          onChange={(event) => setCoupon(event.target.value)}
          placeholder="Coupon"
          className="type-b-14 h-11 flex-1 rounded-[10px] border border-line bg-background px-3"
        />
        <Button type="submit" variant="outline">
          Apply coupon
        </Button>
        {applied ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setCoupon('')
              setApplied(undefined)
            }}
          >
            Remove coupon
          </Button>
        ) : null}
      </form>
      {quote.data?.coupon && !quote.data.coupon.valid ? (
        <p role="alert" className="text-destructive">
          {quote.data.coupon.reason === 'expired' ? 'That coupon has expired.' : 'That coupon is not valid.'}
        </p>
      ) : null}
      {quote.data ? (
        <dl className="grid gap-1 text-sm" data-testid="quote-summary">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatEth(quote.data.subtotalEth)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Discount</dt>
            <dd>{formatEth(quote.data.discountEth)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Network fee</dt>
            <dd>{formatEth(quote.data.networkFeeEth)}</dd>
          </div>
          <div className="type-b-16-bold flex justify-between text-accent">
            <dt>Total</dt>
            <dd data-testid="quote-total">{formatEth(quote.data.totalEth)}</dd>
          </div>
        </dl>
      ) : null}
      {cart.data && cart.data.items.length > 0 ? (
        session.data?.user ? (
          <Button asChild className="w-full sm:w-auto">
            <Link to="/checkout" search={{ coupon: applied }}>
              Checkout
            </Link>
          </Button>
        ) : (
          <Button asChild className="w-full sm:w-auto">
            <Link to="/login" search={{ redirect: applied ? `/checkout?coupon=${applied}` : '/checkout' }}>
              Sign in to checkout
            </Link>
          </Button>
        )
      ) : null}
    </Page>
  )
}
