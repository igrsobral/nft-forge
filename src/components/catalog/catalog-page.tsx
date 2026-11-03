import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { NftListQuery } from '@/contracts/catalog'
import { CatalogFilters } from '@/components/catalog/catalog-filters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api/errors'
import { formatEth } from '@/lib/money'
import { toListQuery, toRouteSearch } from '@/lib/catalog-search'
import { nftListQuery } from '@/lib/queries'
import { getStoredUserId } from '@/lib/storage'
import { Route } from '@/routes/index'

export function CatalogPage() {
  const routeSearch = Route.useSearch()
  const search = toListQuery(routeSearch)
  const navigate = Route.useNavigate()
  const query = useQuery(nftListQuery(getStoredUserId(), search))
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draft, setDraft] = useState(search.q ?? '')
  const [previousQuery, setPreviousQuery] = useState(search.q)
  if (search.q !== previousQuery) {
    setPreviousQuery(search.q)
    setDraft(search.q ?? '')
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = draft.trim()
      if ((search.q ?? '') === next) return
      void navigate({
        to: '/',
        search: (previous) =>
          toRouteSearch(toListQuery({ ...toListQuery(previous), q: next || undefined, page: 1 })),
        replace: true,
      })
    }, 300)
    return () => window.clearTimeout(handle)
  }, [draft, navigate, search.q])

  function updateFilters(patch: Partial<NftListQuery>) {
    void navigate({
      to: '/',
      search: (previous) =>
        toRouteSearch(toListQuery({ ...toListQuery(previous), ...patch, page: 1 })),
    })
  }

  const featured = query.data?.items[0]

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-4 lg:gap-16 lg:px-10 lg:py-8">
      <div className="flex gap-2 lg:hidden">
        <div
          role="search"
          className="flex h-[45px] min-w-0 flex-1 items-center rounded-[10px] bg-surface-card px-3 focus-within:ring-2 focus-within:ring-accent"
        >
          <label htmlFor="catalog-search" className="sr-only">
            Search
          </label>
          <input
            id="catalog-search"
            type="search"
            value={draft}
            placeholder="Explorar coleções"
            autoComplete="off"
            onChange={(event) => setDraft(event.target.value)}
            className="type-b-14-bold h-full min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-secondary"
          />
        </div>
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger
            aria-label="Filters"
            className="flex size-[45px] shrink-0 items-center justify-center rounded-[14px] bg-gradient-filter-btn text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-5 fill-none stroke-current stroke-2"
            >
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(100%,320px)] overflow-y-auto bg-background">
            <SheetHeader>
              <SheetTitle className="type-b-16-bold">Filters</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-8">
              {query.data ? (
                <CatalogFilters
                  idPrefix="mobile"
                  search={search}
                  facets={query.data.facets}
                  onChange={(patch) => {
                    updateFilters(patch)
                    setFiltersOpen(false)
                  }}
                />
              ) : (
                <p className="type-b-14 text-text-secondary">
                  Filters appear when the catalog loads.
                </p>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <section className="flex items-center gap-3 overflow-hidden rounded-[30px] bg-gradient-tile p-4 lg:h-[450px] lg:justify-between lg:gap-10 lg:rounded-[24px] lg:bg-surface-card lg:bg-none lg:p-0 lg:pl-10">
        <div className="flex min-w-0 flex-1 flex-col gap-3 lg:max-w-[600px] lg:gap-8">
          <p className="type-c-12 tracking-[1.4px] text-foreground uppercase lg:type-b-14">
            Editions
          </p>
          <h1 className="type-t-18-bold text-foreground lg:type-display-43">Discover editions</h1>
          <p className="type-c-12 max-w-[557px] text-text-secondary lg:type-b-14 lg:leading-6">
            Search, filters, and sort stay in the address bar. Prices move when the market socket
            emits an update.
          </p>
        </div>
        {featured ? (
          <img
            src={featured.imageUrl}
            alt=""
            width={450}
            height={450}
            className="aspect-square w-full max-w-[180px] self-end rounded-[16px] object-cover lg:max-w-none lg:w-[min(450px,40%)] lg:shrink-0 lg:rounded-[24px]"
          />
        ) : (
          <Skeleton className="aspect-square w-full max-w-[180px] self-end rounded-[16px] lg:h-[450px] lg:max-w-none lg:w-[min(450px,40%)] lg:rounded-[24px]" />
        )}
      </section>

      <div className="flex items-start gap-12">
        <aside aria-label="Filters" className="hidden w-[310px] shrink-0 flex-col gap-6 lg:flex">
          <label className="grid gap-2" htmlFor="catalog-search-desktop">
            <span className="type-b-14 text-text-secondary">Search</span>
            <Input
              id="catalog-search-desktop"
              value={draft}
              placeholder="Name, creator, or collection"
              onChange={(event) => setDraft(event.target.value)}
              className="h-11 rounded-[10px] border-line bg-surface-card"
            />
          </label>
          {query.data ? (
            <CatalogFilters
              idPrefix="desktop"
              search={search}
              facets={query.data.facets}
              onChange={updateFilters}
            />
          ) : null}
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          {query.isPending ? <CatalogSkeleton /> : null}
          {query.isError ? (
            <CatalogError error={query.error} onRetry={() => void query.refetch()} />
          ) : null}
          {query.data ? (
            <>
              <p
                data-testid="result-count"
                aria-live="polite"
                className="text-sm text-muted-foreground"
              >
                {query.data.total} editions
                {query.isFetching ? ' · updating' : ''}
              </p>
              {query.data.items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center">
                  <h2 className="text-lg font-medium">No editions match</h2>
                  <p className="mt-2 text-muted-foreground">Clear a filter or try another name.</p>
                </div>
              ) : (
                <ul className="grid grid-cols-2 gap-x-4 gap-y-6 pb-10 max-md:[&>li:nth-child(even)]:translate-y-8 md:grid-cols-3 md:gap-6 md:pb-0 lg:gap-x-[34px] lg:gap-y-16">
                  {query.data.items.map((nft) => (
                    <li key={nft.id}>
                      <article
                        data-testid="nft-card"
                        data-category={nft.category}
                        className="group relative flex min-w-0 flex-col gap-2 lg:gap-3"
                      >
                        <div className="relative rounded-[20px] bg-gradient-tile px-1 pt-3 pb-5 lg:rounded-none lg:bg-card lg:bg-none lg:pt-6 lg:pb-[26px]">
                          <img
                            src={nft.imageUrl}
                            alt={`${nft.name} by ${nft.creator}`}
                            width={250}
                            height={250}
                            className="aspect-square w-full rounded-[16px] object-cover lg:rounded-[15px]"
                          />
                        </div>
                        <div className="flex flex-col gap-1 pl-2 lg:pl-0">
                          <h2 className="type-b-15 truncate text-foreground lg:type-b-16">
                            <Link
                              to="/nfts/$nftId"
                              params={{ nftId: nft.id }}
                              data-testid="nft-name"
                              className="after:absolute after:inset-0 after:content-[''] hover:text-accent"
                            >
                              {nft.name}
                            </Link>
                          </h2>
                          <p className="type-c-13 truncate text-text-secondary lg:hidden">
                            {nft.collectionName}
                          </p>
                          <p data-testid="nft-card-price" className="type-b-16-bold text-accent">
                            {formatEth(nft.priceEth)}
                          </p>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={search.page <= 1}
                  onClick={() =>
                    void navigate({
                      to: '/',
                      search: (previous) =>
                        toRouteSearch(
                          toListQuery({
                            ...toListQuery(previous),
                            page: Math.max(1, toListQuery(previous).page - 1),
                          }),
                        ),
                    })
                  }
                >
                  Previous
                </Button>
                <p className="text-sm text-muted-foreground">
                  Page {search.page}
                  {query.data.totalPages > 0 ? ` of ${query.data.totalPages}` : ''}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={query.data.totalPages === 0 || search.page >= query.data.totalPages}
                  onClick={() =>
                    void navigate({
                      to: '/',
                      search: (previous) =>
                        toRouteSearch(
                          toListQuery({
                            ...toListQuery(previous),
                            page: toListQuery(previous).page + 1,
                          }),
                        ),
                    })
                  }
                >
                  Next
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </main>
  )
}

export function CatalogSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-8"
    >
      <span className="sr-only">Loading editions</span>
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-border">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="flex flex-col gap-2 p-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function CatalogError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const message = error instanceof ApiError ? error.message : 'The catalog could not be loaded.'
  return (
    <div role="alert" className="rounded-xl border border-border px-4 py-8">
      <h2 className="text-lg font-medium">Catalog unavailable</h2>
      <p className="mt-2 text-muted-foreground">{message}</p>
      <Button type="button" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
