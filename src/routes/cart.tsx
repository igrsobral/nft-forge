import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'
import { EditionCarousel } from '@/components/catalog/edition-carousel'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { CartItem } from '@/contracts/commerce'
import { removeCartItem, updateCartItem } from '@/lib/api/commerce'
import { ApiError } from '@/lib/api/errors'
import { toListQuery } from '@/lib/catalog-search'
import { formatEth } from '@/lib/money'
import { cartOwnerKey } from '@/lib/owner'
import { cartQuery, nftListQuery, quoteQuery, sessionQuery } from '@/lib/queries'
import { getSessionEpoch, getStoredUserId, subscribeSession } from '@/lib/storage'

export const Route = createFileRoute('/cart')({
  head: () => ({ meta: [{ title: 'Carrinho · Kurio' }] }),
  component: CartPage,
})

function CartPage() {
  useSyncExternalStore(subscribeSession, getSessionEpoch, () => 0)
  const userId = getStoredUserId()
  const session = useQuery(sessionQuery(userId))
  const owner = cartOwnerKey(session.data?.user?.id ?? userId)
  const cart = useQuery(cartQuery(owner))
  const picks = useQuery(
    nftListQuery(getStoredUserId(), toListQuery({ pageSize: 12, sort: 'newest' })),
  )
  const [coupon, setCoupon] = useState('')
  const [applied, setApplied] = useState<string | undefined>(undefined)
  const quote = useQuery({
    ...quoteQuery(owner, applied ? { couponCode: applied } : {}),
    enabled: Boolean(cart.data),
  })
  const queryClient = useQueryClient()
  const changed = cart.data?.items.some((item) => item.changed) ?? false
  const suggestions = (picks.data?.items ?? []).filter(
    (item) => !cart.data?.items.some((line) => line.nftId === item.id),
  )
  const signedIn = Boolean(session.data?.user)
  const checkoutSearch = applied ? { coupon: applied } : {}
  const loginRedirect = applied ? `/checkout?coupon=${encodeURIComponent(applied)}` : '/checkout'

  const update = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      updateCartItem(id, quantity),
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

  const hasItems = (cart.data?.items.length ?? 0) > 0

  return (
    <main className="mx-auto w-full max-w-[1440px] min-w-0 overflow-x-clip px-4 py-6 lg:px-10 lg:py-8">
      <p className="type-c-13 mb-6 text-[#c9a27a]">
        <Link to="/" className="hover:text-primary">
          Início
        </Link>
        <span aria-hidden> / </span>
        <a href="/#catalogo" className="hover:text-primary">
          Mercado
        </a>
        <span aria-hidden> / </span>
        <span>Carrinho</span>
      </p>

      {cart.isPending ? <Skeleton className="h-48 w-full rounded-xl" /> : null}
      {cart.isError ? (
        <p role="alert" className="text-destructive">
          {cart.error instanceof ApiError
            ? cart.error.message
            : 'O carrinho não pôde ser carregado.'}
        </p>
      ) : null}

      {cart.data && !hasItems ? (
        <div className="rounded-xl bg-[#24140f] px-6 py-14 text-center">
          <h1 className="text-xl font-bold text-foreground">Seu carrinho está vazio</h1>
          <p className="mt-2 text-[#c9a27a]">Escolha uma edição no mercado para começar.</p>
          <Link
            to="/"
            hash="catalogo"
            className="type-b-14 mt-4 inline-block text-primary hover:underline"
          >
            Continuar explorando
          </Link>
        </div>
      ) : null}

      {hasItems ? (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section aria-label="Itens do carrinho">
            {changed ? (
              <p
                role="status"
                className="mb-3 rounded-lg border border-primary/60 px-3 py-2 text-sm text-primary"
              >
                O preço ou o estoque mudou. O resumo usa a cotação mais recente.
              </p>
            ) : null}
            <div className="type-c-13 mb-2 hidden grid-cols-[minmax(0,1.7fr)_0.7fr_0.9fr_0.7fr_2.5rem] gap-3 px-4 text-[#c9a27a] lg:grid">
              <span>NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
              <span className="sr-only">Remover</span>
            </div>
            <ul className="flex flex-col gap-3">
              {cart.data?.items.map((item) => (
                <CartRow
                  key={item.id}
                  item={item}
                  pending={update.isPending || remove.isPending}
                  onQuantity={(quantity) => update.mutate({ id: item.id, quantity })}
                  onRemove={() => remove.mutate(item.id)}
                />
              ))}
            </ul>
          </section>

          <aside className="rounded-xl bg-[#24140f] p-5">
            <h1 className="type-b-16-bold border-b border-[#6a4332] pb-3 text-foreground">
              Resumo da carteira
            </h1>
            <form
              className="mt-4"
              onSubmit={(event) => {
                event.preventDefault()
                setApplied(coupon.trim() || undefined)
              }}
            >
              <label htmlFor="coupon" className="type-c-13 text-[#c9a27a]">
                Código promocional
              </label>
              <div className="mt-2 flex">
                <input
                  id="coupon"
                  value={coupon}
                  onChange={(event) => setCoupon(event.target.value)}
                  placeholder="Digite o código promocional..."
                  className="type-c-13 h-10 min-w-0 flex-1 rounded-l-md border border-[#6a4332] bg-[#1a100c] px-3 text-foreground placeholder:text-[#c9a27a]/70"
                />
                <button
                  type="submit"
                  className="type-b-14-bold h-10 rounded-r-md bg-primary px-4 text-primary-foreground"
                >
                  Aplicar
                </button>
              </div>
              {applied ? (
                <button
                  type="button"
                  className="type-c-12 mt-2 text-[#c9a27a] underline-offset-2 hover:underline"
                  onClick={() => {
                    setCoupon('')
                    setApplied(undefined)
                  }}
                >
                  Remover código
                </button>
              ) : null}
            </form>
            {quote.data?.coupon && !quote.data.coupon.valid ? (
              <p
                role="alert"
                data-testid="coupon-error"
                className="type-c-13 mt-2 text-destructive"
              >
                {quote.data.coupon.reason === 'expired'
                  ? 'Esse código expirou.'
                  : 'Esse código não é válido.'}
              </p>
            ) : null}
            {quote.data ? (
              <dl data-testid="quote-summary" className="type-b-14 mt-5 grid gap-3 text-foreground">
                <div className="flex items-baseline justify-between gap-3">
                  <dt>Subtotal</dt>
                  <dd>{formatEth(quote.data.subtotalEth)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt>Desconto do lançamento</dt>
                  <dd data-testid="quote-discount">(-) {formatEth(quote.data.discountEth)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt>
                    Taxa de rede
                    <span className="type-c-12 mt-1 block text-[#8d847c]">Taxa estimada</span>
                  </dt>
                  <dd>{formatEth(quote.data.networkFeeEth)}</dd>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-[#6a4332] pt-3 font-bold text-primary">
                  <dt>Total</dt>
                  <dd data-testid="quote-total">{formatEth(quote.data.totalEth)}</dd>
                </div>
              </dl>
            ) : (
              <Skeleton className="mt-5 h-28 w-full" />
            )}
            <Button asChild className="mt-5 h-11 w-full rounded-md">
              {signedIn ? (
                <Link to="/checkout" search={checkoutSearch}>
                  Conectar e finalizar
                </Link>
              ) : (
                <Link to="/login" search={{ redirect: loginRedirect }}>
                  Conectar e finalizar
                </Link>
              )}
            </Button>
            <Link
              to="/"
              hash="catalogo"
              className="type-c-13 mt-3 block text-center text-primary hover:underline"
            >
              Continuar explorando
            </Link>
          </aside>
        </div>
      ) : null}

      <EditionCarousel title="Colecionadores também viram" items={suggestions} />
    </main>
  )
}

function CartRow({
  item,
  pending,
  onQuantity,
  onRemove,
}: {
  item: CartItem
  pending: boolean
  onQuantity: (quantity: number) => void
  onRemove: () => void
}) {
  const max = Math.min(20, item.remaining)
  return (
    <li
      data-testid="cart-item"
      className="grid items-center gap-3 rounded-xl bg-[#24140f] p-3 lg:grid-cols-[minmax(0,1.7fr)_0.7fr_0.9fr_0.7fr_2.5rem] lg:px-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={item.imageUrl}
          alt=""
          width={64}
          height={64}
          className="size-14 shrink-0 rounded-lg object-cover sm:size-16"
        />
        <div className="min-w-0">
          <p className="type-b-14-bold truncate text-foreground">{item.name}</p>
          <p className="type-c-12 text-[#c9a27a]">ID do token: {item.tokenId}</p>
          <p className="type-c-12 text-[#8d847c]">Edição {item.editionName}</p>
        </div>
      </div>
      <p className="type-b-14 text-foreground">
        <span className="type-c-12 mr-2 text-[#c9a27a] lg:hidden">Preço</span>
        {formatEth(item.unitPriceEth)}
      </p>
      <div className="flex items-center gap-2">
        <span className="type-c-12 text-[#c9a27a] lg:hidden">Edições</span>
        <button
          type="button"
          aria-label="Diminuir quantidade"
          disabled={pending || item.quantity <= 1}
          onClick={() => onQuantity(item.quantity - 1)}
          className="flex size-7 items-center justify-center border border-[#6a4332] bg-[#1a100c] text-foreground disabled:opacity-40"
        >
          −
        </button>
        <span data-testid="cart-quantity" className="type-b-14 min-w-4 text-center">
          {item.quantity}
        </span>
        <button
          type="button"
          aria-label="Aumentar quantidade"
          disabled={pending || item.quantity >= max}
          onClick={() => onQuantity(item.quantity + 1)}
          className="flex size-7 items-center justify-center border border-[#6a4332] bg-[#1a100c] text-foreground disabled:opacity-40"
        >
          +
        </button>
      </div>
      <p className="type-b-14-bold text-primary">
        <span className="type-c-12 mr-2 font-normal text-[#c9a27a] lg:hidden">Total</span>
        {formatEth(item.lineTotalEth)}
      </p>
      <button
        type="button"
        aria-label={`Remover ${item.name}`}
        disabled={pending}
        onClick={onRemove}
        className="justify-self-end text-[#c9a27a] hover:text-primary disabled:opacity-40"
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  )
}
