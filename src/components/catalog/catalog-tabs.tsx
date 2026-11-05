import type { CatalogTab, Sort } from '@/contracts/common'

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

export function CatalogTabs({
  tab,
  sort,
  onChange,
}: {
  tab: CatalogTab
  sort: Sort
  onChange: (patch: { tab?: CatalogTab; sort?: Sort }) => void
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div role="tablist" aria-label="Recorte do catálogo" className="flex gap-6 overflow-x-auto">
        {tabs.map((item) => {
          const selected = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={
                selected
                  ? 'type-b-14-bold shrink-0 border-b-2 border-primary pb-2 text-primary'
                  : 'type-b-14 shrink-0 border-b-2 border-transparent pb-2 text-foreground hover:text-primary'
              }
              onClick={() => onChange({ tab: item.id })}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      <label className="type-c-13 flex shrink-0 items-center gap-2 text-foreground/90 max-lg:sr-only">
        <span>Ordenar por:</span>
        <select
          aria-label="Ordenar por"
          value={sort}
          onChange={(event) => onChange({ sort: event.target.value as Sort })}
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
  )
}
