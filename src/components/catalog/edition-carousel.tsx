import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import type { NftSummary } from '@/contracts/catalog'
import { formatEth } from '@/lib/money'

const pageSize = 5

export function EditionCarousel({
  title,
  items,
  emptyLabel,
}: {
  title: string
  items: NftSummary[]
  emptyLabel?: string
}) {
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(page, pageCount - 1)
  const slice = items.slice(current * pageSize, current * pageSize + pageSize)

  return (
    <section className="mt-12" aria-label={title}>
      <div className="mb-5 flex items-center gap-4">
        <h2 className="type-b-16-bold shrink-0 text-primary">{title}</h2>
        <span aria-hidden className="h-px flex-1 bg-[#6a4332]" />
      </div>
      {slice.length === 0 ? (
        <p className="text-[#c9a27a]">{emptyLabel ?? 'Nenhuma edição para mostrar.'}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {slice.map((item) => (
            <li key={item.id} className="min-w-0">
              <article className="relative flex h-full flex-col rounded-xl bg-[#24140f] p-3">
                <img
                  src={item.imageUrl}
                  alt=""
                  className="aspect-square w-full min-w-0 rounded-xl object-cover"
                />
                <h3 className="type-c-13 mt-3 truncate text-foreground">
                  <Link
                    to="/nfts/$nftId"
                    params={{ nftId: item.id }}
                    className="after:absolute after:inset-0 after:content-[''] hover:text-primary"
                  >
                    {item.name}
                  </Link>
                </h3>
                <p className="type-b-14-bold mt-1 text-primary">{formatEth(item.priceEth)}</p>
              </article>
            </li>
          ))}
        </ul>
      )}
      {pageCount > 1 ? (
        <div
          className="mt-5 flex justify-center gap-2"
          role="tablist"
          aria-label={`Páginas de ${title}`}
        >
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed page-dot list, mirrors pageCount order and never shifts
              key={index}
              type="button"
              role="tab"
              aria-label={`Página ${index + 1} de ${title}`}
              aria-selected={index === current}
              onClick={() => setPage(index)}
              className={
                index === current
                  ? 'size-2.5 rounded-full bg-primary'
                  : 'size-2 rounded-full bg-[#6a4332]'
              }
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
