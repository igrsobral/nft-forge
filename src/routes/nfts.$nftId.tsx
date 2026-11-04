import { createFileRoute, notFound } from '@tanstack/react-router'
import { DetailSkeleton, NftDetailPage, NftMissing } from '@/components/nft/detail-page'
import { RouteError } from '@/components/route-error'
import { ApiError } from '@/lib/api/errors'
import { getNft } from '@/lib/api/catalog'
import { queryKeys } from '@/lib/query-keys'
import { getStoredUserId } from '@/lib/storage'

export const Route = createFileRoute('/nfts/$nftId')({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData({
        queryKey: queryKeys.nft(getStoredUserId(), params.nftId),
        queryFn: ({ signal }) => getNft(params.nftId, signal),
      })
    } catch (error) {
      if (error instanceof ApiError && error.code === 'not_found') throw notFound()
      throw error
    }
  },
  head: () => ({
    meta: [
      { title: 'Edição · Kurio' },
      { name: 'description', content: 'Ficha da edição, tiragem, avaliações e preço ao vivo.' },
    ],
  }),
  pendingComponent: DetailSkeleton,
  errorComponent: RouteError,
  notFoundComponent: NftMissing,
  component: NftDetailPage,
})
