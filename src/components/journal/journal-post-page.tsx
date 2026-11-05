import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { EditorialPostDetail } from '@/contracts/editorial'
import { ApiError } from '@/lib/api/errors'
import { editorialPostQuery } from '@/lib/queries'
import { getStoredUserId } from '@/lib/storage'
import { Route } from '@/routes/journal.$slug'

export function JournalPostPage() {
  const { slug } = Route.useParams()
  const post = useQuery(editorialPostQuery(getStoredUserId(), slug))

  if (post.isPending) return <JournalPostSkeleton />
  if (post.isError) {
    const message =
      post.error instanceof ApiError ? post.error.message : 'Este artigo não pôde ser carregado.'
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div role="alert" className="flex flex-col items-start gap-4">
          <h1 className="text-2xl font-semibold">Artigo indisponível</h1>
          <p className="text-muted-foreground">{message}</p>
          <Button type="button" onClick={() => void post.refetch()}>
            Tentar de novo
          </Button>
        </div>
      </main>
    )
  }

  return <JournalPost post={post.data} />
}

function JournalPost({ post }: { post: EditorialPostDetail }) {
  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 pb-10 lg:px-10 lg:py-8">
      <article className="mx-auto max-w-3xl">
        <p className="type-c-13 mb-6 text-[#c9a27a]">
          <Link to="/" className="hover:text-primary">
            Início
          </Link>
          <span aria-hidden> / </span>
          <Link to="/" hash="journal" className="hover:text-primary">
            Diário da Cunhagem
          </Link>
        </p>

        <header>
          <h1 className="text-[26px] leading-9 font-bold tracking-tight text-foreground min-[420px]:text-[32px] lg:text-4xl lg:leading-11">
            {post.title}
          </h1>
          <p className="type-b-14 mt-4 text-[#8d847c]">
            {post.dateLabel}
            <span aria-hidden className="mx-2">
              |
            </span>
            Leitura de {post.readingMinutes} min
            <span aria-hidden className="mx-2">
              |
            </span>
            {post.category}
          </p>
          <p className="type-b-15 mt-3 text-[#c9a27a]">{post.excerpt}</p>
        </header>

        <img
          src={post.imageUrl}
          alt=""
          width={768}
          height={768}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="mt-8 aspect-square w-full rounded-[24px] bg-[#24140f] object-cover"
        />

        <div className="mt-8 flex flex-col gap-5">
          {post.body.map((paragraph, index) => (
            <p
              // biome-ignore lint/suspicious/noArrayIndexKey: static article body, paragraphs are fixed
              key={index}
              className="type-b-15 text-foreground/90"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <footer className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
          <p className="type-c-13 text-[#8d847c]">Diário da Cunhagem · Kurio</p>
          <Link
            to="/"
            hash="journal"
            className="type-b-14-bold inline-flex h-10 items-center rounded-lg bg-primary px-5 text-primary-foreground hover:bg-accent"
          >
            Voltar ao diário
          </Link>
        </footer>
      </article>
    </main>
  )
}

export function JournalPostSkeleton() {
  return (
    <main aria-busy="true" className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-10 lg:py-8">
      <span className="sr-only">Carregando artigo</span>
      <div className="mx-auto max-w-3xl">
        <Skeleton className="h-4 w-52" />
        <Skeleton className="mt-6 h-10 w-full max-w-xl" />
        <Skeleton className="mt-4 h-4 w-64" />
        <Skeleton className="mt-3 h-5 w-full max-w-md" />
        <Skeleton className="mt-8 aspect-square w-full rounded-[24px]" />
        <div className="mt-8 flex flex-col gap-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      </div>
    </main>
  )
}

export function JournalPostMissing() {
  return (
    <main className="mx-auto flex max-w-lg flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Artigo não encontrado</h1>
      <p className="text-muted-foreground">Esse artigo não está no diário.</p>
      <Button asChild>
        <Link to="/" hash="journal">
          Voltar ao diário
        </Link>
      </Button>
    </main>
  )
}
