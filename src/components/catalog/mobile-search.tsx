import { useNavigate } from '@tanstack/react-router'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CatalogFilters } from '@/components/catalog/catalog-filters'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { NftListQuery, NftListResponse } from '@/contracts/catalog'
import { toListQuery, toRouteSearch } from '@/lib/catalog-search'

const SEARCH_DEBOUNCE_MS = 300

export function MobileSearchBar({
  search,
  facets,
  onChange,
}: {
  search: NftListQuery
  facets: NftListResponse['facets'] | null
  onChange: (patch: Partial<NftListQuery>) => void
}) {
  const [draft, setDraft] = useState(search.q ?? '')
  const navigate = useNavigate()

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = draft.trim()
      if ((search.q ?? '') === next) return
      void navigate({
        to: '/',
        search: (previous) =>
          toRouteSearch(toListQuery({ ...toListQuery(previous), q: next || undefined, page: 1 })),
      })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [draft, navigate, search.q])

  return (
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
      <MobileFiltersButton search={search} facets={facets} onChange={onChange} />
    </div>
  )
}

function MobileFiltersButton({
  search,
  facets,
  onChange,
}: {
  search: NftListQuery
  facets: NftListResponse['facets'] | null
  onChange: (patch: Partial<NftListQuery>) => void
}) {
  const [open, setOpen] = useState(false)
  const applyAndClose = (patch: Partial<NftListQuery>) => {
    onChange(patch)
    setOpen(false)
  }
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          aria-label="Filtros"
          variant="outline"
          className="size-11 shrink-0 rounded-xl border-[#3f2319] bg-[#24140f] p-0 text-primary hover:bg-[#2f1d15]"
        >
          <SlidersHorizontal className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(100%,340px)] overflow-y-auto bg-background">
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-8">
          {facets ? (
            <CatalogFilters search={search} facets={facets} onChange={applyAndClose} />
          ) : (
            <p className="type-b-14 text-text-secondary">
              Os filtros aparecem quando o catálogo carrega.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
