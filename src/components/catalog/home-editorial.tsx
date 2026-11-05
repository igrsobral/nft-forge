import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import type { EditorialPost, EditorialPromo, EditorialPromoKind } from '@/contracts/editorial'
import { Skeleton } from '@/components/ui/skeleton'
import { editorialHomeQuery } from '@/lib/queries'
import { getStoredUserId } from '@/lib/storage'

const promoLinks: Record<EditorialPromoKind, { ariaLabel: string; search?: { tab: 'new' } }> = {
  genesis: { ariaLabel: 'Explorar lançamentos gênese', search: { tab: 'new' } },
  selection: { ariaLabel: 'Explorar coleções de arte digital' },
}

export function HomeEditorial() {
  const editorial = useQuery(editorialHomeQuery(getStoredUserId()))
  return (
    // Editorial is decorative content: on error the block disappears instead of blocking the catalog.
    <section className="mx-auto w-full max-w-[1440px] px-4 pb-8 lg:px-10 lg:pb-16">
      {editorial.isPending ? <EditorialSkeleton /> : null}
      {editorial.data ? <EditorialSections data={editorial.data} /> : null}
    </section>
  )
}

function EditorialSections({
  data,
}: {
  data: { promos: EditorialPromo[]; journal: EditorialPost[] }
}) {
  return (
    <>
      <section
        aria-label="Destaques da plataforma"
        className="grid gap-4 pt-2 lg:grid-cols-2 lg:gap-5 lg:pt-4"
      >
        {data.promos.map((promo) => (
          <article
            key={promo.kind}
            className="flex flex-col gap-4 rounded-[20px] bg-[#24140f] p-4 sm:flex-row"
          >
            <img
              src={promo.imageUrl}
              alt=""
              width={200}
              height={200}
              className="aspect-square w-full shrink-0 rounded-2xl object-cover sm:size-[200px]"
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <h2 className="type-b-14-bold text-foreground">{promo.title}</h2>
              <p className="type-b-14 mt-2 text-[#c9a27a]">{promo.excerpt}</p>
              <div className="mt-4 flex sm:mt-auto sm:justify-end">
                <Link
                  to="/"
                  search={promoLinks[promo.kind].search}
                  hash="catalogo"
                  aria-label={promoLinks[promo.kind].ariaLabel}
                  className="type-b-14-bold inline-flex h-10 items-center gap-1 rounded-lg bg-primary px-5 text-primary-foreground hover:bg-accent"
                >
                  Explorar
                  <ChevronRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>
      <section id="journal" aria-label="Diário da Cunhagem" className="pt-12 lg:pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-[24px] leading-8 font-bold tracking-tight text-foreground">
            Diário da Cunhagem
          </h2>
          <p className="type-b-14 mt-2 text-[#c9a27a]">
            Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
          </p>
        </div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {data.journal.map((post) => (
            <li key={post.slug}>
              <article className="flex h-full min-w-0 flex-col rounded-xl bg-[#24140f] p-3">
                <img
                  src={post.imageUrl}
                  alt=""
                  width={250}
                  height={250}
                  className="aspect-square w-full min-w-0 rounded-lg object-cover"
                />
                <p className="type-c-12 mt-3 text-[#8d847c]">
                  {post.dateLabel}
                  <span aria-hidden className="mx-2">
                    |
                  </span>
                  Leitura de {post.readingMinutes} min
                </p>
                <p className="type-c-13 mt-1.5 text-[#8d847c]">{post.category}</p>
                <h3 className="type-b-14-bold mt-1.5 text-foreground">{post.title}</h3>
                <p className="type-c-12 mt-2 text-[#8d847c]">{post.excerpt}</p>
                <Link
                  to="/journal/$slug"
                  params={{ slug: post.slug }}
                  aria-label={`Ler mais: ${post.title}`}
                  className="type-c-13 mt-3 inline-flex items-center gap-1 self-start text-[#c9a27a] hover:text-primary"
                >
                  ler mais
                  <ChevronRight className="size-3.5" aria-hidden />
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

function EditorialSkeleton() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Carregando destaques e diário</span>
      <div className="grid gap-4 pt-2 lg:grid-cols-2 lg:gap-5 lg:pt-4">
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col gap-4 rounded-[20px] bg-[#24140f] p-4 sm:flex-row"
          >
            <Skeleton className="aspect-square w-full shrink-0 rounded-2xl sm:size-[200px]" />
            <div className="flex flex-col gap-3 flex-1 py-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full max-w-xs" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-auto h-10 w-28 self-end" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 lg:mt-16">
        <Skeleton className="mx-auto h-7 w-56" />
        <Skeleton className="mx-auto mt-3 h-4 w-full max-w-md" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="rounded-xl bg-[#24140f] p-3">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="mt-3 h-4 w-2/3" />
              <Skeleton className="mt-2 h-4 w-1/2" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
