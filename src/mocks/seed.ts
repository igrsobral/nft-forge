import type { Category, Network, WalletRole } from '@/contracts/common'
import { mulEth } from '@/lib/money'
import { nftImageUrl } from './images'

export type EditionRecord = {
  id: string
  name: string
  supply: number
  remaining: number
  priceEth: string
}

export type NftRecord = {
  id: string
  slug: string
  name: string
  description: string
  collectionId: string
  collectionName: string
  category: Category
  creator: string
  imageHue: number
  priceEth: string
  editions: EditionRecord[]
  favoritesCount: number
  version: number
  createdAt: string
  updatedAt: string
}

export type UserRecord = {
  id: string
  email: string
  displayName: string
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
}

export type ReceiptLineRecord = {
  nftId: string
  editionId: string
  name: string
  editionName: string
  quantity: number
  unitPriceEth: string
  lineTotalEth: string
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
  schemaVersion: 1
  users: UserRecord[]
  sessions: SessionRecord[]
  nfts: NftRecord[]
  favorites: FavoriteRecord[]
  carts: CartRecord[]
  wallets: WalletRecord[]
  orders: OrderRecord[]
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
    `${name} is a ${category.toLowerCase()} edition from ${collection}. The print run is fixed in this mock catalog so stock, price, and filters stay deterministic.`,
  (name: string, collection: string, category: string) =>
    `${collection} released ${name} as a ${category.toLowerCase()} work with a public edition and, on some pieces, a smaller artist proof.`,
  (name: string, collection: string, category: string) =>
    `Collectors use ${name} to compare ${category.toLowerCase()} pricing inside ${collection}. Values are decimal ETH strings, not floating-point numbers.`,
  (name: string, collection: string, category: string) =>
    `${name} sits in the ${collection} series. Its ${category.toLowerCase()} metadata is what the catalog filters and the live price channel both key off.`,
] as const

function categoryFor(index: number): Category {
  if (index < 10) return 'Photography'
  if (index < 20) return 'Art'
  if (index < 26) return 'Music'
  if (index < 34) return 'Gaming'
  return 'Membership'
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
        name: 'Open edition',
        supply: 80,
        remaining: 8 + (index % 17),
        priceEth,
      },
    ]
    if (index % 3 !== 0) {
      editions.push({
        id: `${id}_proof`,
        name: 'Artist proof',
        supply: 5,
        remaining: index % 7 === 0 ? 0 : 1 + (index % 4),
        priceEth: mulEth(priceEth, 3),
      })
    }
    return {
      id,
      slug: slugify(title),
      name: title,
      description:
        descriptions[index % descriptions.length]?.(title, collection.name, category) ?? title,
      collectionId: collection.id,
      collectionName: collection.name,
      category,
      creator,
      imageHue: (index * 37) % 360,
      priceEth,
      editions,
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
    schemaVersion: 1,
    users: [
      {
        id: 'user_ada',
        email: 'ada@collector.dev',
        displayName: 'Ada Marlowe',
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
      },
    ],
    orders: [],
  }
}

export function imageFor(nft: NftRecord): string {
  return nftImageUrl(nft.name, nft.collectionName, nft.imageHue)
}
