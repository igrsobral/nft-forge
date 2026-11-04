import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Mail, Star, ZoomIn } from 'lucide-react'
import { useState } from 'react'
import type { NftSummary } from '@/contracts/catalog'
import { tickNftPrice } from '@/lib/api/catalog'
import { ApiError } from '@/lib/api/errors'
import { toListQuery } from '@/lib/catalog-search'
import { formatEth } from '@/lib/money'
import { nftDetailQuery, nftListQuery } from '@/lib/queries'
import { getStoredUserId } from '@/lib/storage'
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
  const [tab, setTab] = useState<'details' | 'reviews'>('details')
  const [relatedPage, setRelatedPage] = useState(0)
  const loadedId = query.data?.id
  const [seenId, setSeenId] = useState(loadedId)
  if (loadedId && loadedId !== seenId) {
    setSeenId(loadedId)
    setFrame(0)
    setTab('details')
    setRelatedPage(0)
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
  const gallery = nft.gallery.length > 0 ? nft.gallery : [nft.imageUrl]
  const image = gallery[Math.min(frame, gallery.length - 1)] ?? nft.imageUrl
  const shareUrl = typeof window === 'undefined' ? '' : window.location.href
  const others = (related.data?.items ?? []).filter((item) => item.id !== nft.id)
  const pageSize = 5
  const pageCount = Math.max(1, Math.ceil(others.length / pageSize))
  const page = Math.min(relatedPage, pageCount - 1)
  const relatedSlice = others.slice(page * pageSize, page * pageSize + pageSize)
  const filledStars = Math.round(nft.rating)

  return (
    <main className="mx-auto w-full max-w-[1440px] min-w-0 overflow-x-clip px-4 py-6 lg:px-10 lg:py-8">
      <p className="type-c-13 mb-5 text-[#c9a27a]">
        <Link to="/" className="hover:text-primary">
          Início
        </Link>
        <span aria-hidden> / </span>
        <a href="/#catalogo" className="hover:text-primary">
          Mercado
        </a>
      </p>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
          <div className="flex gap-2 sm:flex-col" role="list" aria-label="Miniaturas">
            {gallery.map((src, index) => (
              <button
                key={src}
                type="button"
                aria-label={`Miniatura ${index + 1}`}
                aria-pressed={index === Math.min(frame, gallery.length - 1)}
                onClick={() => setFrame(index)}
                className={
                  index === Math.min(frame, gallery.length - 1)
                    ? 'size-16 shrink-0 overflow-hidden rounded-lg border border-primary sm:size-[72px]'
                    : 'size-16 shrink-0 overflow-hidden rounded-lg border border-transparent opacity-80 sm:size-[72px]'
                }
              >
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
          <div className="relative min-w-0 flex-1 rounded-[24px] bg-[#24140f] p-3">
            <img
              src={image}
              alt={`${nft.name} por ${nft.creator}`}
              width={800}
              height={800}
              className="aspect-square w-full min-w-0 rounded-[18px] object-cover"
            />
            <Dialog>
              <DialogTrigger asChild>
                <button
                  type="button"
                  aria-label="Ampliar imagem"
                  className="absolute top-5 right-5 flex size-9 items-center justify-center rounded-full bg-[#140d0a]/80 text-foreground"
                >
                  <ZoomIn className="size-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{nft.name}</DialogTitle>
                </DialogHeader>
                <img src={image} alt="" className="w-full rounded-xl object-cover" />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <h1 className="text-[28px] leading-tight font-bold text-foreground lg:text-[34px]">
            {nft.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <p data-testid="nft-price" className="text-2xl font-bold text-primary">
              {formatEth(nft.priceEth)}
            </p>
            <p className="flex items-center gap-2 text-[#c9a27a]">
              <span className="inline-flex" aria-label={`${nft.rating} de 5`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
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
            <p className="type-b-14 mt-2 leading-6 text-[#c9a27a]">{nft.description}</p>
          </div>
          <PurchasePanel nft={nft} />
          <dl className="type-c-13 grid gap-1 text-[#c9a27a]">
            <div>ID do token: {nft.tokenId}</div>
            <div>Coleção: {nft.collectionName}</div>
            <div>Atributos: {nft.attributes.join(', ')}</div>
          </dl>
          <p className="type-c-13 flex flex-wrap items-center gap-3 text-[#c9a27a]">
            <span>Compartilhar este NFT:</span>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Compartilhar no LinkedIn"
              className="text-primary"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
                <path d="M6.5 9H4V20h2.5zM5.2 4A1.6 1.6 0 1 0 5.2 7.2 1.6 1.6 0 0 0 5.2 4zM20 20h-2.5v-5.6c0-1.6-.6-2.6-2-2.6a2.2 2.2 0 0 0-2 1.5 2 2 0 0 0-.1.9V20H11V9h2.4v1.5a3.4 3.4 0 0 1 3-1.7c2.2 0 3.6 1.4 3.6 4.5z" />
              </svg>
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(nft.name)}&body=${encodeURIComponent(shareUrl)}`}
              aria-label="Compartilhar por e-mail"
              className="text-primary"
            >
              <Mail className="size-4" />
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(nft.name)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Compartilhar no Twitter"
              className="text-primary"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
                <path d="M19 7.3c-.6.3-1.2.4-1.9.5a3.1 3.1 0 0 0 1.4-1.7 6.2 6.2 0 0 1-2 .8 3.1 3.1 0 0 0-5.3 2.8A8.8 8.8 0 0 1 5 6.6a3.1 3.1 0 0 0 1 4.1 3 3 0 0 1-1.4-.4v.1a3.1 3.1 0 0 0 2.5 3 3.1 3.1 0 0 1-1.4.1 3.1 3.1 0 0 0 2.9 2.2A6.3 6.3 0 0 1 5 17.5 8.8 8.8 0 0 0 9.8 19c5.8 0 9-4.8 9-9v-.4A6.4 6.4 0 0 0 20 7.7a6 6 0 0 1-1 .6z" />
              </svg>
            </a>
          </p>
          <button
            type="button"
            className="type-c-12 self-start text-[#8d847c] underline-offset-2 hover:underline"
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
          className="flex gap-6 border-b border-[#6a4332]"
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
          <div className="type-b-14 mt-5 max-w-4xl space-y-4 leading-6 text-[#c9a27a]">
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
              <li className="text-[#c9a27a]">Ainda não há avaliações.</li>
            ) : (
              nft.reviews.map((review) => (
                <li key={review.id} data-testid="review" className="border-b border-[#3f2319] pb-4">
                  <p className="type-b-14-bold text-foreground">{review.author}</p>
                  <p className="type-c-13 text-primary">{review.rating} de 5</p>
                  <p className="type-b-14 mt-1 text-[#c9a27a]">{review.body}</p>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <section className="mt-12" aria-label="Mais desta coleção">
        <div className="mb-5 flex items-center gap-4">
          <h2 className="type-b-16-bold shrink-0 text-primary">Mais desta coleção</h2>
          <span aria-hidden className="h-px flex-1 bg-[#6a4332]" />
        </div>
        {relatedSlice.length === 0 ? (
          <p className="text-[#c9a27a]">Esta coleção ainda não tem outras edições.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {relatedSlice.map((item) => (
              <li key={item.id} className="min-w-0">
                <RelatedCard nft={item} />
              </li>
            ))}
          </ul>
        )}
        {pageCount > 1 ? (
          <div
            className="mt-5 flex justify-center gap-2"
            role="tablist"
            aria-label="Páginas da coleção"
          >
            {Array.from({ length: pageCount }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Página ${index + 1} da coleção`}
                aria-selected={index === page}
                onClick={() => setRelatedPage(index)}
                className={
                  index === page
                    ? 'size-2.5 rounded-full bg-primary'
                    : 'size-2 rounded-full bg-[#6a4332]'
                }
              />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  )
}

function RelatedCard({ nft }: { nft: NftSummary }) {
  return (
    <article className="relative flex h-full flex-col rounded-xl bg-[#24140f] p-3">
      <img
        src={nft.imageUrl}
        alt=""
        className="aspect-square w-full min-w-0 rounded-xl object-cover"
      />
      <h3 className="type-c-13 mt-3 truncate text-foreground">
        <Link
          to="/nfts/$nftId"
          params={{ nftId: nft.id }}
          className="after:absolute after:inset-0 after:content-[''] hover:text-primary"
        >
          {nft.name}
        </Link>
      </h3>
      <p className="type-b-14-bold mt-1 text-primary">{formatEth(nft.priceEth)}</p>
    </article>
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
