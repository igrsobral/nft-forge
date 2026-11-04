import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Heart, ShoppingCart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { rememberFavorite, takeFavoriteResume, useOpenAuth } from '@/components/auth/auth-modal'
import { toast } from 'sonner'
import type { NftDetail } from '@/contracts/catalog'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api/errors'
import { addFavorite, addCartItem, removeFavorite } from '@/lib/api/commerce'
import { favoritesQuery } from '@/lib/queries'
import { queryKeys } from '@/lib/query-keys'
import { CART_QUANTITY_CAP } from '@/lib/cart'
import { formatEth } from '@/lib/money'
import { getSessionEpoch, getStoredUserId, subscribeSession } from '@/lib/storage'
import { useSyncExternalStore } from 'react'

const pillOrder = ['1/1', '1/10', '1/50', 'ABERTA']

export function PurchasePanel({ nft }: { nft: NftDetail }) {
  useSyncExternalStore(subscribeSession, getSessionEpoch, () => 0)
  const openAuth = useOpenAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userId = getStoredUserId()
  const favorites = useQuery({ ...favoritesQuery(userId), enabled: Boolean(userId) })
  const [editionId, setEditionId] = useState(nft.editions[0]?.id ?? '')
  const [seenNft, setSeenNft] = useState(nft.id)
  if (nft.id !== seenNft) {
    setSeenNft(nft.id)
    setEditionId(nft.editions[0]?.id ?? '')
  }
  const edition = nft.editions.find((item) => item.id === editionId) ?? nft.editions[0]
  const maxQuantity = Math.min(CART_QUANTITY_CAP, edition?.remaining ?? 0)
  const [quantity, setQuantity] = useState(1)
  const saved = favorites.data?.includes(nft.id) ?? false
  const nextQuantity = Math.min(Math.max(1, quantity), Math.max(1, maxQuantity))
  const pills = [...nft.editions].sort(
    (left, right) => pillOrder.indexOf(left.label) - pillOrder.indexOf(right.label),
  )

  function askSignIn() {
    rememberFavorite(nft.id)
    openAuth('login')
  }

  const favorite = useMutation({
    mutationFn: async () => {
      if (!userId) return
      if (saved) await removeFavorite(nft.id)
      else await addFavorite(nft.id)
    },
    onMutate: async () => {
      if (!userId) return
      const key = queryKeys.favorites(userId)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<string[]>(key) ?? []
      queryClient.setQueryData<string[]>(
        key,
        saved ? previous.filter((id) => id !== nft.id) : [...previous, nft.id],
      )
      return { previous }
    },
    onError: (error, _vars, context) => {
      if (userId && context?.previous) {
        queryClient.setQueryData(queryKeys.favorites(userId), context.previous)
      }
      toast.error(error instanceof ApiError ? error.message : 'Não foi possível salvar o favorito.')
    },
    onSettled: async () => {
      if (userId) await queryClient.invalidateQueries({ queryKey: queryKeys.favorites(userId) })
    },
  })

  useEffect(() => {
    if (!userId || !takeFavoriteResume(nft.id)) return
    favorite.mutate()
  }, [favorite, nft.id, userId])

  const add = useMutation({
    mutationFn: () => {
      if (!edition) throw new Error('Escolha uma edição')
      return addCartItem({ nftId: nft.id, editionId: edition.id, quantity: nextQuantity })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Adicionado ao carrinho')
      void navigate({ to: '/cart' })
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Não foi possível adicionar esta edição.',
      )
    },
  })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="type-b-14 text-foreground">Edição:</p>
        <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label="Edição">
          {pills.map((item) => {
            const selected = item.id === edition?.id
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                disabled={item.remaining === 0}
                onClick={() => {
                  setEditionId(item.id)
                  setQuantity(1)
                }}
                className={
                  selected
                    ? 'type-c-13 min-h-11 rounded-md border border-primary px-3 font-bold text-primary lg:min-h-0 lg:px-2.5 lg:py-1'
                    : 'type-c-13 min-h-11 rounded-md px-3 text-primary/80 hover:text-primary disabled:opacity-40 lg:min-h-0 lg:px-2.5 lg:py-1'
                }
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-[calc(4.25rem+env(safe-area-inset-bottom))] max-lg:z-30 max-lg:border-t max-lg:border-[#6a4332] max-lg:bg-[#24140f] max-lg:px-3 max-lg:py-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-3">
        <div className="flex w-full items-center gap-2">
          <button
            type="button"
            aria-label="Diminuir quantidade"
            disabled={maxQuantity === 0 || nextQuantity <= 1}
            onClick={() => setQuantity(nextQuantity - 1)}
            className="flex size-11 items-center justify-center rounded-full border border-primary text-lg leading-none text-primary disabled:opacity-40 lg:size-8"
          >
            −
          </button>
          <span data-testid="quantity" className="type-b-16 min-w-4 text-center">
            {maxQuantity === 0 ? 0 : nextQuantity}
          </span>
          <button
            type="button"
            aria-label="Aumentar quantidade"
            disabled={maxQuantity === 0 || nextQuantity >= maxQuantity}
            onClick={() => setQuantity(nextQuantity + 1)}
            className="flex size-11 items-center justify-center rounded-full border border-primary text-lg leading-none text-primary disabled:opacity-40 lg:size-8"
          >
            +
          </button>
          <span className="type-c-12 hidden text-[#c9a27a] lg:inline">
            {maxQuantity === 0
              ? 'Edição esgotada.'
              : `${edition?.remaining ?? 0} de ${edition?.supply ?? 0} disponíveis.`}
          </span>
          <span className="ml-auto text-sm font-bold text-primary lg:hidden">
            {formatEth(nft.priceEth)}
          </span>
        </div>
        <div className="flex w-full min-w-0 items-center gap-2 lg:contents">
          <Button
            type="button"
            className="h-11 min-h-11 flex-1 rounded-lg px-4 tracking-wide lg:flex-none lg:px-8"
            disabled={!edition || maxQuantity === 0 || add.isPending}
            onClick={() => add.mutate()}
          >
            {add.isPending ? (
              'Enviando…'
            ) : (
              <>
                <span className="lg:hidden">Comprar NFT</span>
                <span className="hidden lg:inline">COMPRAR</span>
              </>
            )}
          </Button>
          <Link
            to="/cart"
            aria-label="Abrir carrinho"
            className="flex size-11 items-center justify-center rounded-xl border border-[#6a4332] text-foreground lg:hidden"
          >
            <ShoppingCart className="size-5" />
          </Link>
          <Button
            type="button"
            variant="outline"
            className="hidden h-11 gap-2 rounded-lg border-primary/80 px-5 text-foreground lg:inline-flex"
            aria-pressed={saved}
            onClick={() => {
              if (!userId) {
                askSignIn()
                return
              }
              favorite.mutate()
            }}
          >
            <Heart className={saved ? 'size-4 fill-primary text-primary' : 'size-4 text-primary'} />
            {saved ? 'Favorito' : 'Favoritar'}
          </Button>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        className="h-11 gap-2 self-start rounded-lg border-primary/80 px-5 text-foreground lg:hidden"
        aria-pressed={saved}
        onClick={() => {
          if (!userId) {
            askSignIn()
            return
          }
          favorite.mutate()
        }}
      >
        <Heart className={saved ? 'size-4 fill-primary text-primary' : 'size-4 text-primary'} />
        {saved ? 'Favorito' : 'Favoritar'}
      </Button>
    </div>
  )
}
