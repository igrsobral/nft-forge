import type { ErrorComponentProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { ApiError } from '@/lib/api/errors'
import { Button } from '@/components/ui/button'

export function RouteError({ error, reset }: ErrorComponentProps) {
  const message =
    error instanceof ApiError ? error.message : 'Something went wrong loading this page.'
  return (
    <div role="alert" className="mx-auto flex max-w-lg flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">This page did not load</h1>
      <p className="text-muted-foreground">{message}</p>
      <div className="flex gap-2">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link to="/">Back to the catalog</Link>
        </Button>
      </div>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-start gap-4 px-4 py-16">
      <p className="text-sm tracking-wide text-primary uppercase">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">This page is not in the market</h1>
      <p className="text-muted-foreground">
        The address does not match a catalog route. Edition pages live under /nfts.
      </p>
      <Button asChild>
        <Link to="/">Browse editions</Link>
      </Button>
    </div>
  )
}
