import type { CatalogNetwork, Category, Network, WalletRole } from '@/contracts/common'
import { categories } from '@/contracts/common'
import { mulEth } from '@/lib/money'
import { nftImageUrl } from './images'

export type EditionRecord = {
  id: string
  name: string
  label: string
  supply: number
  remaining: number
  priceEth: string
}

export type ReviewRecord = {
  id: string
  author: string
  rating: number
  body: string
  createdAt: string
}

export type NftRecord = {
  id: string
  slug: string
  name: string
  description: string
  collectionId: string
  collectionName: string
  category: Category
  network: CatalogNetwork
  creator: string
  imageHue: number
  priceEth: string
  previousPriceEth: string | null
  rarity: 'comum' | 'raro'
  editions: EditionRecord[]
  tokenId: string
  attributes: string[]
  rating: number
  reviews: ReviewRecord[]
  contractAddress: string
  networkNote: string
  contractNote: string
  royaltyNote: string
  favoritesCount: number
  version: number
  createdAt: string
  updatedAt: string
}

export type UserRecord = {
  id: string
  email: string
  displayName: string
  username?: string
  ensName?: string
  walletNickname?: string
  bio: string
  avatarUrl: string | null
  passwordSalt: string
  passwordHash: string
  createdAt: string
}

export type SessionRecord = {
  token: string
  userId: string
  expiresAt: string
}

export type FavoriteRecord = {
  userId: string
  nftId: string
  createdAt: string
}

export type CartItemRecord = {
  id: string
  nftId: string
  editionId: string
  quantity: number
  addedAt: string
}

export type CartRecord = {
  ownerKey: string
  items: CartItemRecord[]
  updatedAt: string
}

export type WalletRecord = {
  id: string
  userId: string
  label: string
  address: string
  network: Network
  role: WalletRole
  connected: boolean
  updatedAt: string
  displayName?: string
  profileName?: string
  ensName?: string
  referralCode?: string
  contactEmail?: string
}

export type ReceiptLineRecord = {
  nftId: string
  editionId: string
  name: string
  editionName: string
  quantity: number
  unitPriceEth: string
  lineTotalEth: string
  tokenId?: string
  imageUrl?: string
}

export type OrderRecord = {
  id: string
  userId: string
  status: 'pending' | 'confirmed' | 'declined'
  idempotencyKey: string
  bodyHash: string
  version: number
  walletId: string
  network: Network
  txRef: string | null
  explorerUrl: string | null
  walletLabel?: string
  receipt: {
    lines: ReceiptLineRecord[]
    subtotalEth: string
    discountEth: string
    networkFeeEth: string
    totalEth: string
    couponCode: string | null
    purchasedAt: string
  }
  createdAt: string
  updatedAt: string
}

export type Database = {
  schemaVersion: 3
  users: UserRecord[]
  sessions: SessionRecord[]
  nfts: NftRecord[]
  favorites: FavoriteRecord[]
  carts: CartRecord[]
  wallets: WalletRecord[]
  orders: OrderRecord[]
  subscribers: { email: string; createdAt: string }[]
  supportTickets?: {
    id: string
    userId: string
    subject: string
    message: string
    createdAt: string
  }[]
}

const titles = [
  'Aurora Relic',
  'Harbor Static',
  'Glass Orchard',
  'Low Tide Index',
  'Velvet Meridian',
  'Paper Moon',
  'Salt Ledger',
  'Night Ferry',
  'Copper Veil',
  'Echo Terrace',
  'Kiln Study',
  'Marble Quiet',
  'Red Thread',
  'Untitled Window',
  'Field Notes',
  'Ivory Circuit',
  'Second Sun',
  'Archive Dust',
  'Blue Hour',
  'Soft Geometry',
  'Minor Key',
  'Choir Static',
  'Room Tone',
  'Last Measure',
  'Vinyl Saint',
  'Tuning Fork',
  'Boss Gate',
  'Pixel Reliquary',
  'Spawn Lantern',
  'Checksum Bloom',
  'Loot Psalm',
  'Idle Shrine',
  'Respawn Hymn',
  'Crit Window',
  'Seal of Quiet',
  'Member No. 19',
  'Guest Pass',
  'Inner Circle',
  'Keycard Dusk',
  'Patron Mark',
] as const

const prices = [
  '0.08',
  '0.12',
  '0.18',
  '0.22',
  '0.27',
  '0.35',
  '0.42',
  '0.48',
  '0.55',
  '0.64',
  '0.77',
  '0.85',
  '0.95',
  '0.99',
  '1.05',
  '1.10',
  '1.25',
  '1.40',
  '1.60',
  '1.75',
  '2.00',
  '2.20',
  '2.40',
  '2.65',
  '3.10',
  '3.30',
  '3.80',
  '4.20',
  '4.50',
  '5.25',
  '6.00',
  '6.40',
  '7.25',
  '8.00',
  '9.50',
  '11.50',
  '12.00',
  '15.75',
  '18.00',
  '0.15',
] as const

const collections = [
  { id: 'lumen-archive', name: 'Lumen Archive' },
  { id: 'north-atelier', name: 'North Atelier' },
  { id: 'night-market', name: 'Night Market' },
  { id: 'glass-circuit', name: 'Glass Circuit' },
  { id: 'choir-of-keys', name: 'Choir of Keys' },
  { id: 'member-seals', name: 'Member Seals' },
] as const

const creators = [
  'Mara Voss',
  'Leo Okonkwo',
  'Inez Calder',
  'Jonah Abebe',
  'Sable Quinn',
  'Noor El-Sayed',
  'Helena Cho',
  'Rafael Duarte',
] as const

const descriptions = [
  (name: string, collection: string, category: string) =>
    `${name} é uma obra de ${category.toLowerCase()} da coleção ${collection}. A tiragem fica fixa neste catálogo para o estoque, o preço e os filtros permanecerem determinísticos.`,
  (name: string, collection: string, category: string) =>
    `${collection} publicou ${name} como peça de ${category.toLowerCase()}, com uma edição aberta e tiragens menores para colecionadores.`,
  (name: string, collection: string, category: string) =>
    `Colecionadores usam ${name} para comparar preços de ${category.toLowerCase()} dentro de ${collection}. Os valores viajam como texto decimal em ETH.`,
  (name: string, collection: string, category: string) =>
    `${name} faz parte da série ${collection}. Os metadados de ${category.toLowerCase()} alimentam os filtros do catálogo e o canal de preço ao vivo.`,
] as const

const attributeSets = [
  ['Óculos', 'Esmeralda', 'Raro'],
  ['Chapéu', 'Violeta', 'Série'],
  ['Paletó', 'Marfim', 'Único'],
  ['Fone', 'Dourado', 'Limitado'],
  ['Capuz', 'Lilás', 'Noturno'],
] as const

const reviewAuthors = ['Marina Costa', 'Theo Almeida', 'Lia Ferreira'] as const

const reviewBodies = [
  'A cor segura a tela inteira e a ficha na rede confere com a página.',
  'Entrou na coleção pelo acabamento. A edição aberta ainda tem presença.',
  'O recorte é raro sem parecer forçado. Bom para uma coleção pequena.',
  'Preço e tiragem batem com o que o catálogo promete.',
] as const

const networkNotes = {
  ethereum: 'Cunhado na Ethereum com procedência imutável e metadados armazenados no IPFS.',
  polygon: 'Cunhado na Polygon, com a ficha de metadados publicada no IPFS.',
  solana: 'Registrado na Solana, com os metadados publicados para leitura pública.',
} as const

const catalogNetworkCycle = [
  'ethereum',
  'polygon',
  'solana',
] as const satisfies readonly CatalogNetwork[]

function categoryFor(index: number): Category {
  const counts = [6, 5, 6, 5, 4, 4, 4, 3, 3]
  let cursor = 0
  for (let bucket = 0; bucket < counts.length; bucket += 1) {
    cursor += counts[bucket] ?? 0
    if (index < cursor) return categories[bucket] ?? 'Arte digital'
  }
  return 'Arte digital'
}

function networkFor(index: number): CatalogNetwork {
  return catalogNetworkCycle[index % catalogNetworkCycle.length] ?? 'ethereum'
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function address(prefix: string): string {
  const body = `${prefix}${'0'.repeat(40)}`.slice(0, 40)
  const value = `0x${body}`
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) throw new Error(`Invalid seed address ${value}`)
  return value
}

function reviewsFor(index: number): ReviewRecord[] {
  return [0, 1, 2].map((offset) => ({
    id: `rev_${String(index + 1).padStart(2, '0')}_${offset}`,
    author: reviewAuthors[offset] ?? 'Colecionador',
    rating: [5, 4, 4][offset] ?? 4,
    body: reviewBodies[(index + offset) % reviewBodies.length] ?? reviewBodies[0],
    createdAt: new Date(Date.UTC(2025, offset, 4 + (index % 20))).toISOString(),
  }))
}

function createNfts(): NftRecord[] {
  if (titles.length !== 40 || prices.length !== 40) {
    throw new Error('The NFT seed must contain 40 titles and 40 prices.')
  }
  const origin = Date.UTC(2024, 0, 15)
  return titles.map((title, index) => {
    const priceEth = prices[index] ?? '0'
    const collection = collections[index % collections.length] ?? collections[0]
    const category = categoryFor(index)
    const creator = creators[index % creators.length] ?? creators[0]
    const id = `nft_${String(index + 1).padStart(2, '0')}`
    const createdAt = new Date(origin + index * 10 * 24 * 60 * 60 * 1000).toISOString()
    const editions: EditionRecord[] = [
      {
        id: `${id}_open`,
        name: 'ABERTA',
        label: 'ABERTA',
        supply: 80,
        remaining: 8 + (index % 17),
        priceEth,
      },
      {
        id: `${id}_1`,
        name: '1/1',
        label: '1/1',
        supply: 1,
        remaining: index % 5 === 0 ? 0 : 1,
        priceEth: mulEth(priceEth, 8),
      },
      {
        id: `${id}_10`,
        name: '1/10',
        label: '1/10',
        supply: 10,
        remaining: 2 + (index % 6),
        priceEth: mulEth(priceEth, 3),
      },
      {
        id: `${id}_50`,
        name: '1/50',
        label: '1/50',
        supply: 50,
        remaining: 5 + (index % 12),
        priceEth: mulEth(priceEth, '1.5'),
      },
    ]
    const reviews = reviewsFor(index)
    const rating =
      Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) /
      10
    const network = networkFor(index)
    return {
      id,
      slug: slugify(title),
      name: title,
      description:
        descriptions[index % descriptions.length]?.(title, collection.name, category) ?? title,
      collectionId: collection.id,
      collectionName: collection.name,
      category,
      network,
      creator,
      imageHue: (index * 37) % 360,
      priceEth,
      previousPriceEth: index % 4 === 2 ? mulEth(priceEth, '1.15') : null,
      rarity: index % 4 === 2 ? 'raro' : 'comum',
      editions,
      tokenId: `#${String(index + 1).padStart(4, '0')}`,
      attributes: [...(attributeSets[index % attributeSets.length] ?? attributeSets[0])],
      rating,
      reviews,
      contractAddress: address(index.toString(16).padStart(8, 'a')),
      networkNote: networkNotes[network],
      contractNote:
        'Contrato inteligente verificado. Os metadados públicos repetem a ficha desta página.',
      royaltyNote: `${creator} recebe 5% de direitos autorais nas vendas secundárias, pagos pelos mercados compatíveis.`,
      favoritesCount: (index * 3) % 28,
      version: 1,
      createdAt,
      updatedAt: createdAt,
    }
  })
}

export function createSeed(): Database {
  const createdAt = '2024-03-01T12:00:00.000Z'
  return {
    schemaVersion: 3,
    users: [
      {
        id: 'user_ada',
        email: 'ada@collector.dev',
        displayName: 'Ada Marlowe',
        username: 'ada',
        ensName: 'ada',
        walletNickname: 'Studio vault',
        bio: 'Collects photographic editions and night scenes.',
        avatarUrl: null,
        passwordSalt: '0a11ceada0c0ffee01b0a7edc0ffee42',
        passwordHash: '55dcb69a75dffe472ed23eacbb04c1f3f355c7a3069f3b53f494b510c914914a',
        createdAt,
      },
      {
        id: 'user_leo',
        email: 'leo@collector.dev',
        displayName: 'Leo Okonkwo',
        username: 'leo',
        ensName: 'leo',
        walletNickname: 'Gallery desk',
        bio: 'Follows generative collections and small artist proofs.',
        avatarUrl: null,
        passwordSalt: '1e00c0ffee0b0a7ed5a17ed4e0c0ffee',
        passwordHash: 'b5a77627c4e47edca1461d0b76712615f60f6b7fde3d2870f6453b05e5cf265f',
        createdAt,
      },
    ],
    sessions: [],
    nfts: createNfts(),
    favorites: [
      { userId: 'user_ada', nftId: 'nft_01', createdAt },
      { userId: 'user_ada', nftId: 'nft_04', createdAt },
      { userId: 'user_ada', nftId: 'nft_12', createdAt },
      { userId: 'user_leo', nftId: 'nft_02', createdAt },
      { userId: 'user_leo', nftId: 'nft_21', createdAt },
    ],
    carts: [],
    wallets: [
      {
        id: 'wal_ada_primary',
        userId: 'user_ada',
        label: 'Studio vault',
        address: address('ada1'),
        network: 'ethereum',
        role: 'primary',
        connected: true,
        updatedAt: createdAt,
        displayName: 'Ada Marlowe',
        profileName: 'ada',
        ensName: 'ada',
        referralCode: 'KURIO',
        contactEmail: 'ada@collector.dev',
      },
      {
        id: 'wal_ada_secondary',
        userId: 'user_ada',
        label: 'Travel key',
        address: address('ada2'),
        network: 'base',
        role: 'secondary',
        connected: false,
        updatedAt: createdAt,
        displayName: 'Ada Marlowe',
        profileName: 'ada',
        ensName: 'ada',
        referralCode: 'KURIO',
        contactEmail: 'ada@collector.dev',
      },
      {
        id: 'wal_leo_primary',
        userId: 'user_leo',
        label: 'Gallery desk',
        address: address('1e0'),
        network: 'polygon',
        role: 'primary',
        connected: true,
        updatedAt: createdAt,
        displayName: 'Leo Okonkwo',
        profileName: 'leo',
        ensName: 'leo',
        referralCode: 'KURIO',
        contactEmail: 'leo@collector.dev',
      },
    ],
    orders: [],
    subscribers: [],
  }
}

export function imageFor(nft: NftRecord): string {
  return nftImageUrl(nft.name, nft.collectionName, nft.imageHue)
}

export function galleryFor(nft: NftRecord): string[] {
  return [0, 1, 2, 3].map((frame) => nftImageUrl(nft.name, nft.collectionName, nft.imageHue, frame))
}
