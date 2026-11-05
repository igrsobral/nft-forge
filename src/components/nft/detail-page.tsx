import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, Mail, Star, ZoomIn } from 'lucide-react'
import { useState } from 'react'
import { EditionCarousel } from '@/components/catalog/edition-carousel'
import { useCarouselSwipe } from '@/components/catalog/use-carousel-swipe'
import { PurchasePanel } from '@/components/nft/purchase-panel'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { tickNftPrice } from '@/lib/api/catalog'
import { ApiError } from '@/lib/api/errors'
import { toListQuery } from '@/lib/catalog-search'
import { formatEth } from '@/lib/money'
import { nftDetailQuery, nftListQuery } from '@/lib/queries'
import { getStoredUserId } from '@/lib/storage'
import { Route } from '@/routes/nfts.$nftId'

const networkLabels = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' } as const

export function NftDetailPage() {
  const { nftId } = Route.useParams()
  const userId = getStoredUserId()
  const query = useQuery(nftDetailQuery(userId, nftId))
  const tick = useMutation({
    mutationFn: () => tickNftPrice(nftId),
  })
  const [frame, setFrame] = useState(0)
  const gallery = query.data
    ? query.data.gallery.length > 0
      ? query.data.gallery
      : [query.data.imageUrl]
    : []
  const swipeGallery = useCarouselSwipe((direction) => {
    if (gallery.length > 1) setFrame((frame + direction + gallery.length) % gallery.length)
  })
  const [tab, setTab] = useState<'details' | 'reviews'>('details')
  const loadedId = query.data?.id
  const [seenId, setSeenId] = useState(loadedId)
  if (loadedId && loadedId !== seenId) {
    setSeenId(loadedId)
    setFrame(0)
    setTab('details')
  }

  const related = useQuery({
    ...nftListQuery(
      userId,
      toListQuery({
        collection: query.data?.collectionId,
        pageSize: 12,
        sort: 'newest',
      }),
    ),
    enabled: Boolean(query.data),
  })

  if (query.isPending) return <DetailSkeleton />
  if (query.isError) {
    const message =
      query.error instanceof ApiError ? query.error.message : 'Esta edição não pôde ser carregada.'
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div role="alert" className="flex flex-col items-start gap-4">
          <h1 className="text-2xl font-semibold">Edição indisponível</h1>
          <p className="text-muted-foreground">{message}</p>
          <Button type="button" onClick={() => void query.refetch()}>
            Tentar de novo
          </Button>
        </div>
      </main>
    )
  }

  const nft = query.data
  const image = gallery[Math.min(frame, gallery.length - 1)] ?? nft.imageUrl
  const shareUrl = typeof window === 'undefined' ? '' : window.location.href
  const others = (related.data?.items ?? []).filter((item) => item.id !== nft.id)
  const filledStars = Math.round(nft.rating)

  return (
    <main className="mx-auto w-full max-w-[1440px] min-w-0 overflow-x-clip px-4 py-6 pb-48 lg:px-10 lg:py-8 lg:pb-8">
      <p className="type-c-13 mb-5 hidden text-secondary-muted lg:block">
        <Link to="/" className="hover:text-primary">
          Início
        </Link>
        <span aria-hidden> / </span>
        <a href="/#catalogo" className="hover:text-primary">
          Mercado
        </a>
      </p>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-9">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:gap-4">
          <fieldset
            className="relative hidden border-0 gap-3 p-0 lg:flex lg:flex-col"
            aria-label="Miniaturas"
          >
            {gallery.map((src, index) => (
              <button
                key={src}
                type="button"
                aria-label={`Miniatura ${index + 1}`}
                aria-pressed={index === Math.min(frame, gallery.length - 1)}
                onClick={() => setFrame(index)}
                className={
                  index === Math.min(frame, gallery.length - 1)
                    ? 'size-16 shrink-0 overflow-hidden rounded-lg border border-primary sm:size-[84px]'
                    : 'size-16 shrink-0 overflow-hidden rounded-lg border border-transparent opacity-80 sm:size-[84px]'
                }
              >
                <img
                  src={src}
                  alt=""
                  width={84}
                  height={84}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              </button>
            ))}
          </fieldset>
          <div
            {...swipeGallery}
            className="relative min-w-0 flex-1 touch-pan-y rounded-[24px] border border-line-strong/70 bg-surface-panel p-3"
          >
            <a
              href="/#catalogo"
              aria-label="Voltar"
              className="absolute top-3 left-3 z-10 flex size-11 items-center justify-center rounded-full bg-background/80 text-foreground lg:hidden"
            >
              <ChevronLeft className="size-5" />
            </a>
            <img
              src={image}
              alt={`${nft.name} por ${nft.creator}`}
              width={800}
              height={800}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="aspect-square w-full min-w-0 rounded-[18px] object-cover max-lg:h-[300px] max-lg:aspect-auto"
            />
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  aria-label="Ampliar imagem"
                  className="absolute top-5 right-5 flex size-10 items-center justify-center rounded-full border border-line-strong/60 bg-background/85 text-foreground"
                >
                  <ZoomIn className="size-[18px]" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{nft.name}</DialogTitle>
                </DialogHeader>
                <img
                  src={image}
                  alt=""
                  width={800}
                  height={800}
                  loading="lazy"
                  decoding="async"
                  className="w-full rounded-xl object-cover"
                />
              </DialogContent>
            </Dialog>
            {gallery.length > 1 ? (
              <fieldset
                className="mt-3 flex justify-center gap-2 border-0 p-0 lg:hidden"
                aria-label="Imagens do NFT"
              >
                {gallery.map((src, index) => (
                  <button
                    key={src}
                    type="button"
                    aria-label={`Imagem ${index + 1} de ${gallery.length}`}
                    aria-pressed={index === Math.min(frame, gallery.length - 1)}
                    onClick={() => setFrame(index)}
                    className={
                      index === Math.min(frame, gallery.length - 1)
                        ? 'size-2.5 rounded-full bg-primary'
                        : 'size-2 rounded-full bg-line-strong'
                    }
                  />
                ))}
              </fieldset>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-[28px] leading-tight font-bold text-foreground lg:text-[30px]">
              {nft.name}
            </h1>
            <p className="mt-1 shrink-0 rounded-full bg-surface-panel px-2.5 py-1 text-sm font-bold text-primary lg:hidden">
              {nft.rating.toFixed(1)}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 max-lg:sr-only">
            <p data-testid="nft-price" className="text-[26px] leading-none font-bold text-primary">
              {formatEth(nft.priceEth)}
            </p>
            <p className="flex items-center gap-2 text-secondary-muted">
              <span className="inline-flex" role="img" aria-label={`${nft.rating} de 5`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed 5 decorative stars, order never changes
                    key={index}
                    className={
                      index < filledStars
                        ? 'size-4 fill-primary text-primary'
                        : 'size-4 text-primary/35'
                    }
                  />
                ))}
              </span>
              <span className="type-c-13">{nft.reviewCount} avaliações de colecionadores</span>
            </p>
          </div>
          <div>
            <h2 className="type-b-14-bold text-foreground">Sobre este NFT:</h2>
            <p className="type-b-14 mt-2 leading-6 text-secondary-muted max-lg:line-clamp-3">
              {nft.description}
            </p>
          </div>
          <PurchasePanel nft={nft} />
          <ul className="type-c-13 grid gap-2 text-secondary-muted">
            <li>ID do token: {nft.tokenId}</li>
            <li>Coleção: {nft.collectionName}</li>
            <li>Atributos: {nft.attributes.join(', ')}</li>
          </ul>
          <p className="type-c-13 flex flex-wrap items-center gap-3 text-secondary-muted">
            <span>Compartilhar este NFT:</span>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="text-primary"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
                <path d="M6.5 9H4V20h2.5zM5.2 4A1.6 1.6 0 1 0 5.2 7.2 1.6 1.6 0 0 0 5.2 4zM20 20h-2.5v-5.6c0-1.6-.6-2.6-2-2.6a2.2 2.2 0 0 0-2 1.5 2 2 0 0 0-.1.9V20H11V9h2.4v1.5a3.4 3.4 0 0 1 3-1.7c2.2 0 3.6 1.4 3.6 4.5z" />
              </svg>
              <span className="sr-only">Compartilhar no LinkedIn</span>
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(nft.name)}&body=${encodeURIComponent(shareUrl)}`}
              className="text-primary"
            >
              <Mail className="size-4" />
              <span className="sr-only">Compartilhar por e-mail</span>
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(nft.name)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="text-primary"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
                <path d="M19 7.3c-.6.3-1.2.4-1.9.5a3.1 3.1 0 0 0 1.4-1.7 6.2 6.2 0 0 1-2 .8 3.1 3.1 0 0 0-5.3 2.8A8.8 8.8 0 0 1 5 6.6a3.1 3.1 0 0 0 1 4.1 3 3 0 0 1-1.4-.4v.1a3.1 3.1 0 0 0 2.5 3 3.1 3.1 0 0 1-1.4.1 3.1 3.1 0 0 0 2.9 2.2A6.3 6.3 0 0 1 5 17.5 8.8 8.8 0 0 0 9.8 19c5.8 0 9-4.8 9-9v-.4A6.4 6.4 0 0 0 20 7.7a6 6 0 0 1-1 .6z" />
              </svg>
              <span className="sr-only">Compartilhar no Twitter</span>
            </a>
          </p>
          <button
            type="button"
            className="type-c-12 self-start text-copy-muted underline-offset-2 hover:underline"
            disabled={tick.isPending}
            onClick={() => tick.mutate()}
          >
            {tick.isPending ? 'Enviando movimento…' : 'Simulate market move'}
          </button>
        </div>
      </div>

      <div className="mt-10">
        <div
          role="tablist"
          aria-label="Ficha da edição"
          className="flex gap-6 border-b border-line-strong"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'details'}
            className={
              tab === 'details'
                ? 'type-b-14-bold border-b-2 border-primary pb-2 text-primary'
                : 'type-b-14 border-b-2 border-transparent pb-2 text-foreground'
            }
            onClick={() => setTab('details')}
          >
            Detalhes do NFT
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'reviews'}
            className={
              tab === 'reviews'
                ? 'type-b-14-bold border-b-2 border-primary pb-2 text-primary'
                : 'type-b-14 border-b-2 border-transparent pb-2 text-foreground'
            }
            onClick={() => setTab('reviews')}
          >
            Avaliações de colecionadores ({nft.reviewCount})
          </button>
        </div>
        {tab === 'details' ? (
          <div className="type-b-14 mt-5 max-w-4xl space-y-4 leading-6 text-secondary-muted">
            <p>
              {nft.name} é uma obra de {nft.category.toLowerCase()} da coleção {nft.collectionName}.{' '}
              {nft.description} Cada atributo fica registrado nos metadados do token e pode ser
              conferido na {networkLabels[nft.network]}.
            </p>
            <p>{nft.royaltyNote}</p>
            <h3 className="font-bold text-foreground">Rede:</h3>
            <p>{nft.networkNote}</p>
            <h3 className="font-bold text-foreground">Contrato:</h3>
            <p>{nft.contractNote}</p>
            <h3 className="font-bold text-foreground">Direitos autorais:</h3>
            <p>
              <span title={nft.contractAddress}>
                {nft.contractAddress.slice(0, 6)}…{nft.contractAddress.slice(-4)}
              </span>{' '}
              · {nft.royaltyNote}
            </p>
          </div>
        ) : (
          <ul className="mt-5 flex max-w-3xl flex-col gap-4">
            {nft.reviews.length === 0 ? (
              <li className="text-secondary-muted">Ainda não há avaliações.</li>
            ) : (
              nft.reviews.map((review) => (
                <li key={review.id} data-testid="review" className="border-b border-border pb-4">
                  <p className="type-b-14-bold text-foreground">{review.author}</p>
                  <p className="type-c-13 text-primary">{review.rating} de 5</p>
                  <p className="type-b-14 mt-1 text-secondary-muted">{review.body}</p>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <EditionCarousel
        title="Mais desta coleção"
        items={others}
        emptyLabel="Esta coleção ainda não tem outras edições."
      />
    </main>
  )
}

export function DetailSkeleton() {
  return (
    <main
      aria-busy="true"
      className="mx-auto grid w-full max-w-[1440px] gap-6 px-4 py-6 lg:grid-cols-2 lg:px-10"
    >
      <span className="sr-only">Carregando edição</span>
      <Skeleton className="aspect-square w-full rounded-[24px]" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-20 w-full" />
      </div>
    </main>
  )
}

export function NftMissing() {
  return (
    <main className="mx-auto flex max-w-lg flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Edição não encontrada</h1>
      <p className="text-muted-foreground">Esse identificador não está no catálogo.</p>
      <Button asChild>
        <Link to="/">Voltar ao mercado</Link>
      </Button>
    </main>
  )
}
