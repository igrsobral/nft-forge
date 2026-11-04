import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { formatEth } from '@/lib/money'
import { ordersQuery } from '@/lib/queries'
import { getStoredUserId } from '@/lib/storage'

export const Route = createFileRoute('/profile/activity')({
  head: () => ({ meta: [{ title: 'Atividade · Kurio' }] }),
  component: ActivityPage,
})

function ActivityPage() {
  const orders = useQuery({
    ...ordersQuery(getStoredUserId()),
    enabled: Boolean(getStoredUserId()),
  })
  const items = orders.data ?? []
  return (
    <section>
      <h2 className="type-b-16-bold mb-4 text-foreground">Atividade</h2>
      {items.length === 0 ? (
        <p className="text-sm text-[#c9a27a]">
          Nenhum pedido ainda. Uma compra confirmada aparece aqui.
        </p>
      ) : (
        <ul className="grid gap-3">
          {items.map((order) => (
            <li key={order.id} className="rounded-xl bg-[#24140f] p-4">
              <Link
                to="/orders/$orderId"
                params={{ orderId: order.id }}
                className="font-bold text-primary hover:underline"
              >
                Pedido {order.id.slice(0, 8)}
              </Link>
              <p className="mt-1 text-sm text-[#c9a27a]">
                {order.status} · {formatEth(order.receipt.totalEth)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
