import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'
import { useOpenAuth } from '@/components/auth/auth-modal'
import { EditionCarousel } from '@/components/catalog/edition-carousel'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { CartItem } from '@/contracts/commerce'
import { removeCartItem, updateCartItem } from '@/lib/api/commerce'
import { ApiError } from '@/lib/api/errors'
import { pickAuth } from '@/lib/auth-search'
import { CART_QUANTITY_CAP } from '@/lib/cart'
import { toListQuery } from '@/lib/catalog-search'
import { formatEth } from '@/lib/money'
import { cartOwnerKey } from '@/lib/owner'
import { cartQuery, nftListQuery, quoteQuery, sessionQuery } from '@/lib/queries'
import { getSessionEpoch, getStoredUserId, subscribeSession } from '@/lib/storage'

export const Route = createFileRoute('/cart')({
  validateSearch: (search: Record<string, unknown>) => pickAuth(search),
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
  const openAuth = useOpenAuth()

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
    <main className="mx-auto w-full max-w-[1440px] min-w-0 overflow-x-clip px-4 py-4 pb-28 lg:px-10 lg:py-8 lg:pb-8">
      <header className="relative mb-5 flex min-h-11 items-center justify-center lg:hidden">
        <a
          href="/#catalogo"
          aria-label="Voltar"
          className="absolute left-0 flex size-11 items-center justify-center rounded-full border border-[#3f2319] bg-[#241612] text-foreground transition-colors hover:bg-[#2f1d15]"
        >
          <ChevronLeft className="size-5" />
        </a>
        <h1 className="type-b-16-bold text-foreground">Carrinho de NFTs</h1>
      </header>
      <h1 className="type-t-18-bold mb-6 hidden text-foreground lg:block">Carrinho de NFTs</h1>
      <p className="type-c-13 mb-6 hidden text-[#c9a27a] lg:block">
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

      {cart.isPending ? <Skeleton className="h-48 w-full rounded-2xl" /> : null}
      {cart.isError ? (
        <p role="alert" className="text-destructive">
          {cart.error instanceof ApiError
            ? cart.error.message
            : 'O carrinho não pôde ser carregado.'}
        </p>
      ) : null}

      {cart.data && !hasItems ? (
        <div className="rounded-2xl border border-[#3f2319] bg-[#24140f] px-6 py-14 text-center">
          <h1 className="type-b-16-bold text-foreground">Seu carrinho está vazio</h1>
          <p className="type-c-13 mt-2 text-[#c9a27a]">
            Escolha uma edição no mercado para começar.
          </p>
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
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section aria-label="Itens do carrinho" className="min-w-0">
            {changed ? (
              <p
                role="status"
                className="type-c-13 mb-3 rounded-xl border border-primary/60 px-3 py-2 text-primary"
              >
                O preço ou o estoque mudou. O resumo usa a cotação mais recente.
              </p>
            ) : null}
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

          <aside className="min-w-0 rounded-2xl border border-[#3f2319] bg-[#24140f] p-4 lg:p-5">
            <h2 className="type-b-16-bold text-foreground max-lg:sr-only">Resumo da carteira</h2>
            <form
              className="flex items-center rounded-full border border-[#6a4332] bg-[#1a100c] p-1 pr-1 lg:mt-5"
              onSubmit={(event) => {
                event.preventDefault()
                setApplied(coupon.trim() || undefined)
              }}
            >
              <label htmlFor="coupon" className="sr-only">
                Código promocional
              </label>
              <input
                id="coupon"
                value={coupon}
                onChange={(event) => setCoupon(event.target.value)}
                placeholder="Digite o código promocional..."
                className="type-c-13 h-10 min-w-0 flex-1 bg-transparent px-4 text-foreground outline-none placeholder:text-[#c9a27a]/70"
              />
              <button
                type="submit"
                className="type-b-14-bold h-10 shrink-0 cursor-pointer rounded-full bg-gradient-cta px-5 text-primary-foreground transition-[filter] hover:brightness-110"
              >
                Aplicar
              </button>
            </form>
            {applied ? (
              <button
                type="button"
                className="type-c-12 mt-2 px-1 text-[#c9a27a] underline-offset-2 hover:underline"
                onClick={() => {
                  setCoupon('')
                  setApplied(undefined)
                }}
              >
                Remover código
              </button>
            ) : null}
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
              <dl data-testid="quote-summary" className="mt-6 grid gap-4 text-foreground lg:mt-7">
                <div className="type-b-14 flex items-baseline justify-between gap-3">
                  <dt>Subtotal</dt>
                  <dd className="type-b-14-bold">{formatEth(quote.data.subtotalEth)}</dd>
                </div>
                <div className="type-b-14 flex items-baseline justify-between gap-3">
                  <dt>Desconto do lançamento</dt>
                  <dd className="type-b-14-bold" data-testid="quote-discount">
                    (-) {formatEth(quote.data.discountEth)}
                  </dd>
                </div>
                <div className="type-b-14 flex items-baseline justify-between gap-3">
                  <dt>Taxa de rede</dt>
                  <dd className="flex flex-col items-end">
                    <span className="type-b-14-bold">{formatEth(quote.data.networkFeeEth)}</span>
                    <span className="type-c-12 text-[#c9a27a]">Taxa estimada</span>
                  </dd>
                </div>
                <div className="type-b-16-bold mt-1 flex items-baseline justify-between gap-3 border-t border-[#6a4332] pt-4 text-foreground">
                  <dt>Total</dt>
                  <dd data-testid="quote-total">{formatEth(quote.data.totalEth)}</dd>
                </div>
              </dl>
            ) : (
              <Skeleton className="mt-6 h-28 w-full" />
            )}
            {signedIn ? (
              <Button asChild className="mt-6 h-12 w-full rounded-full text-[15px] font-bold">
                <Link to="/checkout" search={checkoutSearch}>
                  Conectar e finalizar
                </Link>
              </Button>
            ) : (
              <button
                type="button"
                className="group/button inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-gradient-cta text-[15px] font-bold whitespace-nowrap text-primary-foreground transition-all outline-none select-none hover:brightness-110 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px"
                onClick={() => openAuth('login', loginRedirect)}
              >
                Conectar e finalizar
              </button>
            )}
            <Link
              to="/"
              hash="catalogo"
              className="type-c-13 mt-3 block text-center text-[#c9a27a] hover:text-primary hover:underline"
            >
              Continuar explorando
            </Link>
          </aside>
        </div>
      ) : null}

      <div className="mt-10 hidden lg:block">
        <EditionCarousel title="Colecionadores também viram" items={suggestions} />
      </div>
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
  const max = Math.min(CART_QUANTITY_CAP, item.remaining)
  return (
    <li
      data-testid="cart-item"
      className="min-w-0 flex items-center gap-2.5 rounded-2xl border border-[#3f2319] bg-[#24140f] p-3"
    >
      <img
        src={item.imageUrl}
        alt=""
        width={56}
        height={56}
        className="size-14 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] leading-tight font-bold text-foreground">
          {item.name} {item.tokenId}
        </p>
        <p className="type-c-12 mt-1 text-[#c9a27a]">Edição: {item.editionName}</p>
        <p className="type-b-16-bold mt-1.5 text-primary">
          {formatEth(item.unitPriceEth)}
          <span className="sr-only">
            {' '}
            ID do token: {item.tokenId} · edição {item.editionName}
          </span>
        </p>
      </div>
      <div className="relative flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          aria-label="Diminuir quantidade"
          disabled={pending || item.quantity <= 1}
          onClick={() => onQuantity(item.quantity - 1)}
          className="flex size-7 cursor-pointer items-center justify-center rounded-full border border-[#6a4332] bg-[#1a100c] text-[#c9a27a] transition-colors hover:text-foreground disabled:opacity-40"
        >
          −
        </button>
        <span
          data-testid="cart-quantity"
          className="min-w-5 text-center text-[14px] font-bold text-foreground"
        >
          {item.quantity}
        </span>
        <button
          type="button"
          aria-label="Aumentar quantidade"
          disabled={pending || item.quantity >= max}
          onClick={() => onQuantity(item.quantity + 1)}
          className="relative flex size-7 cursor-pointer items-center justify-center rounded-full bg-gradient-cta text-primary-foreground transition-[filter] hover:brightness-110 disabled:opacity-40"
        >
          +
        </button>
        <button
          type="button"
          aria-label={`Remover ${item.name}`}
          disabled={pending}
          onClick={onRemove}
          className="absolute bottom-0 right-0 z-10 flex size-7 translate-x-[55%] translate-y-[55%] cursor-pointer items-center justify-center rounded-full text-primary transition-colors hover:text-destructive disabled:opacity-40"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </li>
  )
}
