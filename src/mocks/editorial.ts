import {
  editorialHomeSchema,
  editorialPostDetailSchema,
  type EditorialCategory,
  type EditorialPromoKind,
} from '@/contracts/editorial'
import { nftImageUrl } from './images'

export type EditorialPromoRecord = {
  kind: EditorialPromoKind
  title: string
  excerpt: string
  hue: number
  frame: number
}

export type EditorialPostRecord = {
  slug: string
  title: string
  excerpt: string
  category: EditorialCategory
  dateLabel: string
  readingMinutes: number
  hue: number
  frame: number
  body: string[]
}

export const editorialPromos: EditorialPromoRecord[] = [
  {
    kind: 'genesis',
    title: 'Lançamentos gênese de edição limitada',
    excerpt: 'Coleções exclusivas lançadas direto dos criadores, antes da abertura ao público.',
    hue: 150,
    frame: 0,
  },
  {
    kind: 'selection',
    title: 'Arte digital selecionada e muito mais',
    excerpt: 'Explore novas artes, coleções verificadas e obras digitalmente autenticadas.',
    hue: 40,
    frame: 1,
  },
]

export const editorialPosts: EditorialPostRecord[] = [
  {
    slug: 'prova-de-trabalho-de-nfts',
    title: 'Como funciona a prova de trabalho de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    category: 'NFTs',
    dateLabel: '12 de setembro',
    readingMinutes: 6,
    hue: 220,
    frame: 1,
    body: [
      'Todo NFT nasce em uma transação que a rede inteira confere. A cunhagem grava no contrato a trova de quem criou a edição e a tiragem, e o resto da rede registra o mesmo evento no seu próprio livro.',
      'É essa repetição entre máquinas que impede alguém de apagar um registro depois de vender a obra. Se um nó desliga, outros mil guardam a mesma conta.',
      'Na prática, o colecionador não precisa confiar na plataforma: consulta o contrato direto na carteira e vê o histórico completo, do primeiro dono até hoje.',
      'O que isso muda para você: antes de comprar, olhe o contrato, a data da cunhagem e a tiragem real. Edição limitada é o número que está escrito no disco, não o que está na vitrine.',
    ],
  },
  {
    slug: 'artistas-digitais-para-acompanhar',
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital.',
    category: 'Criadores',
    dateLabel: '15 de setembro',
    readingMinutes: 2,
    hue: 150,
    frame: 0,
    body: [
      'A lista mistura veteranos do movimento generativo com estreias recentes. O critério foi simples: quem manteve uma prática consistente e uma comunidade viva ao longo do ano.',
      'Vale acompanhar os próximos lançamentos de cada um deles. Tradicionalmente, a ação acontece em três ondas: prévia da coleção, lista de acesso e cunhagem aberta.',
      'Assine os alertas e habilite notificações da carteira para não perder as janelas das listas de acesso — a maioria esgota em minutos.',
    ],
  },
  {
    slug: 'raridade-atributos-e-procedencia',
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, créditos autorais e utilidade.',
    category: 'Mercado',
    dateLabel: '15 de setembro',
    readingMinutes: 3,
    hue: 90,
    frame: 0,
    body: [
      'Raridade é distribuição, não beleza. Um atributo aparece em 2% da coleção ou em 40% — o mercado paga a primeira com facilidade e ignora a segunda.',
      'Procedência é a corrente de donos desde a cunhagem. Uma peça que veio da carteira do criador original vale mais que a mesma imagem passando por trocas silenciosas.',
      'Créditos autorais e utilidade dividem o resto da conta: licenças claras e benefícios concretos — acesso a eventos, novidades da coleção, direito a cunhagem futura — sustentam preço quando a ficha visual não basta.',
      'Combine os três recortes antes de ofertar. Atributo raro sem procedência limpa é desconto disfarçado.',
    ],
  },
  {
    slug: 'como-proteger-sua-carteira',
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, evite golpes e mantenha sua identidade.',
    category: 'NFTs',
    dateLabel: '15 de setembro',
    readingMinutes: 2,
    hue: 40,
    frame: 2,
    body: [
      'A frase de recuperação é a chave da porta: nunca a escreva em site, grupo ou suporte. Quem pede a frase é golpista, sem exceção.',
      'Separe a carteira principal da carteira de uso. A principal guarda coleções de valor e assina poucas coisas; a secundária paga cunhagens e interage com tudo.',
      'Antes de assinar qualquer transação, leia o pedido: contrato estranho, permissão ilimitada de tokens e sites que chegam por mensagem são os três avisos mais comuns.',
      'Se uma proposta parecer boa demais, ela não é. Feche a aba, confira o endereço oficial pela lista de coleções verificadas e volte por lá.',
    ],
  },
]

function imageFor(title: string, hue: number, frame: number): string {
  return nftImageUrl(title, 'Kurio Editorial', hue, frame)
}

export function presentEditorialHome() {
  return editorialHomeSchema.parse({
    promos: editorialPromos.map((promo) => ({
      kind: promo.kind,
      title: promo.title,
      excerpt: promo.excerpt,
      imageUrl: imageFor(promo.title, promo.hue, promo.frame),
    })),
    journal: editorialPosts
      .map(({ body: _body, ...post }) => post)
      .map((post) => ({ ...post, imageUrl: imageFor(post.title, post.hue, post.frame) })),
  })
}

export function presentEditorialPost(slug: string) {
  const post = editorialPosts.find((item) => item.slug === slug)
  if (!post) return null
  return editorialPostDetailSchema.parse({
    ...post,
    imageUrl: imageFor(post.title, post.hue, post.frame),
  })
}
