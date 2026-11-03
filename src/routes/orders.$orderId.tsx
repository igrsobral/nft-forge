import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Page } from '@/components/page'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api/errors'
import { requireSession } from '@/lib/auth'
import { formatEth } from '@/lib/money'
import { orderQuery } from '@/lib/queries'
import { getStoredUserId } from '@/lib/storage'

export const Route = createFileRoute('/orders/$orderId')({
  beforeLoad: ({ location }) => requireSession(location.href),
  head: () => ({ meta: [{ title: 'Order · Kurio' }] }),
  component: OrderPage,
})

function OrderPage() {
  const { orderId } = Route.useParams()
  const order = useQuery({
    ...orderQuery(getStoredUserId(), orderId),
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 1500 : false),
  })

  if (order.isPending) {
    return (
      <Page title="Order">
        <Skeleton className="h-40 w-full" />
      </Page>
    )
  }
  if (order.isError || !order.data) {
    return (
      <Page title="Order">
        <p role="alert">{order.error instanceof ApiError ? order.error.message : 'Order not found.'}</p>
      </Page>
    )
  }

  const current = order.data
  const confirmed = current.status === 'confirmed'
  return (
    <Page title={confirmed ? 'Order confirmed' : current.status === 'declined' ? 'Payment declined' : 'Payment pending'}>
      <p data-testid="order-status" role="status" className="type-b-16">
        {current.status}
      </p>
      {!confirmed ? (
        <p className="text-text-secondary">
          {current.status === 'pending'
            ? 'Waiting for the simulated payment. Refreshing keeps this same order.'
            : 'The cart was kept. You can try the purchase again.'}
        </p>
      ) : (
        <p className="text-text-secondary">This receipt is the snapshot from the moment the order was created.</p>
      )}
      {current.txRef ? (
        <p className="type-c-12 break-all">
          Transaction <span data-testid="tx-ref">{current.txRef}</span>
        </p>
      ) : null}
      <ul className="grid gap-2">
        {current.receipt.lines.map((line) => (
          <li key={`${line.nftId}-${line.editionId}`} className="flex justify-between gap-3">
            <span>
              {line.name} · {line.editionName} × {line.quantity}
            </span>
            <span>{formatEth(line.lineTotalEth)}</span>
          </li>
        ))}
      </ul>
      <dl className="grid gap-1">
        <div className="flex justify-between">
          <dt>Discount</dt>
          <dd>{formatEth(current.receipt.discountEth)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Network fee</dt>
          <dd>{formatEth(current.receipt.networkFeeEth)}</dd>
        </div>
        <div className="type-b-16-bold flex justify-between text-accent">
          <dt>Total</dt>
          <dd>{formatEth(current.receipt.totalEth)}</dd>
        </div>
      </dl>
      {confirmed ? (
        <Button asChild>
          <Link to="/">Back to the market</Link>
        </Button>
      ) : null}
    </Page>
  )
}
