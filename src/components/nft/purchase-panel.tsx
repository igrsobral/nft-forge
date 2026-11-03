import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import type { NftDetail } from '@/contracts/catalog'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api/errors'
import { addFavorite, addCartItem, removeFavorite } from '@/lib/api/commerce'
import { favoritesQuery } from '@/lib/queries'
import { queryKeys } from '@/lib/query-keys'
import { getStoredUserId } from '@/lib/storage'

export function PurchasePanel({ nft }: { nft: NftDetail }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userId = getStoredUserId()
  const favorites = useQuery({ ...favoritesQuery(userId), enabled: Boolean(userId) })
  const [editionId, setEditionId] = useState(nft.editions[0]?.id ?? '')
  const edition = nft.editions.find((item) => item.id === editionId) ?? nft.editions[0]
  const maxQuantity = Math.min(20, edition?.remaining ?? 0)
  const [quantity, setQuantity] = useState(1)
  const saved = favorites.data?.includes(nft.id) ?? false
  const nextQuantity = Math.min(Math.max(1, quantity), Math.max(1, maxQuantity))

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
      toast.error(error instanceof ApiError ? error.message : 'The favorite could not be saved.')
    },
    onSettled: async () => {
      if (userId) await queryClient.invalidateQueries({ queryKey: queryKeys.favorites(userId) })
    },
  })

  const add = useMutation({
    mutationFn: () => {
      if (!edition) throw new Error('Choose an edition')
      return addCartItem({ nftId: nft.id, editionId: edition.id, quantity: nextQuantity })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Added to cart')
      void navigate({ to: '/cart' })
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : 'Could not add this edition.')
    },
  })

  return (
    <div className="grid gap-3 rounded-[14px] border border-line bg-surface-card p-4">
      <label className="grid gap-1">
        <span className="type-b-14 text-text-secondary">Edition</span>
        <select
          className="type-b-14 h-11 rounded-[10px] border border-line bg-background px-3"
          value={edition?.id ?? ''}
          onChange={(event) => {
            setEditionId(event.target.value)
            setQuantity(1)
          }}
        >
          {nft.editions.map((item) => (
            <option key={item.id} value={item.id} disabled={item.remaining === 0}>
              {item.name}
              {item.remaining === 0 ? ' (sold out)' : ` (${item.remaining} left)`}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1">
        <span className="type-b-14 text-text-secondary">Quantity</span>
        <input
          type="number"
          min={1}
          max={Math.max(1, maxQuantity)}
          value={nextQuantity}
          disabled={maxQuantity === 0}
          aria-describedby="quantity-hint"
          onChange={(event) => setQuantity(Number(event.target.value))}
          className="type-b-14 h-11 rounded-[10px] border border-line bg-background px-3"
        />
        <span id="quantity-hint" className="type-c-12 text-text-secondary">
          {maxQuantity === 0 ? 'This edition is sold out.' : `Maximum ${maxQuantity}.`}
        </span>
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="w-full sm:w-auto"
          disabled={!edition || maxQuantity === 0 || add.isPending}
          onClick={() => add.mutate()}
        >
          {add.isPending ? 'Adding…' : 'Add to cart'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          aria-pressed={saved}
          onClick={() => {
            if (!userId) {
              askSignIn()
              return
            }
            favorite.mutate()
          }}
        >
          {saved ? 'Saved' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
