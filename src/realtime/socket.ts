import type { Socket } from 'socket.io-client'

export type SocketStatus = 'connecting' | 'live' | 'offline'

let socketPromise: Promise<Socket> | null = null
let status: SocketStatus = 'connecting'
const listeners = new Set<() => void>()

function setStatus(next: SocketStatus) {
  if (status === next) return
  status = next
  for (const listener of listeners) listener()
}

export function getSocketStatus(): SocketStatus {
  return status
}

export function subscribeSocketStatus(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Import socket.io-client only after MSW has patched `globalThis.WebSocket`.
 * The client captures the WebSocket constructor when its module evaluates.
 */
export function getSocket(): Promise<Socket> {
  if (!socketPromise) {
    socketPromise = import('socket.io-client').then(({ io }) => {
      const socket = io(window.location.origin, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
      })
      socket.on('connect', () => setStatus('live'))
      socket.on('disconnect', () => setStatus('offline'))
      socket.on('connect_error', () => setStatus('offline'))
      return socket
    })
  }
  return socketPromise
}
