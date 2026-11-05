import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api/errors'

export function CatalogError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
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
