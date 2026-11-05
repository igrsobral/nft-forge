import { Skeleton } from '@/components/ui/skeleton'

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
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton layout, list is never reordered
            key={index}
            className="rounded-xl bg-[#24140f] p-3"
          >
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
