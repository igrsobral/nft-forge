import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { tickNftPrice } from '@/lib/api/catalog'
import { ApiError } from '@/lib/api/errors'
import { formatEth } from '@/lib/money'
import { nftDetailQuery } from '@/lib/queries'
import { getStoredUserId } from '@/lib/storage'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Route } from '@/routes/nfts.$nftId'

export function NftDetailPage() {
  const { nftId } = Route.useParams()
  const query = useQuery(nftDetailQuery(getStoredUserId(), nftId))
  const tick = useMutation({
    mutationFn: () => tickNftPrice(nftId),
  })

  if (query.isPending) return <DetailSkeleton />
  if (query.isError) {
    const message =
      query.error instanceof ApiError ? query.error.message : 'This edition could not be loaded.'
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div role="alert" className="flex flex-col items-start gap-4">
          <h1 className="text-2xl font-semibold">Edition unavailable</h1>
          <p className="text-muted-foreground">{message}</p>
          <Button type="button" onClick={() => void query.refetch()}>
            Try again
          </Button>
        </div>
      </main>
    )
  }

  const nft = query.data
  return (
    <main className="mx-auto grid w-full max-w-[1440px] gap-6 px-4 py-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12 lg:px-10 lg:py-8">
      <img
        src={nft.imageUrl}
        alt={`${nft.name} by ${nft.creator}`}
        width={800}
        height={800}
        className="aspect-square w-full rounded-[20px] object-cover lg:rounded-[24px]"
      />
      <div className="flex min-w-0 flex-col gap-4">
        <Link
          to="/"
          className="type-b-14 text-text-secondary underline-offset-4 hover:text-accent hover:underline"
        >
          Back to catalog
        </Link>
        <p className="type-c-12 tracking-[1.4px] text-accent uppercase">{nft.collectionName}</p>
        <h1 className="type-t-18-bold break-words text-foreground lg:text-[32px] lg:leading-tight">
          {nft.name}
        </h1>
        <p className="type-b-14 leading-6 text-text-secondary">{nft.description}</p>
        <p className="type-c-13 text-text-secondary">
          {nft.category} · {nft.creator}
        </p>
        <p data-testid="nft-price" className="type-b-16-bold text-2xl text-accent">
          {formatEth(nft.priceEth)}
        </p>
        <p className="type-c-13 text-text-secondary" aria-live="polite">
          Version {nft.version}.{' '}
          {nft.available
            ? 'At least one edition is still available.'
            : 'Every edition is sold out.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => tick.mutate()} disabled={tick.isPending}>
            {tick.isPending ? 'Sending market move…' : 'Simulate market move'}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="outline">
                Edition notes
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editions and stock</DialogTitle>
                <DialogDescription>
                  The open edition is the catalog price. Artist proofs, when present, are a smaller
                  run at three times that price. A live update replaces both the price and the
                  remaining count without a reload.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
        <ul className="mt-2 divide-y divide-line rounded-[14px] border border-line bg-surface-card">
          {nft.editions.map((edition) => (
            <li key={edition.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="type-b-14-bold truncate">{edition.name}</p>
                <p className="type-c-12 text-text-secondary">
                  {edition.remaining} of {edition.supply} remaining
                  {edition.remaining === 0 ? ' · Sold out' : ''}
                </p>
              </div>
              <p className="type-b-14-bold shrink-0 text-accent">{formatEth(edition.priceEth)}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}

export function DetailSkeleton() {
  return (
    <main
      aria-busy="true"
      className="mx-auto grid w-full max-w-[1440px] gap-6 px-4 py-4 lg:grid-cols-2 lg:px-10"
    >
      <span className="sr-only">Loading edition</span>
      <Skeleton className="aspect-square w-full rounded-[20px]" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-8 w-40" />
      </div>
    </main>
  )
}

export function NftMissing() {
  return (
    <main className="mx-auto flex max-w-lg flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Edition not found</h1>
      <p className="text-muted-foreground">That identifier is not in the seed catalog.</p>
      <Button asChild>
        <Link to="/">Browse editions</Link>
      </Button>
    </main>
  )
}
