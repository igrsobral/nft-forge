import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { NftDetail } from '@/contracts/catalog'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api/errors'
import { addFavorite, addCartItem, removeFavorite } from '@/lib/api/commerce'
import { favoritesQuery } from '@/lib/queries'
import { queryKeys } from '@/lib/query-keys'
import { getStoredUserId } from '@/lib/storage'

const pillOrder = ['1/1', '1/10', '1/50', 'ABERTA']

export function PurchasePanel({ nft }: { nft: NftDetail }) {
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
  const maxQuantity = Math.min(20, edition?.remaining ?? 0)
  const [quantity, setQuantity] = useState(1)
  const saved = favorites.data?.includes(nft.id) ?? false
  const nextQuantity = Math.min(Math.max(1, quantity), Math.max(1, maxQuantity))
  const pills = [...nft.editions].sort(
    (left, right) => pillOrder.indexOf(left.label) - pillOrder.indexOf(right.label),
  )

  function askSignIn() {
    void navigate({
      to: '/login',
      search: { redirect: `${window.location.pathname}${window.location.search}` },
    })
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
                    ? 'type-c-13 rounded-md border border-primary px-2.5 py-1 font-bold text-primary'
                    : 'type-c-13 rounded-md px-2.5 py-1 text-primary/80 hover:text-primary disabled:opacity-40'
                }
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Diminuir quantidade"
          disabled={maxQuantity === 0 || nextQuantity <= 1}
          onClick={() => setQuantity(nextQuantity - 1)}
          className="flex size-8 items-center justify-center rounded-full border border-primary text-lg leading-none text-primary disabled:opacity-40"
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
          className="flex size-8 items-center justify-center rounded-full border border-primary text-lg leading-none text-primary disabled:opacity-40"
        >
          +
        </button>
        <span className="type-c-12 text-[#c9a27a]">
          {maxQuantity === 0
            ? 'Edição esgotada.'
            : `${edition?.remaining ?? 0} de ${edition?.supply ?? 0} disponíveis.`}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          className="h-11 rounded-lg px-8 tracking-wide"
          disabled={!edition || maxQuantity === 0 || add.isPending}
          onClick={() => add.mutate()}
        >
          {add.isPending ? 'Enviando…' : 'COMPRAR'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 gap-2 rounded-lg border-primary/80 px-5 text-foreground"
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
  )
}
