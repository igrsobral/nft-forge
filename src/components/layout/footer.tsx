import { useMutation } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import type { Category } from '@/contracts/common'
import { ApiError } from '@/lib/api/errors'
import { subscribeNewsletter } from '@/lib/api/commerce'

const features = [
  {
    mark: 'W',
    title: 'Segurança da carteira',
    body: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    mark: 'C',
    title: 'Criadores em destaque',
    body: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    mark: 'D',
    title: 'Alertas de lançamentos',
    body: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
] as const

const profileLinks = [
  { label: 'Meu perfil', to: '/profile' as const },
  { label: 'Minha coleção', to: '/profile' as const },
  { label: 'Atividade', to: '/profile/activity' as const },
  { label: 'Estúdio do criador', to: '/signup' as const },
  { label: 'Lista de interesse', to: '/' as const },
]

const collectionLinks: Category[] = ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade']

const socials = [
  {
    label: 'Facebook',
    href: 'https://facebook.com',
    path: 'M14 8h3V5h-3a4 4 0 0 0-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2a1 1 0 0 1 1-1z',
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com',
    path: 'M8 4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4zm8 2H8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zm-4 2.5A3.5 3.5 0 1 1 8.5 12 3.5 3.5 0 0 1 12 8.5zm4.2-.9a.9.9 0 1 1-.9.9.9.9 0 0 1 .9-.9z',
  },
  {
    label: 'Twitter',
    href: 'https://twitter.com',
    path: 'M19 7.3c-.6.3-1.2.4-1.9.5a3.1 3.1 0 0 0 1.4-1.7 6.2 6.2 0 0 1-2 .8 3.1 3.1 0 0 0-5.3 2.8A8.8 8.8 0 0 1 5 6.6a3.1 3.1 0 0 0 1 4.1 3 3 0 0 1-1.4-.4v.1a3.1 3.1 0 0 0 2.5 3 3.1 3.1 0 0 1-1.4.1 3.1 3.1 0 0 0 2.9 2.2A6.3 6.3 0 0 1 5 17.5 8.8 8.8 0 0 0 9.8 19c5.8 0 9-4.8 9-9v-.4A6.4 6.4 0 0 0 20 7.7a6 6 0 0 1-1 .6z',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com',
    path: 'M6.5 9H4V20h2.5zM5.2 4A1.6 1.6 0 1 0 5.2 7.2 1.6 1.6 0 0 0 5.2 4zM20 20h-2.5v-5.6c0-1.6-.6-2.6-2-2.6a2.2 2.2 0 0 0-2 1.5 2 2 0 0 0-.1.9V20H11V9h2.4v1.5a3.4 3.4 0 0 1 3-1.7c2.2 0 3.6 1.4 3.6 4.5z',
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com',
    path: 'M22 12.2s0-3.2-.4-4.6a3 3 0 0 0-2.1-2.1C17.9 5 12 5 12 5s-5.9 0-7.5.5a3 3 0 0 0-2.1 2.1C2 9 2 12.2 2 12.2s0 3.2.4 4.6a3 3 0 0 0 2.1 2.1C6.1 19.4 12 19.4 12 19.4s5.9 0 7.5-.5a3 3 0 0 0 2.1-2.1c.4-1.4.4-4.6.4-4.6zM10 15.5v-6l5 3z',
  },
] as const

export function Footer() {
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const subscribe = useMutation({
    mutationFn: () => subscribeNewsletter(email),
    onSuccess: () => {
      setFieldError(null)
      setEmail('')
      toast.success('Inscrição confirmada.')
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : 'Não foi possível inscrever este e-mail.'
      setFieldError(message)
      toast.error(message)
    },
  })

  return (
    <footer className="px-4 pt-8 pb-10 lg:px-10">
      <div className="mx-auto max-w-[1440px] bg-[#24140f]">
        <div className="grid gap-8 px-5 py-8 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.15fr] xl:divide-x xl:divide-[#d28a4c]/50">
          {features.map((feature) => (
            <section key={feature.mark} className="flex gap-4 xl:px-5 xl:first:pl-0">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                {feature.mark}
              </span>
              <div>
                <h2 className="type-b-14-bold text-foreground">{feature.title}</h2>
                <p className="type-c-13 mt-2 text-[#c9a27a]">{feature.body}</p>
              </div>
            </section>
          ))}
          <section className="xl:pl-6">
            <h2 className="type-b-14-bold max-w-[16ch] text-foreground">
              Antecipe-se ao próximo lançamento
            </h2>
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault()
                subscribe.mutate()
              }}
            >
              <label className="min-w-0 flex-1">
                <span className="sr-only">E-mail</span>
                <input
                  type="email"
                  name="email"
                  value={email}
                  placeholder="digite seu e-mail..."
                  autoComplete="email"
                  aria-invalid={fieldError ? true : undefined}
                  onChange={(event) => setEmail(event.target.value)}
                  className="type-c-13 h-10 w-full rounded-md border border-[#6a4332] bg-[#1a100c] px-3 text-foreground placeholder:text-[#c9a27a]/70"
                />
              </label>
              <button
                type="submit"
                disabled={subscribe.isPending}
                className="type-b-14-bold h-10 rounded-md bg-primary px-4 text-primary-foreground disabled:opacity-60"
              >
                {subscribe.isPending ? 'Enviando…' : 'Enviar'}
              </button>
            </form>
            {fieldError ? (
              <p className="type-c-12 mt-2 text-destructive" role="alert">
                {fieldError}
              </p>
            ) : (
              <p className="type-c-13 mt-3 text-[#c9a27a]">
                Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
              </p>
            )}
          </section>
        </div>

        <div className="grid gap-3 bg-[#3a261c] px-5 py-4 text-sm text-foreground md:grid-cols-4 md:items-center">
          <p className="font-bold tracking-[0.18em]">KURIO</p>
          <p>Feito para colecionadores, criadores e cultura</p>
          <a href="mailto:contato@email.com" className="hover:text-primary">
            contato@email.com
          </a>
          <p className="md:text-right">+55 11 4002 8922</p>
        </div>

        <div className="grid gap-8 px-5 py-8 sm:grid-cols-2 xl:grid-cols-4">
          <nav aria-label="Meu perfil">
            <h2 className="type-b-14-bold mb-3 text-foreground">Meu perfil</h2>
            <ul className="flex flex-col gap-2">
              {profileLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="type-c-13 text-[#c9a27a] hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Central de ajuda">
            <h2 className="type-b-14-bold mb-3 text-foreground">Central de ajuda</h2>
            <ul className="flex flex-col gap-2">
              <li>
                <a
                  href="mailto:contato@email.com?subject=Ajuda"
                  className="type-c-13 text-[#c9a27a] hover:text-primary"
                >
                  Central de ajuda
                </a>
              </li>
              <li>
                <Link to="/" className="type-c-13 text-[#c9a27a] hover:text-primary">
                  Como comprar NFTs
                </Link>
              </li>
              <li>
                <Link to="/profile/wallets" className="type-c-13 text-[#c9a27a] hover:text-primary">
                  Carteira e segurança
                </Link>
              </li>
              <li>
                <a
                  href="mailto:contato@email.com?subject=Política%20do%20mercado"
                  className="type-c-13 text-[#c9a27a] hover:text-primary"
                >
                  Política do mercado
                </a>
              </li>
              <li>
                <a
                  href="mailto:contato@email.com?subject=Denúncia"
                  className="type-c-13 text-[#c9a27a] hover:text-primary"
                >
                  Denunciar item
                </a>
              </li>
            </ul>
          </nav>
          <nav aria-label="Coleções do rodapé">
            <h2 className="type-b-14-bold mb-3 text-foreground">Coleções</h2>
            <ul className="flex flex-col gap-2">
              {collectionLinks.map((category) => (
                <li key={category}>
                  <Link
                    to="/"
                    search={{ category }}
                    className="type-c-13 text-[#c9a27a] hover:text-primary"
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <h2 className="type-b-14-bold mb-3 text-foreground">Redes sociais</h2>
            <ul className="flex flex-wrap gap-2">
              {socials.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    className="flex size-9 items-center justify-center rounded-md border border-primary text-primary hover:bg-primary/10"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
                      <path d={item.path} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
            <h2 className="type-b-14-bold mt-5 mb-3 text-foreground">Carteiras compatíveis</h2>
            <p className="type-c-12 inline-flex rounded-full border border-primary px-3 py-1 tracking-wide whitespace-nowrap text-primary">
              METAMASK · WALLETCONNECT · COINBASE
            </p>
          </div>
        </div>
        <p className="type-c-12 px-5 pb-5 text-center text-[#c9a27a]">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </div>
    </footer>
  )
}
