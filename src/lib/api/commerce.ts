import {
  cartAddSchema,
  cartSchema,
  cartUpdateSchema,
  createOrderSchema,
  favoriteListSchema,
  favoriteWriteSchema,
  newsletterResponseSchema,
  orderListSchema,
  orderSchema,
  quoteRequestSchema,
  supportRequestSchema,
  supportResponseSchema,
  quoteSchema,
  type Cart,
  type CartAdd,
  type CreateOrderBody,
  type Order,
  type Quote,
  type SupportRequest,
  type QuoteRequest,
} from '@/contracts/commerce'
import { api } from './client'

export async function listFavorites(signal?: AbortSignal): Promise<string[]> {
  const response = await api.get('/favorites', { signal })
  return favoriteListSchema.parse(response.data).nftIds
}

export async function addFavorite(nftId: string): Promise<string[]> {
  const response = await api.post('/favorites', favoriteWriteSchema.parse({ nftId }))
  return favoriteListSchema.parse(response.data).nftIds
}

export async function removeFavorite(nftId: string): Promise<void> {
  await api.delete(`/favorites/${encodeURIComponent(nftId)}`)
}

export async function subscribeNewsletter(email: string): Promise<void> {
  const response = await api.post('/newsletter', { email })
  newsletterResponseSchema.parse(response.data)
}

export async function getCart(signal?: AbortSignal): Promise<Cart> {
  const response = await api.get('/cart', { signal })
  return cartSchema.parse(response.data)
}

export async function addCartItem(body: CartAdd): Promise<Cart> {
  const response = await api.post('/cart/items', cartAddSchema.parse(body))
  return cartSchema.parse(response.data)
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  const response = await api.patch(
    `/cart/items/${encodeURIComponent(itemId)}`,
    cartUpdateSchema.parse({ quantity }),
  )
  return cartSchema.parse(response.data)
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  const response = await api.delete(`/cart/items/${encodeURIComponent(itemId)}`)
  return cartSchema.parse(response.data)
}

export async function createQuote(body: QuoteRequest, signal?: AbortSignal): Promise<Quote> {
  const response = await api.post('/quotes', quoteRequestSchema.parse(body), { signal })
  return quoteSchema.parse(response.data)
}

export async function createOrder(body: CreateOrderBody, idempotencyKey: string): Promise<Order> {
  const response = await api.post('/orders', createOrderSchema.parse(body), {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  return orderSchema.parse(response.data)
}

export async function listOrders(signal?: AbortSignal): Promise<Order[]> {
  const response = await api.get('/orders', { signal })
  return orderListSchema.parse(response.data).items
}

export async function getOrder(orderId: string, signal?: AbortSignal): Promise<Order> {
  const response = await api.get(`/orders/${encodeURIComponent(orderId)}`, { signal })
  return orderSchema.parse(response.data)
}

export async function submitSupport(body: SupportRequest): Promise<void> {
  const response = await api.post('/support', supportRequestSchema.parse(body))
  supportResponseSchema.parse(response.data)
}
