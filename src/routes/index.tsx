import { createFileRoute } from '@tanstack/react-router'
import { CatalogPage, CatalogSkeleton } from '@/components/catalog/catalog-page'
import { RouteError } from '@/components/route-error'
import { listNfts } from '@/lib/api/catalog'
import { toListQuery, toRouteSearch } from '@/lib/catalog-search'
import { queryKeys } from '@/lib/query-keys'
import { getStoredUserId } from '@/lib/storage'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>) => toRouteSearch(toListQuery(search), search),
  loaderDeps: ({ search }) => toListQuery(search),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData({
      queryKey: queryKeys.nfts(getStoredUserId(), deps),
      queryFn: ({ signal }) => listNfts(deps, signal),
    }),
  head: () => ({
    meta: [
      { title: 'Kurio · Seja dono do futuro da arte digital' },
      {
        name: 'description',
        content:
          'Descubra NFTs selecionados, filtre por coleção, rede e preço, e acompanhe o mercado ao vivo.',
      },
    ],
  }),
  pendingComponent: CatalogSkeleton,
  errorComponent: RouteError,
  component: CatalogPage,
})
