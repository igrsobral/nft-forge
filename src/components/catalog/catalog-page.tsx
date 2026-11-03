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

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm tracking-wide text-primary uppercase">Editions</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Discover editions</h1>
        <p className="max-w-2xl text-muted-foreground">
          Forty works across five categories. Search, filters, and sort stay in the address bar, and
          prices move when the market socket emits an update.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="grid gap-1 text-sm" htmlFor="catalog-search">
          <span className="text-muted-foreground">Search</span>
          <Input
            id="catalog-search"
            value={draft}
            placeholder="Name, creator, or collection"
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>
        <div className="hidden md:block">
          {query.data ? (
            <CatalogFilters
              idPrefix="desktop"
              search={search}
              facets={query.data.facets}
              onChange={updateFilters}
            />
          ) : null}
        </div>
        <div className="md:hidden">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="outline">
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-6">
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
                  <p className="text-sm text-muted-foreground">
                    Filters appear when the catalog loads.
                  </p>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

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
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {query.data.items.map((nft) => (
                <li key={nft.id}>
                  <Link
                    to="/nfts/$nftId"
                    params={{ nftId: nft.id }}
                    data-testid="nft-card"
                    data-category={nft.category}
                    className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card"
                  >
                    <img
                      src={nft.imageUrl}
                      alt={`${nft.name} by ${nft.creator}`}
                      width={800}
                      height={800}
                      className="aspect-square w-full object-cover"
                    />
                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <p className="text-xs tracking-wide text-muted-foreground uppercase">
                        {nft.collectionName}
                      </p>
                      <h2 data-testid="nft-name" className="text-base font-medium">
                        {nft.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">{nft.category}</p>
                      <p data-testid="nft-card-price" className="mt-auto pt-2 font-medium">
                        {formatEth(nft.priceEth)}
                      </p>
                    </div>
                  </Link>
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
    </main>
  )
}

export function CatalogSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
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
