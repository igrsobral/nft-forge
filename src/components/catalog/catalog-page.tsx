import type { UseQueryResult } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { CatalogError } from '@/components/catalog/catalog-error'
import { CatalogFilters } from '@/components/catalog/catalog-filters'
import { NftGrid } from '@/components/catalog/catalog-grid'
import { CatalogPagination } from '@/components/catalog/catalog-pagination'
import { CatalogSkeleton } from '@/components/catalog/catalog-skeleton'
import { CatalogTabs } from '@/components/catalog/catalog-tabs'
import { FeaturedCard } from '@/components/catalog/featured-card'
import { HomeHeroDesktop, HomeHeroMobile } from '@/components/catalog/hero-carousel'
import { HomeEditorial } from '@/components/catalog/home-editorial'
import { MobileSearchBar } from '@/components/catalog/mobile-search'
import { Skeleton } from '@/components/ui/skeleton'
import type { NftListQuery, NftListResponse } from '@/contracts/catalog'
import { toListQuery, toRouteSearch } from '@/lib/catalog-search'
import { nftListQuery } from '@/lib/queries'
import { getStoredUserId } from '@/lib/storage'
import { Route } from '@/routes/index'

export function CatalogPage() {
  const search = toListQuery(Route.useSearch())
  const navigate = Route.useNavigate()
  const query = useQuery(nftListQuery(getStoredUserId(), search))

  function updateFilters(patch: Partial<NftListQuery>) {
    void navigate({
      to: '/',
      search: (previous) =>
        toRouteSearch(toListQuery({ ...toListQuery(previous), ...patch, page: 1 })),
    })
  }

  function goToPage(page: number) {
    void navigate({
      to: '/',
      search: (previous) => toRouteSearch(toListQuery({ ...toListQuery(previous), page })),
    })
  }

  return (
    <main className="overflow-x-clip">
      <MobileSearchBar
        search={search}
        facets={query.data?.facets ?? null}
        onChange={updateFilters}
      />
      <HomeHeroDesktop />
      <HomeHeroMobile />
      <CatalogSelection search={search} query={query} update={updateFilters} goToPage={goToPage} />
      <HomeEditorial />
    </main>
  )
}

function CatalogSelection({
  search,
  query,
  update,
  goToPage,
}: {
  search: NftListQuery
  query: UseQueryResult<NftListResponse, Error>
  update: (patch: Partial<NftListQuery>) => void
  goToPage: (page: number) => void
}) {
  return (
    <section
      id="catalogo"
      className="mx-auto w-full max-w-[1440px] min-w-0 scroll-mt-24 overflow-x-clip px-4 max-lg:pt-3 pb-8 lg:px-10 lg:pb-16"
    >
      <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-x-6">
        <CatalogSidebar search={search} query={query} update={update} />
        <div className="min-w-0">
          <CatalogTabs tab={search.tab} sort={search.sort} onChange={update} />
          {query.isPending ? <CatalogSkeleton compact /> : null}
          {query.isError ? (
            <CatalogError error={query.error} onRetry={() => void query.refetch()} />
          ) : null}
          {query.data ? (
            <>
              <p data-testid="result-count" aria-live="polite" className="sr-only">
                {query.data.total} edições
                {query.isFetching ? ' · atualizando' : ''}
              </p>
              <NftGrid items={query.data.items} />
              <CatalogPagination
                page={search.page}
                totalPages={query.data.totalPages}
                onPage={goToPage}
              />
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function CatalogSidebar({
  search,
  query,
  update,
}: {
  search: NftListQuery
  query: UseQueryResult<NftListResponse, Error>
  update: (patch: Partial<NftListQuery>) => void
}) {
  return (
    <div className="hidden flex-col gap-8 lg:flex">
      {query.data ? (
        <CatalogFilters search={search} facets={query.data.facets} onChange={update} />
      ) : (
        <Skeleton className="h-[520px] rounded-xl" />
      )}
      <FeaturedCard nft={query.data ? query.data.featured : null} />
    </div>
  )
}
