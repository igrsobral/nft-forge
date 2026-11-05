import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { rememberFavorite, useOpenAuth } from '@/components/auth/auth-modal'
import type { NftSummary } from '@/contracts/catalog'
import { addFavorite, removeFavorite } from '@/lib/api/commerce'
import { ApiError } from '@/lib/api/errors'
import { favoritesQuery } from '@/lib/queries'
import { queryKeys } from '@/lib/query-keys'
import { getSessionEpoch, getStoredUserId, subscribeSession } from '@/lib/storage'

export function FavoriteToggle({ nft }: { nft: NftSummary }) {
  useSyncExternalStore(subscribeSession, getSessionEpoch, () => 0)
  const openAuth = useOpenAuth()
  const queryClient = useQueryClient()
  const userId = getStoredUserId()
  const favorites = useQuery({ ...favoritesQuery(userId), enabled: Boolean(userId) })
  const saved = favorites.data?.includes(nft.id) ?? false

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

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? 'Remover da lista de interesse' : 'Salvar na lista de interesse'}
      className="absolute top-2.5 right-2.5 z-10 grid size-9 place-items-center rounded-full border border-foreground/25 bg-background/85 backdrop-blur-sm transition-colors hover:border-foreground/40"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (!userId) {
          rememberFavorite(nft.id)
          openAuth('login')
          return
        }
        favorite.mutate()
      }}
    >
      <Heart
        aria-hidden
        className={saved ? 'size-4 fill-primary text-primary' : 'size-4 text-foreground'}
      />
    </button>
  )
}
