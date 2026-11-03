import type { NftListQuery, NftListResponse } from '@/contracts/catalog'
import { categories, sorts } from '@/contracts/common'
import { ethAmountSchema } from '@/contracts/common'

type FilterPatch = Partial<NftListQuery>

export function CatalogFilters({
  idPrefix,
  search,
  facets,
  onChange,
}: {
  idPrefix: string
  search: NftListQuery
  facets: NftListResponse['facets']
  onChange: (patch: FilterPatch) => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="grid gap-1 text-sm" htmlFor={`${idPrefix}-category`}>
        <span className="text-muted-foreground">Category</span>
        <select
          id={`${idPrefix}-category`}
          className="h-10 rounded-lg border border-input bg-background px-3"
          value={search.category ?? ''}
          onChange={(event) => {
            const value = event.target.value
            onChange({ category: categories.find((category) => category === value) })
          }}
        >
          <option value="">All categories</option>
          {facets.categories.map((facet) => (
            <option key={facet.value} value={facet.value}>
              {facet.label} ({facet.count})
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm" htmlFor={`${idPrefix}-collection`}>
        <span className="text-muted-foreground">Collection</span>
        <select
          id={`${idPrefix}-collection`}
          className="h-10 rounded-lg border border-input bg-background px-3"
          value={search.collection ?? ''}
          onChange={(event) => onChange({ collection: event.target.value || undefined })}
        >
          <option value="">All collections</option>
          {facets.collections.map((facet) => (
            <option key={facet.value} value={facet.value}>
              {facet.label} ({facet.count})
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm" htmlFor={`${idPrefix}-sort`}>
        <span className="text-muted-foreground">Sort</span>
        <select
          id={`${idPrefix}-sort`}
          className="h-10 rounded-lg border border-input bg-background px-3"
          value={search.sort}
          onChange={(event) => {
            const value = sorts.find((sort) => sort === event.target.value)
            if (value) onChange({ sort: value })
          }}
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price, low to high</option>
          <option value="price_desc">Price, high to low</option>
          <option value="name_asc">Name</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm" htmlFor={`${idPrefix}-min`}>
        <span className="text-muted-foreground">Min ETH</span>
        <input
          id={`${idPrefix}-min`}
          inputMode="decimal"
          defaultValue={search.minPrice ?? ''}
          key={`min-${search.minPrice ?? ''}`}
          className="h-10 rounded-lg border border-input bg-background px-3"
          onBlur={(event) => commitPrice(event.target.value, (minPrice) => onChange({ minPrice }))}
        />
      </label>
      <label className="grid gap-1 text-sm" htmlFor={`${idPrefix}-max`}>
        <span className="text-muted-foreground">Max ETH</span>
        <input
          id={`${idPrefix}-max`}
          inputMode="decimal"
          defaultValue={search.maxPrice ?? ''}
          key={`max-${search.maxPrice ?? ''}`}
          className="h-10 rounded-lg border border-input bg-background px-3"
          onBlur={(event) => commitPrice(event.target.value, (maxPrice) => onChange({ maxPrice }))}
        />
      </label>
      <label
        className="flex items-center gap-2 self-end pb-2 text-sm"
        htmlFor={`${idPrefix}-stock`}
      >
        <input
          id={`${idPrefix}-stock`}
          type="checkbox"
          className="size-4 accent-primary"
          checked={search.inStock === true}
          onChange={(event) => onChange({ inStock: event.target.checked ? true : undefined })}
        />
        In stock only
      </label>
    </div>
  )
}

function commitPrice(raw: string, apply: (value: string | undefined) => void) {
  const value = raw.trim()
  if (!value) {
    apply(undefined)
    return
  }
  if (ethAmountSchema.safeParse(value).success) apply(value)
}
