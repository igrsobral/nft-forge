import { useState } from 'react'
import type { NftListQuery, NftListResponse } from '@/contracts/catalog'
import type { CatalogNetwork, Category } from '@/contracts/common'
import { categories, catalogNetworks } from '@/contracts/common'
import { toEth } from '@/lib/money'
import { Button } from '@/components/ui/button'

type FilterPatch = Partial<NftListQuery>

function ethStep(value: string): number {
  return Math.round(Number(value) * 100)
}

function stepEth(step: number): string {
  return toEth((step / 100).toFixed(2))
}

function commaFixed(value: string): string {
  const [whole, fraction = ''] = toEth(value).split('.')
  return `${whole ?? '0'},${(fraction + '00').slice(0, 2)}`
}

export function CatalogFilters({
  search,
  facets,
  onChange,
}: {
  idPrefix?: string
  search: NftListQuery
  facets: NftListResponse['facets']
  onChange: (patch: FilterPatch) => void
}) {
  const boundMin = ethStep(facets.price.min)
  const boundMax = Math.max(boundMin + 1, ethStep(facets.price.max))
  const [minStep, setMinStep] = useState(search.minPrice ? ethStep(search.minPrice) : boundMin)
  const [maxStep, setMaxStep] = useState(search.maxPrice ? ethStep(search.maxPrice) : boundMax)
  const [seenBounds, setSeenBounds] = useState(`${boundMin}:${boundMax}`)
  const boundsKey = `${boundMin}:${boundMax}:${search.minPrice ?? ''}:${search.maxPrice ?? ''}`
  if (boundsKey !== seenBounds) {
    setSeenBounds(boundsKey)
    setMinStep(search.minPrice ? ethStep(search.minPrice) : boundMin)
    setMaxStep(search.maxPrice ? ethStep(search.maxPrice) : boundMax)
  }

  const low = Math.min(minStep, maxStep)
  const high = Math.max(minStep, maxStep)
  const span = Math.max(1, boundMax - boundMin)
  const start = ((low - boundMin) / span) * 100
  const end = ((high - boundMin) / span) * 100

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl bg-[#24140f] px-5 py-5">
        <h2 className="type-b-16-bold mb-4 text-foreground">Coleções</h2>
        <ul className="flex flex-col gap-2.5">
          {facets.categories.map((facet) => {
            const active = search.category === facet.value
            return (
              <li key={facet.value}>
                <button
                  type="button"
                  aria-pressed={active}
                  className="type-b-14 flex w-full items-baseline justify-between gap-3 text-left"
                  onClick={() =>
                    onChange({
                      category: active ? undefined : (facet.value as Category),
                    })
                  }
                >
                  <span className={active ? 'font-bold text-foreground' : 'text-primary'}>
                    {facet.label}
                  </span>
                  <span className="text-foreground/75">({facet.count})</span>
                </button>
              </li>
            )
          })}
        </ul>
        <div className="mt-8">
          <h3 className="type-b-16-bold mb-4 text-foreground">Faixa de preço</h3>
          <div className="relative mb-3 h-6">
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#5a3a28]" />
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary"
              style={{ left: `${start}%`, width: `${Math.max(0, end - start)}%` }}
            />
            <input
              aria-label="Preço mínimo"
              type="range"
              min={boundMin}
              max={boundMax}
              value={low}
              onChange={(event) => setMinStep(Math.min(Number(event.target.value), high))}
              className="price-range pointer-events-none absolute inset-x-0 top-1/2 z-20 h-4 w-full -translate-y-1/2 appearance-none bg-transparent"
            />
            <input
              aria-label="Preço máximo"
              type="range"
              min={boundMin}
              max={boundMax}
              value={high}
              onChange={(event) => setMaxStep(Math.max(Number(event.target.value), low))}
              className="price-range pointer-events-none absolute inset-x-0 top-1/2 z-20 h-4 w-full -translate-y-1/2 appearance-none bg-transparent"
            />
          </div>
          <p className="type-c-13 text-foreground">
            Preço: {commaFixed(stepEth(low))} - {commaFixed(stepEth(high))} ETH
          </p>
          <Button
            type="button"
            className="mt-3 h-8 rounded-md px-4"
            onClick={() => {
              const minPrice = stepEth(low)
              const maxPrice = stepEth(high)
              onChange({
                minPrice: minPrice === toEth(facets.price.min) ? undefined : minPrice,
                maxPrice: maxPrice === toEth(facets.price.max) ? undefined : maxPrice,
              })
            }}
          >
            Aplicar
          </Button>
        </div>
        <div className="mt-8">
          <h3 className="type-b-16-bold mb-4 text-foreground">Rede</h3>
          <ul className="flex flex-col gap-2.5">
            {facets.networks.map((facet) => {
              const active = search.network === facet.value
              return (
                <li key={facet.value}>
                  <button
                    type="button"
                    aria-pressed={active}
                    className="flex w-full items-baseline justify-between text-left text-foreground/90"
                    onClick={() =>
                      onChange({
                        network: active ? undefined : (facet.value as CatalogNetwork),
                      })
                    }
                  >
                    <span>{facet.label}</span>
                    <span>({facet.count})</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="sr-only">
            Redes do catálogo: {catalogNetworks.join(', ')}. Coleções: {categories.join(', ')}.
          </p>
        </div>
      </section>
    </div>
  )
}
