import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ChevronRight, Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { NftListQuery, NftSummary } from '@/contracts/catalog'
import type { CatalogTab, Sort } from '@/contracts/common'
import { CatalogFilters } from '@/components/catalog/catalog-filters'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api/errors'
import { toListQuery, toRouteSearch } from '@/lib/catalog-search'
import { formatEth } from '@/lib/money'
import { nftListQuery } from '@/lib/queries'
import { getStoredUserId } from '@/lib/storage'
import { Route } from '@/routes/index'

const heroQuery = toListQuery({ sort: 'newest', page: 1, pageSize: 3 })

const tabs: { id: CatalogTab; label: string }[] = [
  { id: 'all', label: 'Todos os NFTs' },
  { id: 'new', label: 'Novos lançamentos' },
  { id: 'trending', label: 'Em alta' },
]

const sorts: { id: Sort; label: string }[] = [
  { id: 'newest', label: 'Listados recentemente' },
  { id: 'price_asc', label: 'Menor preço' },
  { id: 'price_desc', label: 'Maior preço' },
  { id: 'name_asc', label: 'Nome' },
]

export function CatalogPage() {
  const routeSearch = Route.useSearch()
  const search = toListQuery(routeSearch)
  const navigate = Route.useNavigate()
  const query = useQuery(nftListQuery(getStoredUserId(), search))
  const hero = useQuery(nftListQuery(getStoredUserId(), heroQuery))
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [draft, setDraft] = useState(search.q ?? '')
  const [slide, setSlide] = useState(0)
  const slides = hero.data?.items ?? []
  const slideIndex = slides.length === 0 ? 0 : Math.min(slide, slides.length - 1)
  const activeSlide = slides[slideIndex]

  function updateFilters(patch: Partial<NftListQuery>) {
    void navigate({
      to: '/',
      search: (previous) =>
        toRouteSearch(toListQuery({ ...toListQuery(previous), ...patch, page: 1 })),
    })
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = draft.trim()
      if ((search.q ?? '') === next) return
      void navigate({
        to: '/',
        search: (previous) =>
          toRouteSearch(toListQuery({ ...toListQuery(previous), q: next || undefined, page: 1 })),
      })
    }, 300)
    return () => window.clearTimeout(handle)
  }, [draft, navigate, search.q])

  function goToPage(page: number) {
    void navigate({
      to: '/',
      search: (previous) => toRouteSearch(toListQuery({ ...toListQuery(previous), page })),
    })
  }

  const featured = query.data?.featured ?? null

  return (
    <main className="overflow-x-clip">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-2 px-4 pt-4 lg:hidden">
        <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-[#6a4332] bg-[#24140f] px-3">
          <Search className="size-4 shrink-0 text-[#c9a27a]" />
          <span className="sr-only">Explorar coleções</span>
          <input
            value={draft}
            placeholder="Explorar coleções"
            onChange={(event) => setDraft(event.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#c9a27a]"
          />
        </label>
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button type="button" aria-label="Filtros" className="size-11 shrink-0 rounded-xl p-0">
              <SlidersHorizontal className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(100%,340px)] overflow-y-auto bg-background">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-8">
              {query.data ? (
                <CatalogFilters
                  search={search}
                  facets={query.data.facets}
                  onChange={(patch) => {
                    updateFilters(patch)
                    setFiltersOpen(false)
                  }}
                />
              ) : (
                <p className="type-b-14 text-text-secondary">
                  Os filtros aparecem quando o catálogo carrega.
                </p>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <section className="mx-auto hidden w-full max-w-[1440px] min-w-0 items-center gap-8 px-4 py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-12 lg:px-10 lg:py-14">
        <div className="flex max-w-[620px] flex-col items-start">
          <p className="type-b-14 text-foreground">Bem-vindo à Kurio</p>
          <h1 className="mt-5 text-[28px] leading-[1.15] font-bold tracking-tight text-foreground uppercase min-[420px]:text-[32px] lg:text-[clamp(32px,3.15vw,46px)] lg:leading-[1.12]">
            <span className="block lg:whitespace-nowrap">Seja dono do futuro</span>
            <span className="block lg:whitespace-nowrap">da arte digital</span>
          </h1>
          <p className="type-b-14 mt-5 max-w-[540px] text-[#c9a27a] lg:text-[15px] lg:leading-6">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
            rara, apoie artistas e tenha uma parte da cultura da internet.
          </p>
          <a
            href="#catalogo"
            className="type-b-14-bold mt-8 inline-flex h-11 items-center rounded-lg bg-primary px-8 text-primary-foreground uppercase tracking-[0.08em]"
          >
            Explorar
          </a>
          <div
            className="mt-12 flex w-full items-center justify-center gap-2 lg:mt-16"
            role="tablist"
            aria-label="Destaques"
          >
            {(slides.length > 0 ? slides : [0, 1, 2]).map((item, index) => {
              const selected = index === slideIndex
              return (
                <button
                  key={typeof item === 'number' ? index : item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-label={`Destaque ${index + 1}`}
                  disabled={slides.length === 0}
                  onClick={() => setSlide(index)}
                  className={
                    selected
                      ? 'size-2.5 rounded-full bg-primary'
                      : 'size-2 rounded-full bg-[#6a4332]'
                  }
                />
              )
            })}
          </div>
        </div>
        {activeSlide ? (
          <Link
            to="/nfts/$nftId"
            params={{ nftId: activeSlide.id }}
            className="block min-w-0 overflow-hidden rounded-[28px] bg-[#24140f]"
          >
            <img
              src={activeSlide.imageUrl}
              alt={`${activeSlide.name} por ${activeSlide.creator}`}
              width={460}
              height={460}
              className="aspect-square w-full min-w-0 object-cover"
            />
          </Link>
        ) : (
          <Skeleton className="aspect-square w-full rounded-[28px]" />
        )}
      </section>
      <section className="mx-auto w-full max-w-[1440px] px-4 pt-4 lg:hidden">
        <div className="flex items-center gap-3 rounded-[24px] bg-[#24140f] p-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-[26px] leading-[1.1] font-bold tracking-tight text-foreground uppercase">
              Seja dono da cultura digital
            </h1>
            <div className="mt-4 flex items-center gap-2" role="tablist" aria-label="Destaques">
              {(slides.length > 0 ? slides : [0, 1, 2]).map((item, index) => {
                const selected = index === slideIndex
                return (
                  <button
                    key={typeof item === 'number' ? `m-${index}` : `m-${item.id}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-label={`Destaque ${index + 1}`}
                    disabled={slides.length === 0}
                    onClick={() => setSlide(index)}
                    className={
                      selected
                        ? 'size-2.5 rounded-full bg-primary'
                        : 'size-2 rounded-full bg-[#6a4332]'
                    }
                  />
                )
              })}
            </div>
          </div>
          {activeSlide ? (
            <img
              src={activeSlide.imageUrl}
              alt=""
              className="size-28 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <Skeleton className="size-28 shrink-0 rounded-2xl" />
          )}
        </div>
      </section>

      <section
        id="catalogo"
        className="mx-auto w-full max-w-[1440px] min-w-0 scroll-mt-24 overflow-x-clip px-4 pb-8 lg:px-10 lg:pb-16"
      >
        <div className="grid min-w-0 items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-x-6">
          <div className="hidden flex-col gap-8 lg:flex">
            {query.data ? (
              <CatalogFilters search={search} facets={query.data.facets} onChange={updateFilters} />
            ) : (
              <Skeleton className="h-[520px] rounded-xl" />
            )}
            <FeaturedCard nft={featured} />
          </div>

          <div className="min-w-0">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div
                role="tablist"
                aria-label="Recorte do catálogo"
                className="flex gap-6 overflow-x-auto"
              >
                {tabs.map((tab) => {
                  const selected = search.tab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      className={
                        selected
                          ? 'type-b-14-bold shrink-0 border-b-2 border-primary pb-2 text-primary'
                          : 'type-b-14 shrink-0 border-b-2 border-transparent pb-2 text-foreground hover:text-primary'
                      }
                      onClick={() => updateFilters({ tab: tab.id })}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>
              <label className="type-c-13 flex shrink-0 items-center gap-2 text-foreground/90 max-lg:sr-only">
                <span>Ordenar por:</span>
                <select
                  aria-label="Ordenar por"
                  value={search.sort}
                  onChange={(event) => updateFilters({ sort: event.target.value as Sort })}
                  className="bg-transparent font-medium text-foreground outline-none"
                >
                  {sorts.map((option) => (
                    <option key={option.id} value={option.id} className="bg-background">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

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
                {query.data.items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center">
                    <h2 className="text-lg font-medium">Nenhuma edição encontrada</h2>
                    <p className="mt-2 text-muted-foreground">
                      Limpe um filtro ou tente outro nome.
                    </p>
                  </div>
                ) : (
                  <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5">
                    {query.data.items.map((nft) => (
                      <li key={nft.id} className="min-w-0">
                        <article
                          data-testid="nft-card"
                          data-category={nft.category}
                          className="group relative flex h-full min-w-0 flex-col rounded-xl bg-[#24140f] p-3"
                        >
                          <img
                            src={nft.imageUrl}
                            alt={`${nft.name} por ${nft.creator}`}
                            width={250}
                            height={250}
                            className="aspect-square w-full min-w-0 rounded-xl object-cover"
                          />
                          <h2 className="type-b-14 mt-3 truncate text-foreground">
                            <Link
                              to="/nfts/$nftId"
                              params={{ nftId: nft.id }}
                              data-testid="nft-name"
                              className="after:absolute after:inset-0 after:content-[''] hover:text-primary"
                            >
                              {nft.name}
                            </Link>
                          </h2>
                          <p className="mt-1.5 flex items-baseline gap-2">
                            <span
                              data-testid="nft-card-price"
                              className="type-b-16-bold text-primary"
                            >
                              {formatEth(nft.priceEth)}
                            </span>
                            {nft.previousPriceEth ? (
                              <span className="type-c-13 text-[#8d847c] line-through">
                                {formatEth(nft.previousPriceEth)}
                              </span>
                            ) : null}
                          </p>
                        </article>
                      </li>
                    ))}
                  </ul>
                )}
                <Pagination
                  page={search.page}
                  totalPages={query.data.totalPages}
                  onPage={goToPage}
                />
              </>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}

function FeaturedCard({ nft }: { nft: NftSummary | null }) {
  if (!nft) return null
  return (
    <section aria-label="NFT em destaque">
      <p className="type-c-13 font-bold tracking-[0.16em] text-primary uppercase">
        NFT em destaque
      </p>
      <p className="type-c-13 mt-1 font-bold tracking-[0.14em] text-foreground uppercase">
        Oferta limitada
      </p>
      <Link
        to="/nfts/$nftId"
        params={{ nftId: nft.id }}
        className="mt-4 block overflow-hidden rounded-[24px] bg-[#24140f]"
      >
        <img
          src={nft.imageUrl}
          alt={`${nft.name}, oferta limitada`}
          width={260}
          height={320}
          className="aspect-[4/5] w-full object-cover"
        />
      </Link>
    </section>
  )
}

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number
  totalPages: number
  onPage: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Paginação" className="mt-8 flex items-center justify-end gap-2">
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => {
        const current = number === page
        return (
          <button
            key={number}
            type="button"
            aria-current={current ? 'page' : undefined}
            onClick={() => onPage(number)}
            className={
              current
                ? 'flex size-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground'
                : 'flex size-9 items-center justify-center rounded-md bg-[#2a1c16] text-sm text-foreground hover:bg-[#3a2820]'
            }
          >
            {number}
          </button>
        )
      })}
      <button
        type="button"
        aria-label="Próxima página"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        className="flex size-9 items-center justify-center rounded-md bg-[#2a1c16] text-foreground hover:bg-[#3a2820] disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}

export function CatalogSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={compact ? '' : 'mx-auto w-full max-w-[1440px] px-4 py-8 lg:px-10'}
    >
      <span className="sr-only">Carregando edições</span>
      {compact ? null : (
        <div className="mb-12 grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-14 w-full max-w-xl" />
            <Skeleton className="h-14 w-4/5" />
            <Skeleton className="h-11 w-36" />
          </div>
          <Skeleton className="aspect-square w-full rounded-[28px]" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5">
        {Array.from({ length: 9 }, (_, index) => (
          <div key={index} className="rounded-xl bg-[#24140f] p-3">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  )
}

function CatalogError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const message = error instanceof ApiError ? error.message : 'O catálogo não pôde ser carregado.'
  return (
    <div role="alert" className="rounded-xl border border-border px-4 py-8">
      <h2 className="text-lg font-medium">Catálogo indisponível</h2>
      <p className="mt-2 text-muted-foreground">{message}</p>
      <Button type="button" className="mt-4" onClick={onRetry}>
        Tentar de novo
      </Button>
    </div>
  )
}
