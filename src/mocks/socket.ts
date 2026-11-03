import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import {
  nftUpdatedEventSchema,
  orderUpdatedEventSchema,
  type NftUpdatedEvent,
  type OrderUpdatedEvent,
} from '@/contracts/events'
import type { NftRecord, OrderRecord } from './seed'

function socketUrl(): string {
  if (typeof window === 'undefined') return 'ws://127.0.0.1'
  const url = new URL(window.location.origin)
  url.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.origin
}

/**
 * MSW strips a leading `/socket.io/` before matching, so the link is the page origin.
 * The published binding completes the Engine.IO handshake and exposes `client.emit`.
 */
export const marketSocket = ws.link(socketUrl())

type BoundSocket = ReturnType<typeof toSocketIo>
const connections = new Set<BoundSocket>()

export const socketHandler = marketSocket.addEventListener('connection', (connection) => {
  const io = toSocketIo(connection)
  connections.add(io)
  // 0.2.0 advertises a 25s ping and does not send one. Keep the socket alive ourselves.
  const ping = window.setInterval(() => {
    try {
      io.rawClient.send('2')
    } catch {
      window.clearInterval(ping)
    }
  }, 20_000)
  connection.client.addEventListener('close', () => {
    window.clearInterval(ping)
    connections.delete(io)
  })
})

function broadcast(event: string, payload: unknown): void {
  for (const connection of connections) {
    connection.client.emit(event, payload)
  }
}

export function publishNft(nft: NftRecord): void {
  const event: NftUpdatedEvent = nftUpdatedEventSchema.parse({
    eventId: crypto.randomUUID(),
    nftId: nft.id,
    version: nft.version,
    priceEth: nft.priceEth,
    editions: nft.editions.map((edition) => ({
      id: edition.id,
      remaining: edition.remaining,
      priceEth: edition.priceEth,
    })),
    emittedAt: new Date().toISOString(),
  })
  broadcast('nft.updated', event)
}

export function publishOrder(order: OrderRecord): void {
  const event: OrderUpdatedEvent = orderUpdatedEventSchema.parse({
    eventId: crypto.randomUUID(),
    orderId: order.id,
    userId: order.userId,
    version: order.version,
    status: order.status,
    txRef: order.txRef,
    explorerUrl: order.explorerUrl,
    emittedAt: order.updatedAt,
  })
  broadcast('order.updated', event)
}
