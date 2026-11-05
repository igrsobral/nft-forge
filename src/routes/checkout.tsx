import { createFileRoute } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { WalletPayment } from '@/components/checkout/wallet-payment'
import { Page } from '@/components/page'
import { requireSession } from '@/lib/auth'
import { pickAuth } from '@/lib/auth-search'

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

function CheckoutPage() {
  const search = Route.useSearch()

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

      <WalletPayment couponCode={search.coupon} />
    </Page>
  )
}
