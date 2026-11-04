import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { ReceiptDialog } from '@/components/orders/receipt-dialog'
import { Page } from '@/components/page'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api/errors'
import { requireSession } from '@/lib/auth'
import { orderQuery } from '@/lib/queries'
import { getStoredUserId } from '@/lib/storage'

export const Route = createFileRoute('/orders/$orderId')({
  beforeLoad: ({ location }) => requireSession(location.href),
  head: () => ({ meta: [{ title: 'Compra · Kurio' }] }),
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
      <Page title="Compra">
        <Skeleton className="h-40 w-full" />
      </Page>
    )
  }
  if (order.isError || !order.data) {
    return (
      <Page title="Compra">
        <p role="alert">
          {order.error instanceof ApiError ? order.error.message : 'Pedido não encontrado.'}
        </p>
      </Page>
    )
  }

  const current = order.data
  if (current.status === 'confirmed') {
    return (
      <main>
        <ReceiptDialog order={current} />
      </main>
    )
  }

  return (
    <Page title={current.status === 'declined' ? 'Pagamento recusado' : 'Pagamento pendente'}>
      <p data-testid="order-status" role="status" className="type-b-16">
        {current.status}
      </p>
      <p className="text-text-secondary">
        {current.status === 'pending'
          ? 'Aguardando a confirmação simulada. Esta página acompanha o mesmo pedido.'
          : 'O carrinho foi mantido. Você pode tentar a compra de novo.'}
      </p>
    </Page>
  )
}
