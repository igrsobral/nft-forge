import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { MoveRight } from 'lucide-react'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { NftSummary } from '@/contracts/catalog'
import { toListQuery } from '@/lib/catalog-search'
import { nftListQuery } from '@/lib/queries'
import { getStoredUserId } from '@/lib/storage'

const heroQuery = toListQuery({ sort: 'newest', page: 1, pageSize: 3 })

function useHeroCarousel() {
  const hero = useQuery(nftListQuery(getStoredUserId(), heroQuery))
  const [slide, setSlide] = useState(0)
  const slides = hero.data?.items ?? []
  const slideIndex = slides.length === 0 ? 0 : Math.min(slide, slides.length - 1)
  return { slides, slideIndex, activeSlide: slides[slideIndex], setSlide }
}

function HeroDots({
  slides,
  slideIndex,
  keyPrefix,
  className,
  onSelect,
}: {
  slides: NftSummary[]
  slideIndex: number
  keyPrefix: string
  className?: string
  onSelect: (index: number) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Destaques"
      className={className ?? 'flex items-center justify-center gap-2'}
    >
      {(slides.length > 0 ? slides : [0, 1, 2]).map((item, index) => {
        const selected = index === slideIndex
        return (
          <button
            key={typeof item === 'number' ? `${keyPrefix}-${index}` : `${keyPrefix}-${item.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={`Destaque ${index + 1}`}
            disabled={slides.length === 0}
            onClick={() => onSelect(index)}
            className={
              selected ? 'size-2.5 rounded-full bg-primary' : 'size-2 rounded-full bg-[#6a4332]'
            }
          />
        )
      })}
    </div>
  )
}

export function HomeHeroDesktop() {
  const { slides, slideIndex, activeSlide, setSlide } = useHeroCarousel()
  return (
    <section className="mx-auto hidden w-full max-w-[1440px] min-w-0 items-center gap-8 px-4 py-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-12 lg:px-10 lg:py-14">
      <div className="flex max-w-[620px] flex-col items-start">
        <p className="type-b-14 text-foreground">Bem-vindo à Kurio</p>
        <h1 className="mt-5 text-[28px] leading-[1.15] font-bold tracking-tight text-foreground uppercase min-[420px]:text-[32px] lg:text-[clamp(32px,3.15vw,46px)] lg:leading-[1.12]">
          <span className="block lg:whitespace-nowrap">Seja dono do futuro</span>
          <span className="block lg:whitespace-nowrap">da arte digital</span>
        </h1>
        <p className="type-b-14 mt-5 max-w-[540px] text-[#c9a27a] lg:text-[15px] lg:leading-6">
          Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
          rara, apoie artistas e tenha uma parte da cultura da internet.
        </p>
        <a
          href="#catalogo"
          className="type-b-14-bold mt-8 inline-flex h-11 items-center rounded-lg bg-primary px-8 text-primary-foreground uppercase tracking-[0.08em]"
        >
          Explorar
        </a>
        <HeroDots
          slides={slides}
          slideIndex={slideIndex}
          keyPrefix="desktop"
          className="mt-12 flex w-full items-center justify-center gap-2 lg:mt-16"
          onSelect={setSlide}
        />
      </div>
      {activeSlide ? (
        <Link
          to="/nfts/$nftId"
          params={{ nftId: activeSlide.id }}
          className="block min-w-0 overflow-hidden rounded-[28px] bg-[#24140f]"
        >
          <img
            src={activeSlide.imageUrl}
            alt={`${activeSlide.name} por ${activeSlide.creator}`}
            width={460}
            height={460}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="aspect-square w-full min-w-0 object-cover"
          />
        </Link>
      ) : (
        <Skeleton className="aspect-square w-full rounded-[28px]" />
      )}
    </section>
  )
}

export function HomeHeroMobile() {
  const { slides, slideIndex, activeSlide, setSlide } = useHeroCarousel()
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 pt-3.5 lg:hidden">
      <div className="bg-gradient-hero relative overflow-hidden rounded-[22px] p-4">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-48 -left-20 size-[420px] rounded-full border border-[#d28a4c]/25 bg-[radial-gradient(closest-side,rgba(210,138,76,0.3)_36%,rgba(210,138,76,0)_74%)]"
        />
        <div className="relative flex items-center gap-3.5">
          <div className="min-w-0 flex-1">
            <p className="type-c-13 text-foreground">Bem-vindo à Kurio</p>
            <h1 className="mt-2 text-[20px] leading-[1.25] font-bold tracking-tight text-foreground uppercase">
              <span className="block">Seja dono da</span>
              <span className="block">cultura digital</span>
            </h1>
            <p className="type-c-12 mt-3 text-secondary">
              Descubra NFTs selecionados de criadores do mundo todo
            </p>
            <a
              href="#catalogo"
              className="type-b-14-bold mt-4 inline-flex items-center gap-2 text-primary uppercase tracking-[0.08em]"
            >
              Explorar
              <MoveRight aria-hidden className="size-4" />
            </a>
          </div>
          {activeSlide ? (
            <Link
              to="/nfts/$nftId"
              params={{ nftId: activeSlide.id }}
              aria-label={`Ver ${activeSlide.name}`}
              className="block shrink-0"
            >
              <img
                src={activeSlide.imageUrl}
                alt=""
                width={128}
                height={128}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="size-32 rounded-[18px] object-cover shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
              />
            </Link>
          ) : (
            <Skeleton className="size-32 shrink-0 rounded-[18px]" />
          )}
        </div>
      </div>
      <div className="mt-5">
        <HeroDots slides={slides} slideIndex={slideIndex} keyPrefix="mobile" onSelect={setSlide} />
      </div>
    </section>
  )
}
