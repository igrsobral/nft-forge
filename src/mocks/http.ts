import type { NftListQuery } from '@/contracts/catalog'
import { nftDetailSchema, nftListQuerySchema, nftListResponseSchema } from '@/contracts/catalog'
import {
  authResponseSchema,
  avatarUpdateSchema,
  loginBodySchema,
  passwordChangeSchema,
  profileUpdateSchema,
  publicUserSchema,
  sessionResponseSchema,
  signupBodySchema,
  walletListSchema,
  walletConnectionSchema,
  walletSchema,
  walletWriteSchema,
} from '@/contracts/account'
import {
  cartAddSchema,
  cartSchema,
  cartUpdateSchema,
  createOrderSchema,
  favoriteListSchema,
  favoriteWriteSchema,
  newsletterResponseSchema,
  newsletterSubscribeSchema,
  orderSchema,
  quoteRequestSchema,
  quoteSchema,
} from '@/contracts/commerce'
import type { ErrorCode, FieldError } from '@/contracts/common'
import { catalogNetworks, categories } from '@/contracts/common'
import { addEth, cmpEth, mulEth } from '@/lib/money'
import { HttpResponse, http } from 'msw'
import type { z } from 'zod'
import { getDb, persist, resetDb } from './db'
import { delay, pause } from './delay'
import { canonicalJson, sha256 } from './hash'
import { hashPassword, randomSalt, verifyPassword } from './password'
import { findEdition, findNft, quoteCart, totalsMatch } from './pricing'
import { getScenario, isScenario, setScenario, type Scenario } from './scenario'
import {
  galleryFor,
  imageFor,
  type CartRecord,
  type Database,
  type NftRecord,
  type OrderRecord,
  type UserRecord,
} from './seed'
import { publishNft, publishOrder } from './socket'

type Gate =
  | { ok: false; response: Response }
  | { ok: true; db: Database; user: UserRecord | null; scenario: Scenario }

function apiError(status: number, code: ErrorCode, message: string, details: FieldError[] = []) {
  return HttpResponse.json(
    { error: { code, message, details, requestId: crypto.randomUUID() } },
    { status },
  )
}

function zodDetails(error: z.ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : 'body',
    message: issue.message,
  }))
}

async function readJson(request: Request): Promise<unknown> {
  const text = await request.text()
  if (!text) return undefined
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}

function resolveUser(db: Database, token: string): UserRecord | null {
  const session = db.sessions.find((item) => item.token === token)
  if (!session || Date.parse(session.expiresAt) <= Date.now()) return null
  return db.users.find((user) => user.id === session.userId) ?? null
}

async function gate(request: Request, auth: 'public' | 'required' = 'public'): Promise<Gate> {
  const scenario = getScenario()
  if (scenario === 'offline') return { ok: false, response: HttpResponse.error() }
  await pause(request, scenario)
  if (scenario === 'http_error') {
    return {
      ok: false,
      response: apiError(503, 'transient', 'The marketplace is temporarily unavailable.'),
    }
  }
  const db = getDb()
  const token = bearerToken(request)
  if (scenario === 'expired_session' && token) {
    return {
      ok: false,
      response: apiError(
        401,
        'invalid_session',
        'Your session has expired. Sign in again to continue.',
      ),
    }
  }
  const user = token ? resolveUser(db, token) : null
  if (token && !user) {
    return {
      ok: false,
      response: apiError(401, 'invalid_session', 'Your session is no longer valid.'),
    }
  }
  if (auth === 'required' && !user) {
    return { ok: false, response: apiError(401, 'invalid_session', 'Sign in to continue.') }
  }
  if (auth === 'required' && user && scenario === 'unauthorized') {
    return {
      ok: false,
      response: apiError(403, 'forbidden', 'You do not have permission to do that.'),
    }
  }
  return { ok: true, db, user, scenario }
}

function requireUser(result: Gate): UserRecord | Response {
  if (!result.ok) return result.response
  if (!result.user) return apiError(401, 'invalid_session', 'Sign in to continue.')
  return result.user
}

function presentUser(user: UserRecord) {
  return publicUserSchema.parse({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  })
}

function presentSummary(nft: NftRecord) {
  return {
    id: nft.id,
    slug: nft.slug,
    name: nft.name,
    collectionId: nft.collectionId,
    collectionName: nft.collectionName,
    category: nft.category,
    network: nft.network,
    creator: nft.creator,
    priceEth: nft.priceEth,
    previousPriceEth: nft.previousPriceEth,
    imageUrl: imageFor(nft),
    available: nft.editions.some((edition) => edition.remaining > 0),
    version: nft.version,
    updatedAt: nft.updatedAt,
  }
}

function presentDetail(nft: NftRecord) {
  return nftDetailSchema.parse({
    ...presentSummary(nft),
    description: nft.description,
    editions: nft.editions,
    favoritesCount: nft.favoritesCount,
    createdAt: nft.createdAt,
    tokenId: nft.tokenId,
    attributes: nft.attributes,
    rating: nft.rating,
    reviewCount: nft.reviews.length,
    reviews: nft.reviews,
    gallery: galleryFor(nft),
    contractAddress: nft.contractAddress,
    networkNote: nft.networkNote,
    contractNote: nft.contractNote,
    royaltyNote: nft.royaltyNote,
  })
}

function presentWallet(wallet: Database['wallets'][number]) {
  return walletSchema.parse({
    id: wallet.id,
    label: wallet.label,
    address: wallet.address,
    network: wallet.network,
    role: wallet.role,
    connected: wallet.connected,
    updatedAt: wallet.updatedAt,
  })
}

function presentCart(db: Database, cart: CartRecord) {
  return cartSchema.parse({
    ownerKey: cart.ownerKey,
    updatedAt: cart.updatedAt,
    items: cart.items.flatMap((item) => {
      const nft = findNft(db.nfts, item.nftId)
      const edition = nft ? findEdition(nft, item.editionId) : undefined
      if (!nft || !edition) return []
      return [
        {
          id: item.id,
          nftId: nft.id,
          editionId: edition.id,
          name: nft.name,
          editionName: edition.name,
          imageUrl: imageFor(nft),
          quantity: item.quantity,
          unitPriceEth: edition.priceEth,
          lineTotalEth: mulEth(edition.priceEth, item.quantity),
          remaining: edition.remaining,
          version: nft.version,
          changed: false,
        },
      ]
    }),
  })
}

function presentOrder(order: OrderRecord) {
  return orderSchema.parse({
    id: order.id,
    status: order.status,
    version: order.version,
    walletId: order.walletId,
    network: order.network,
    txRef: order.txRef,
    explorerUrl: order.explorerUrl,
    receipt: order.receipt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  })
}

function ownerKeyFor(user: UserRecord | null, request: Request): string | null {
  if (user) return `user:${user.id}`
  const guestId = request.headers.get('X-Guest-Id')
  if (!guestId || !/^[\w-]{8,80}$/.test(guestId)) return null
  return `guest:${guestId}`
}

function ensureCart(db: Database, ownerKey: string): CartRecord {
  const existing = db.carts.find((cart) => cart.ownerKey === ownerKey)
  if (existing) return existing
  const created: CartRecord = { ownerKey, items: [], updatedAt: new Date().toISOString() }
  db.carts.push(created)
  return created
}

function issueSession(db: Database, user: UserRecord, scenario: Scenario) {
  const token = crypto.randomUUID()
  const expiresAt =
    scenario === 'expired_session'
      ? new Date(Date.now() - 1000).toISOString()
      : new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
  db.sessions.push({ token, userId: user.id, expiresAt })
  return authResponseSchema.parse({ user: presentUser(user), session: { expiresAt }, token })
}

function mergeGuestCart(db: Database, userId: string, request: Request) {
  const guestId = request.headers.get('X-Guest-Id')
  if (!guestId) return
  const guest = db.carts.find((cart) => cart.ownerKey === `guest:${guestId}`)
  if (!guest || guest.items.length === 0) return
  const cart = ensureCart(db, `user:${userId}`)
  for (const item of guest.items) {
    const nft = findNft(db.nfts, item.nftId)
    const edition = nft ? findEdition(nft, item.editionId) : undefined
    if (!edition) continue
    const existing = cart.items.find(
      (entry) => entry.nftId === item.nftId && entry.editionId === item.editionId,
    )
    const nextQuantity = Math.min(edition.remaining, (existing?.quantity ?? 0) + item.quantity)
    if (nextQuantity <= 0) continue
    if (existing) existing.quantity = nextQuantity
    else cart.items.push({ ...item, id: crypto.randomUUID(), quantity: nextQuantity })
  }
  guest.items = []
  cart.updatedAt = new Date().toISOString()
}

const networkLabels = { ethereum: 'Ethereum', polygon: 'Polygon', solana: 'Solana' } as const

function facets(nfts: NftRecord[]) {
  let min = nfts[0]?.priceEth ?? '0'
  let max = min
  for (const nft of nfts) {
    if (cmpEth(nft.priceEth, min) < 0) min = nft.priceEth
    if (cmpEth(nft.priceEth, max) > 0) max = nft.priceEth
  }
  return {
    categories: categories.map((category) => ({
      value: category,
      label: category,
      count: nfts.filter((nft) => nft.category === category).length,
    })),
    collections: [
      ...new Map(nfts.map((nft) => [nft.collectionId, nft.collectionName])).entries(),
    ].map(([value, label]) => ({
      value,
      label,
      count: nfts.filter((nft) => nft.collectionId === value).length,
    })),
    networks: catalogNetworks.map((network) => ({
      value: network,
      label: networkLabels[network],
      count: nfts.filter((nft) => nft.network === network).length,
    })),
    price: { min, max },
  }
}

function applyTab(nfts: NftRecord[], tab: NftListQuery['tab']): NftRecord[] {
  if (tab === 'new') {
    const newest = [...nfts].sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    )
    const cutoff = newest[Math.min(11, Math.max(0, newest.length - 1))]?.createdAt
    return cutoff ? nfts.filter((nft) => nft.createdAt >= cutoff) : nfts
  }
  if (tab === 'trending') return nfts.filter((nft) => nft.favoritesCount >= 12)
  return nfts
}

function featuredNft(nfts: NftRecord[]): NftRecord | null {
  return nfts.reduce<NftRecord | null>((best, nft) => {
    if (!best || nft.favoritesCount > best.favoritesCount) return nft
    return best
  }, null)
}

function sortNfts(items: NftRecord[], sort: NftListQuery['sort']): NftRecord[] {
  return [...items].sort((left, right) => {
    if (sort === 'price_asc') return cmpEth(left.priceEth, right.priceEth)
    if (sort === 'price_desc') return cmpEth(right.priceEth, left.priceEth)
    if (sort === 'name_asc') return left.name.localeCompare(right.name)
    return Date.parse(right.createdAt) - Date.parse(left.createdAt)
  })
}

function txRefFor(orderId: string): string {
  return `0x${orderId.replace(/-/g, '').padEnd(64, 'a').slice(0, 64)}`
}

function confirmOrder(db: Database, order: OrderRecord): boolean {
  for (const line of order.receipt.lines) {
    const nft = findNft(db.nfts, line.nftId)
    const edition = nft ? findEdition(nft, line.editionId) : undefined
    if (!edition || edition.remaining < line.quantity) return false
  }
  const now = new Date().toISOString()
  for (const line of order.receipt.lines) {
    const nft = findNft(db.nfts, line.nftId)
    const edition = nft ? findEdition(nft, line.editionId) : undefined
    if (!nft || !edition) return false
    edition.remaining -= line.quantity
    nft.version += 1
    nft.updatedAt = now
    nft.priceEth = nft.editions[0]?.priceEth ?? nft.priceEth
  }
  const cart = db.carts.find((item) => item.ownerKey === `user:${order.userId}`)
  if (cart) {
    for (const line of order.receipt.lines) {
      const item = cart.items.find(
        (entry) => entry.nftId === line.nftId && entry.editionId === line.editionId,
      )
      if (!item) continue
      item.quantity -= line.quantity
    }
    cart.items = cart.items.filter((item) => item.quantity > 0)
    cart.updatedAt = now
  }
  return true
}

function scheduleResolution(orderId: string, scenario: Scenario) {
  const wait = scenario === 'payment_declined' ? 800 : 700
  window.setTimeout(() => {
    const db = getDb()
    const order = db.orders.find((item) => item.id === orderId)
    if (!order || order.status !== 'pending') return
    if (scenario === 'payment_declined') {
      order.status = 'declined'
    } else if (confirmOrder(db, order)) {
      order.status = 'confirmed'
      order.txRef = txRefFor(order.id)
      order.explorerUrl = `https://explorer.atelier.test/tx/${order.txRef}`
    } else {
      order.status = 'declined'
    }
    order.version += 1
    order.updatedAt = new Date().toISOString()
    persist(db)
    publishOrder(order)
    if (order.status === 'confirmed') {
      for (const line of order.receipt.lines) {
        const nft = findNft(db.nfts, line.nftId)
        if (nft) publishNft(nft)
      }
    }
  }, wait)
}

function markAvailability(db: Database, cart: CartRecord, scenario: Scenario) {
  const now = new Date().toISOString()
  for (const item of cart.items) {
    const nft = findNft(db.nfts, item.nftId)
    if (!nft) continue
    if (scenario === 'price_changed') {
      const edition = nft.editions[0]
      if (!edition) continue
      const next = addEth(edition.priceEth, '0.25')
      edition.priceEth = next
      nft.priceEth = next
    }
    if (scenario === 'sold_out') {
      const edition = findEdition(nft, item.editionId)
      if (edition) edition.remaining = 0
    }
    nft.version += 1
    nft.updatedAt = now
    publishNft(nft)
  }
  persist(db)
}

export const httpHandlers = [
  http.post('/api/newsletter', async ({ request }) => {
    const result = await gate(request)
    if (!result.ok) return result.response
    const parsed = newsletterSubscribeSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return apiError(422, 'validation', 'Informe um e-mail válido.', zodDetails(parsed.error))
    }
    const email = parsed.data.email.toLowerCase()
    if (!result.db.subscribers.some((item) => item.email === email)) {
      result.db.subscribers.push({ email, createdAt: new Date().toISOString() })
      persist(result.db)
    }
    return HttpResponse.json(newsletterResponseSchema.parse({ ok: true }))
  }),

  http.post('/api/dev/reset', () => {
    resetDb()
    return HttpResponse.json({ ok: true })
  }),

  http.post('/api/dev/scenario', async ({ request }) => {
    const body = await readJson(request)
    const scenario =
      typeof body === 'object' && body !== null && 'scenario' in body ? body.scenario : undefined
    if (typeof scenario !== 'string' || !isScenario(scenario)) {
      return apiError(422, 'validation', 'Choose a known scenario.', [
        { path: 'scenario', message: 'Unknown scenario.' },
      ])
    }
    setScenario(scenario)
    return HttpResponse.json({ scenario })
  }),

  http.post('/api/dev/nfts/:nftId/tick', ({ params }) => {
    const db = getDb()
    const nftId = String(params.nftId)
    const nft = findNft(db.nfts, nftId)
    const edition = nft?.editions[0]
    if (!nft || !edition) return apiError(404, 'not_found', 'That edition could not be found.')
    const next = addEth(edition.priceEth, '0.05')
    edition.priceEth = next
    nft.priceEth = next
    nft.version += 1
    nft.updatedAt = new Date().toISOString()
    persist(db)
    publishNft(nft)
    return HttpResponse.json({ ok: true, version: nft.version, priceEth: nft.priceEth })
  }),

  http.post('/api/auth/signup', async ({ request }) => {
    const result = await gate(request)
    if (!result.ok) return result.response
    const parsed = signupBodySchema.safeParse(await readJson(request))
    if (!parsed.success)
      return apiError(422, 'validation', 'Check the account details.', zodDetails(parsed.error))
    if (
      result.scenario === 'signup_conflict' ||
      result.db.users.some((user) => user.email.toLowerCase() === parsed.data.email.toLowerCase())
    ) {
      return apiError(409, 'conflict', 'An account with this email already exists.', [
        { path: 'email', message: 'This email is already registered.' },
      ])
    }
    const now = new Date().toISOString()
    const passwordSalt = randomSalt()
    const user: UserRecord = {
      id: crypto.randomUUID(),
      email: parsed.data.email.toLowerCase(),
      displayName: parsed.data.displayName.trim(),
      bio: '',
      avatarUrl: null,
      passwordSalt,
      passwordHash: await hashPassword(parsed.data.password, passwordSalt),
      createdAt: now,
    }
    result.db.users.push(user)
    mergeGuestCart(result.db, user.id, request)
    const response = issueSession(result.db, user, result.scenario)
    persist(result.db)
    return HttpResponse.json(response, { status: 201 })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const result = await gate(request)
    if (!result.ok) return result.response
    const parsed = loginBodySchema.safeParse(await readJson(request))
    if (!parsed.success)
      return apiError(422, 'validation', 'Enter your email and password.', zodDetails(parsed.error))
    const user = result.db.users.find(
      (item) => item.email.toLowerCase() === parsed.data.email.toLowerCase(),
    )
    const valid = user
      ? await verifyPassword(parsed.data.password, user.passwordSalt, user.passwordHash)
      : false
    if (!user || !valid) {
      return apiError(401, 'invalid_session', 'Email or password is incorrect.')
    }
    mergeGuestCart(result.db, user.id, request)
    const response = issueSession(result.db, user, result.scenario)
    persist(result.db)
    return HttpResponse.json(response)
  }),

  http.post('/api/auth/logout', ({ request }) => {
    const db = getDb()
    const token = bearerToken(request)
    if (token) db.sessions = db.sessions.filter((session) => session.token !== token)
    persist(db)
    return HttpResponse.json({ ok: true })
  }),

  http.get('/api/auth/session', async ({ request }) => {
    const result = await gate(request)
    if (!result.ok) return result.response
    if (!result.user)
      return HttpResponse.json(sessionResponseSchema.parse({ user: null, session: null }))
    const token = bearerToken(request)
    const session = result.db.sessions.find((item) => item.token === token)
    return HttpResponse.json(
      sessionResponseSchema.parse({
        user: presentUser(result.user),
        session: { expiresAt: session?.expiresAt ?? new Date().toISOString() },
      }),
    )
  }),

  http.get('/api/nfts', async ({ request }) => {
    const result = await gate(request)
    if (!result.ok) return result.response
    const params = Object.fromEntries(new URL(request.url).searchParams.entries())
    const parsed = nftListQuerySchema.safeParse(params)
    if (!parsed.success)
      return apiError(422, 'validation', 'Those filters are not valid.', zodDetails(parsed.error))
    const query = parsed.data
    if (result.scenario === 'empty') {
      return HttpResponse.json(
        nftListResponseSchema.parse({
          items: [],
          page: query.page,
          pageSize: query.pageSize,
          total: 0,
          totalPages: 0,
          facets: facets(result.db.nfts),
          featured: null,
        }),
      )
    }
    const scoped = applyTab(result.db.nfts, query.tab)
    const filtered = scoped.filter((nft) => {
      if (query.q) {
        const haystack =
          `${nft.name} ${nft.creator} ${nft.collectionName} ${nft.description}`.toLowerCase()
        if (!haystack.includes(query.q.toLowerCase())) return false
      }
      if (query.collection && nft.collectionId !== query.collection) return false
      if (query.category && nft.category !== query.category) return false
      if (query.network && nft.network !== query.network) return false
      if (query.minPrice && cmpEth(nft.priceEth, query.minPrice) < 0) return false
      if (query.maxPrice && cmpEth(nft.priceEth, query.maxPrice) > 0) return false
      const inStock = nft.editions.some((edition) => edition.remaining > 0)
      if (query.inStock === true && !inStock) return false
      if (query.inStock === false && inStock) return false
      return true
    })
    const sorted = sortNfts(filtered, query.sort)
    const total = sorted.length
    const totalPages = total === 0 ? 0 : Math.ceil(total / query.pageSize)
    const start = (query.page - 1) * query.pageSize
    return HttpResponse.json(
      nftListResponseSchema.parse({
        items: sorted.slice(start, start + query.pageSize).map(presentSummary),
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
        facets: facets(result.db.nfts),
        featured: (() => {
          const featured = featuredNft(result.db.nfts)
          return featured ? presentSummary(featured) : null
        })(),
      }),
    )
  }),

  http.get('/api/nfts/:nftId', async ({ request, params }) => {
    const result = await gate(request)
    if (!result.ok) return result.response
    const nft = findNft(result.db.nfts, String(params.nftId))
    if (!nft) return apiError(404, 'not_found', 'That edition could not be found.')
    return HttpResponse.json(presentDetail(nft))
  }),

  http.get('/api/favorites', async ({ request }) => {
    const result = await gate(request, 'required')
    const user = requireUser(result)
    if (user instanceof Response) return user
    const ids = result.ok
      ? result.db.favorites.filter((item) => item.userId === user.id).map((item) => item.nftId)
      : []
    return HttpResponse.json(favoriteListSchema.parse({ nftIds: ids }))
  }),

  http.post('/api/favorites', async ({ request }) => {
    const result = await gate(request, 'required')
    const user = requireUser(result)
    if (user instanceof Response) return user
    if (!result.ok) return result.response
    const parsed = favoriteWriteSchema.safeParse(await readJson(request))
    if (!parsed.success)
      return apiError(422, 'validation', 'Choose an edition to save.', zodDetails(parsed.error))
    const nft = findNft(result.db.nfts, parsed.data.nftId)
    if (!nft) return apiError(404, 'not_found', 'That edition could not be found.')
    const exists = result.db.favorites.some(
      (item) => item.userId === user.id && item.nftId === nft.id,
    )
    if (!exists) {
      result.db.favorites.push({
        userId: user.id,
        nftId: nft.id,
        createdAt: new Date().toISOString(),
      })
      nft.favoritesCount += 1
      persist(result.db)
    }
    const ids = result.db.favorites
      .filter((item) => item.userId === user.id)
      .map((item) => item.nftId)
    return HttpResponse.json(favoriteListSchema.parse({ nftIds: ids }), {
      status: exists ? 200 : 201,
    })
  }),

  http.delete('/api/favorites/:nftId', async ({ request, params }) => {
    const result = await gate(request, 'required')
    const user = requireUser(result)
    if (user instanceof Response) return user
    if (!result.ok) return result.response
    const nftId = String(params.nftId)
    const nft = findNft(result.db.nfts, nftId)
    if (!nft) return apiError(404, 'not_found', 'That edition could not be found.')
    const before = result.db.favorites.length
    result.db.favorites = result.db.favorites.filter(
      (item) => !(item.userId === user.id && item.nftId === nftId),
    )
    if (result.db.favorites.length !== before)
      nft.favoritesCount = Math.max(0, nft.favoritesCount - 1)
    persist(result.db)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/cart', async ({ request }) => {
    const result = await gate(request)
    if (!result.ok) return result.response
    const ownerKey = ownerKeyFor(result.user, request)
    if (!ownerKey) return apiError(422, 'validation', 'A guest id is required to keep a cart.')
    const cart = ensureCart(result.db, ownerKey)
    persist(result.db)
    return HttpResponse.json(presentCart(result.db, cart))
  }),

  http.post('/api/cart/items', async ({ request }) => {
    const result = await gate(request)
    if (!result.ok) return result.response
    const parsed = cartAddSchema.safeParse(await readJson(request))
    if (!parsed.success)
      return apiError(
        422,
        'validation',
        'Check the edition and quantity.',
        zodDetails(parsed.error),
      )
    const ownerKey = ownerKeyFor(result.user, request)
    if (!ownerKey) return apiError(422, 'validation', 'A guest id is required to keep a cart.')
    const nft = findNft(result.db.nfts, parsed.data.nftId)
    const edition = nft ? findEdition(nft, parsed.data.editionId) : undefined
    if (!nft || !edition) return apiError(404, 'not_found', 'That edition could not be found.')
    const cart = ensureCart(result.db, ownerKey)
    const existing = cart.items.find(
      (item) => item.nftId === nft.id && item.editionId === edition.id,
    )
    const nextQuantity = (existing?.quantity ?? 0) + parsed.data.quantity
    if (edition.remaining < nextQuantity) {
      return apiError(409, 'availability_conflict', 'Not enough editions remain.', [
        { path: 'quantity', message: `${edition.remaining} remaining.` },
      ])
    }
    if (existing) existing.quantity = nextQuantity
    else {
      cart.items.push({
        id: crypto.randomUUID(),
        nftId: nft.id,
        editionId: edition.id,
        quantity: parsed.data.quantity,
        addedAt: new Date().toISOString(),
      })
    }
    cart.updatedAt = new Date().toISOString()
    persist(result.db)
    return HttpResponse.json(presentCart(result.db, cart), { status: existing ? 200 : 201 })
  }),

  http.patch('/api/cart/items/:itemId', async ({ request, params }) => {
    const result = await gate(request)
    if (!result.ok) return result.response
    const parsed = cartUpdateSchema.safeParse(await readJson(request))
    if (!parsed.success)
      return apiError(422, 'validation', 'Enter a quantity.', zodDetails(parsed.error))
    const ownerKey = ownerKeyFor(result.user, request)
    if (!ownerKey) return apiError(422, 'validation', 'A guest id is required to keep a cart.')
    const cart = ensureCart(result.db, ownerKey)
    const item = cart.items.find((entry) => entry.id === String(params.itemId))
    if (!item) return apiError(404, 'not_found', 'That cart item could not be found.')
    const nft = findNft(result.db.nfts, item.nftId)
    const edition = nft ? findEdition(nft, item.editionId) : undefined
    if (!nft || !edition) return apiError(404, 'not_found', 'That edition could not be found.')
    if (edition.remaining < parsed.data.quantity) {
      return apiError(409, 'availability_conflict', 'Not enough editions remain.', [
        { path: 'quantity', message: `${edition.remaining} remaining.` },
      ])
    }
    item.quantity = parsed.data.quantity
    cart.updatedAt = new Date().toISOString()
    persist(result.db)
    return HttpResponse.json(presentCart(result.db, cart))
  }),

  http.delete('/api/cart/items/:itemId', async ({ request, params }) => {
    const result = await gate(request)
    if (!result.ok) return result.response
    const ownerKey = ownerKeyFor(result.user, request)
    if (!ownerKey) return apiError(422, 'validation', 'A guest id is required to keep a cart.')
    const cart = ensureCart(result.db, ownerKey)
    const before = cart.items.length
    cart.items = cart.items.filter((item) => item.id !== String(params.itemId))
    if (cart.items.length === before)
      return apiError(404, 'not_found', 'That cart item could not be found.')
    cart.updatedAt = new Date().toISOString()
    persist(result.db)
    return HttpResponse.json(presentCart(result.db, cart))
  }),

  http.post('/api/quotes', async ({ request }) => {
    const result = await gate(request)
    if (!result.ok) return result.response
    const parsed = quoteRequestSchema.safeParse(await readJson(request))
    if (!parsed.success)
      return apiError(422, 'validation', 'Check the coupon.', zodDetails(parsed.error))
    const ownerKey = ownerKeyFor(result.user, request)
    if (!ownerKey) return apiError(422, 'validation', 'A guest id is required to quote a cart.')
    const cart = ensureCart(result.db, ownerKey)
    return HttpResponse.json(
      quoteSchema.parse(quoteCart(result.db.nfts, cart, parsed.data.couponCode, result.scenario)),
    )
  }),

  http.post('/api/orders', async ({ request }) => {
    const result = await gate(request, 'required')
    const user = requireUser(result)
    if (user instanceof Response) return user
    if (!result.ok) return result.response
    const idempotencyKey = request.headers.get('Idempotency-Key')?.trim()
    if (!idempotencyKey) {
      return apiError(422, 'validation', 'Retrying a purchase needs an Idempotency-Key header.', [
        { path: 'Idempotency-Key', message: 'Header is required.' },
      ])
    }
    const parsed = createOrderSchema.safeParse(await readJson(request))
    if (!parsed.success)
      return apiError(
        422,
        'validation',
        'Review the order before sending it.',
        zodDetails(parsed.error),
      )
    const bodyHash = await sha256(canonicalJson(parsed.data))
    const existing = result.db.orders.find(
      (order) => order.userId === user.id && order.idempotencyKey === idempotencyKey,
    )
    if (existing) {
      if (existing.bodyHash !== bodyHash) {
        return apiError(
          409,
          'conflict',
          'This idempotency key was already used for a different order.',
        )
      }
      return HttpResponse.json(presentOrder(existing))
    }
    const cart = ensureCart(result.db, `user:${user.id}`)
    if (cart.items.length === 0) {
      return apiError(422, 'validation', 'Your cart is empty.', [
        { path: 'cart', message: 'Add an edition first.' },
      ])
    }
    if (result.scenario === 'price_changed' || result.scenario === 'sold_out') {
      markAvailability(result.db, cart, result.scenario)
      return apiError(
        409,
        'availability_conflict',
        result.scenario === 'price_changed'
          ? 'The price changed. Review the updated total before confirming.'
          : 'An edition in your cart just sold out.',
      )
    }
    const quote = quoteCart(result.db.nfts, cart, parsed.data.couponCode, result.scenario)
    if (parsed.data.couponCode && quote.coupon && !quote.coupon.valid) {
      return apiError(422, 'validation', 'That coupon cannot be applied.', [
        {
          path: 'couponCode',
          message:
            quote.coupon.reason === 'expired'
              ? 'This coupon has expired.'
              : 'This coupon is not valid.',
        },
      ])
    }
    if (!quote.availabilityOk) {
      return apiError(
        409,
        'availability_conflict',
        'Availability changed. Review your cart before confirming.',
        quote.issues.map((issue) => ({
          path: issue.editionId ?? issue.nftId,
          message: issue.message,
        })),
      )
    }
    if (!totalsMatch(quote.totalEth, parsed.data.expectedTotalEth)) {
      return apiError(
        409,
        'availability_conflict',
        'The total changed. Review the updated quote before confirming.',
        [{ path: 'expectedTotalEth', message: `Current total is ${quote.totalEth} ETH.` }],
      )
    }
    const wallet = result.db.wallets.find(
      (item) => item.id === parsed.data.walletId && item.userId === user.id,
    )
    if (!wallet) {
      return apiError(422, 'validation', 'Choose one of your wallets.', [
        { path: 'walletId', message: 'Wallet not found.' },
      ])
    }
    if (wallet.network !== parsed.data.network) {
      return apiError(422, 'validation', 'The selected network does not match that wallet.', [
        { path: 'network', message: `This wallet is on ${wallet.network}.` },
      ])
    }
    const now = new Date().toISOString()
    const order: OrderRecord = {
      id: crypto.randomUUID(),
      userId: user.id,
      status: 'pending',
      idempotencyKey,
      bodyHash,
      version: 1,
      walletId: wallet.id,
      network: parsed.data.network,
      txRef: null,
      explorerUrl: null,
      receipt: {
        lines: quote.lines,
        subtotalEth: quote.subtotalEth,
        discountEth: quote.discountEth,
        networkFeeEth: quote.networkFeeEth,
        totalEth: quote.totalEth,
        couponCode: quote.coupon?.valid ? quote.coupon.code : null,
        purchasedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    }
    if (result.scenario === 'payment_confirmed') {
      if (!confirmOrder(result.db, order)) {
        return apiError(
          409,
          'availability_conflict',
          'An edition sold out before the order could be confirmed.',
        )
      }
      order.status = 'confirmed'
      order.txRef = txRefFor(order.id)
      order.explorerUrl = `https://explorer.atelier.test/tx/${order.txRef}`
      order.version = 2
      order.updatedAt = new Date().toISOString()
    }
    result.db.orders.push(order)
    persist(result.db)
    if (order.status === 'confirmed') {
      publishOrder(order)
      for (const line of order.receipt.lines) {
        const nft = findNft(result.db.nfts, line.nftId)
        if (nft) publishNft(nft)
      }
    } else {
      scheduleResolution(order.id, result.scenario)
    }
    if (result.scenario === 'order_timeout') await delay(60_000, request.signal)
    return HttpResponse.json(presentOrder(order), { status: 201 })
  }),

  http.get('/api/orders/:orderId', async ({ request, params }) => {
    const result = await gate(request, 'required')
    const user = requireUser(result)
    if (user instanceof Response) return user
    if (!result.ok) return result.response
    const order = result.db.orders.find(
      (item) => item.id === String(params.orderId) && item.userId === user.id,
    )
    if (!order) return apiError(404, 'not_found', 'That order could not be found.')
    return HttpResponse.json(presentOrder(order))
  }),

  http.get('/api/profile', async ({ request }) => {
    const result = await gate(request, 'required')
    const user = requireUser(result)
    if (user instanceof Response) return user
    return HttpResponse.json(presentUser(user))
  }),

  http.patch('/api/profile', async ({ request }) => {
    const result = await gate(request, 'required')
    const user = requireUser(result)
    if (user instanceof Response) return user
    if (!result.ok) return result.response
    const parsed = profileUpdateSchema.safeParse(await readJson(request))
    if (!parsed.success)
      return apiError(422, 'validation', 'Check your profile details.', zodDetails(parsed.error))
    user.displayName = parsed.data.displayName.trim()
    user.bio = parsed.data.bio.trim()
    persist(result.db)
    return HttpResponse.json(presentUser(user))
  }),

  http.post('/api/profile/avatar', async ({ request }) => {
    const result = await gate(request, 'required')
    const user = requireUser(result)
    if (user instanceof Response) return user
    if (!result.ok) return result.response
    const parsed = avatarUpdateSchema.safeParse(await readJson(request))
    if (!parsed.success)
      return apiError(
        422,
        'validation',
        'Use a PNG, JPEG, or WebP image.',
        zodDetails(parsed.error),
      )
    user.avatarUrl = parsed.data.imageDataUrl
    persist(result.db)
    return HttpResponse.json(presentUser(user))
  }),

  http.post('/api/profile/password', async ({ request }) => {
    const result = await gate(request, 'required')
    const user = requireUser(result)
    if (user instanceof Response) return user
    if (!result.ok) return result.response
    const parsed = passwordChangeSchema.safeParse(await readJson(request))
    if (!parsed.success)
      return apiError(422, 'validation', 'Check the password fields.', zodDetails(parsed.error))
    const matches = await verifyPassword(
      parsed.data.currentPassword,
      user.passwordSalt,
      user.passwordHash,
    )
    if (!matches) {
      return apiError(422, 'validation', 'The current password is incorrect.', [
        { path: 'currentPassword', message: 'That password does not match.' },
      ])
    }
    user.passwordSalt = randomSalt()
    user.passwordHash = await hashPassword(parsed.data.newPassword, user.passwordSalt)
    persist(result.db)
    return HttpResponse.json({ ok: true })
  }),

  http.get('/api/wallets', async ({ request }) => {
    const result = await gate(request, 'required')
    const user = requireUser(result)
    if (user instanceof Response) return user
    if (!result.ok) return result.response
    const items = result.db.wallets.filter((wallet) => wallet.userId === user.id).map(presentWallet)
    return HttpResponse.json(walletListSchema.parse({ items }))
  }),

  http.post('/api/wallets', async ({ request }) => {
    const result = await gate(request, 'required')
    const user = requireUser(result)
    if (user instanceof Response) return user
    if (!result.ok) return result.response
    const parsed = walletWriteSchema.safeParse(await readJson(request))
    if (!parsed.success)
      return apiError(422, 'validation', 'Check the wallet details.', zodDetails(parsed.error))
    const mine = result.db.wallets.filter((wallet) => wallet.userId === user.id)
    if (mine.length >= 2) {
      return apiError(
        422,
        'validation',
        'A collector can keep one primary and one secondary wallet.',
        [{ path: 'role', message: 'Remove a wallet before adding another.' }],
      )
    }
    if (parsed.data.role === 'primary') {
      for (const wallet of mine) if (wallet.role === 'primary') wallet.role = 'secondary'
    }
    const now = new Date().toISOString()
    const wallet = {
      id: crypto.randomUUID(),
      userId: user.id,
      label: parsed.data.label.trim(),
      address: parsed.data.address,
      network: parsed.data.network,
      role: parsed.data.role,
      connected: false,
      updatedAt: now,
    }
    result.db.wallets.push(wallet)
    persist(result.db)
    return HttpResponse.json(presentWallet(wallet), { status: 201 })
  }),

  http.post('/api/wallets/:walletId/connection', async ({ request, params }) => {
    const result = await gate(request, 'required')
    const user = requireUser(result)
    if (user instanceof Response) return user
    if (!result.ok) return result.response
    const parsed = walletConnectionSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return apiError(422, 'validation', 'Choose a connection action.', zodDetails(parsed.error))
    }
    const wallet = result.db.wallets.find(
      (item) => item.id === String(params.walletId) && item.userId === user.id,
    )
    if (!wallet) return apiError(404, 'not_found', 'That wallet could not be found.')
    if (parsed.data.action === 'decline') {
      wallet.connected = false
      wallet.updatedAt = new Date().toISOString()
      persist(result.db)
      return apiError(422, 'validation', 'The wallet refused the connection.', [
        { path: 'action', message: 'Connection was declined.' },
      ])
    }
    wallet.connected = parsed.data.action === 'connect'
    wallet.updatedAt = new Date().toISOString()
    persist(result.db)
    return HttpResponse.json(presentWallet(wallet))
  }),

  http.patch('/api/wallets/:walletId', async ({ request, params }) => {
    const result = await gate(request, 'required')
    const user = requireUser(result)
    if (user instanceof Response) return user
    if (!result.ok) return result.response
    const parsed = walletWriteSchema.safeParse(await readJson(request))
    if (!parsed.success)
      return apiError(422, 'validation', 'Check the wallet details.', zodDetails(parsed.error))
    const wallet = result.db.wallets.find(
      (item) => item.id === String(params.walletId) && item.userId === user.id,
    )
    if (!wallet) return apiError(404, 'not_found', 'That wallet could not be found.')
    if (parsed.data.role === 'primary') {
      for (const other of result.db.wallets) {
        if (other.userId === user.id && other.id !== wallet.id && other.role === 'primary')
          other.role = 'secondary'
      }
    }
    wallet.label = parsed.data.label.trim()
    wallet.address = parsed.data.address
    wallet.network = parsed.data.network
    wallet.role = parsed.data.role
    wallet.updatedAt = new Date().toISOString()
    persist(result.db)
    return HttpResponse.json(presentWallet(wallet))
  }),
]
