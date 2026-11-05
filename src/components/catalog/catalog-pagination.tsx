import { ChevronRight } from 'lucide-react'

export function CatalogPagination({
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
                : 'flex size-9 items-center justify-center rounded-md bg-surface-pagination text-sm text-foreground hover:bg-surface-hover'
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
        className="flex size-9 items-center justify-center rounded-md bg-surface-pagination text-foreground hover:bg-surface-hover disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}
