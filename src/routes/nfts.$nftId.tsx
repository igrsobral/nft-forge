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
  head: ({ params }) => ({
    meta: [
      { title: `${params.nftId} · Atelier Market` },
      { name: 'description', content: 'Edition detail, stock, and live price.' },
    ],
  }),
  pendingComponent: DetailSkeleton,
  errorComponent: RouteError,
  notFoundComponent: NftMissing,
  component: NftDetailPage,
})
