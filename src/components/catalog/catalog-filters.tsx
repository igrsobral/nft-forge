import { useState } from 'react'
import type { NftListQuery, NftListResponse } from '@/contracts/catalog'
import type { CatalogNetwork, Category } from '@/contracts/common'
import { catalogNetworks, categories } from '@/contracts/common'
import { toEth } from '@/lib/money'
import { stepByKey } from '@/lib/price-step'

type FilterPatch = Partial<NftListQuery>

function ethStep(value: string): number {
  return Math.round(Number(value) * 100)
}

function stepEth(step: number): string {
  return toEth((step / 100).toFixed(2))
}

function commaFixed(value: string): string {
  const [whole, fraction = ''] = toEth(value).split('.')
  return `${whole ?? '0'},${(`${fraction}00`).slice(0, 2)}`
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
  const priceLabel = `Preço: ${commaFixed(stepEth(low))} - ${commaFixed(stepEth(high))} ETH`

  return (
    <div className="flex flex-col gap-8" data-testid="catalog-filters">
      <section className="rounded-2xl bg-surface-panel px-5 py-6">
        <h2 className="mb-4 text-base font-bold text-foreground">Coleções</h2>
        <ul className="flex flex-col gap-1">
          {facets.categories.map((facet) => {
            const active = search.category === facet.value
            return (
              <li key={facet.value}>
                <button
                  type="button"
                  aria-pressed={active}
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-1 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={() =>
                    onChange({
                      category: active ? undefined : (facet.value as Category),
                    })
                  }
                >
                  <span className={active ? 'font-bold text-primary' : 'text-secondary-muted'}>
                    {facet.label}
                  </span>
                  <span
                    className={active ? 'font-bold text-primary' : 'font-bold text-secondary-muted'}
                  >
                    ({facet.count})
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <div className="mt-8">
          <h3 className="mb-4 text-base font-bold text-foreground">Faixa de preço</h3>
          <div className="relative mb-3 h-11">
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary" />
            <input
              aria-label="Preço mínimo"
              aria-valuetext={`${commaFixed(stepEth(low))} ETH`}
              type="range"
              min={boundMin}
              max={boundMax}
              step={1}
              value={low}
              onChange={(event) => setMinStep(Math.min(Number(event.target.value), high))}
              onKeyDown={(event) => {
                const next = stepByKey(low, event.key, boundMin, high)
                if (next === null) return
                event.preventDefault()
                setMinStep(next)
              }}
              className="price-range pointer-events-none absolute inset-x-0 top-1/2 z-20 h-11 w-full -translate-y-1/2 appearance-none bg-transparent"
            />
            <input
              aria-label="Preço máximo"
              aria-valuetext={`${commaFixed(stepEth(high))} ETH`}
              type="range"
              min={boundMin}
              max={boundMax}
              step={1}
              value={high}
              onChange={(event) => setMaxStep(Math.max(Number(event.target.value), low))}
              onKeyDown={(event) => {
                const next = stepByKey(high, event.key, low, boundMax)
                if (next === null) return
                event.preventDefault()
                setMaxStep(next)
              }}
              className="price-range pointer-events-none absolute inset-x-0 top-1/2 z-30 h-11 w-full -translate-y-1/2 appearance-none bg-transparent"
            />
          </div>
          <p className="text-sm text-foreground">{priceLabel}</p>
          <button
            type="button"
            className="mt-3 h-9 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
          </button>
        </div>
        <div className="mt-8">
          <h3 className="mb-4 text-base font-bold text-foreground">Rede</h3>
          <ul className="flex flex-col gap-1">
            {facets.networks.map((facet) => {
              const active = search.network === facet.value
              return (
                <li key={facet.value}>
                  <button
                    type="button"
                    aria-pressed={active}
                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-1 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    onClick={() =>
                      onChange({
                        network: active ? undefined : (facet.value as CatalogNetwork),
                      })
                    }
                  >
                    <span className={active ? 'font-bold text-primary' : 'text-secondary-muted'}>
                      {facet.label}
                    </span>
                    <span
                      className={
                        active ? 'font-bold text-primary' : 'font-bold text-secondary-muted'
                      }
                    >
                      ({facet.count})
                    </span>
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
