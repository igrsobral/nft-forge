import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { nftUpdatedEventSchema, orderUpdatedEventSchema } from '@/contracts/events'
import { formatEth } from '@/lib/money'
import { onSessionExpired } from '@/lib/storage'
import { applyNftUpdated, applyOrderUpdated, nftName } from './apply-events'
import { getSocket } from './socket'

const seenEventIds = new Set<string>()

function remember(eventId: string): boolean {
  if (seenEventIds.has(eventId)) return false
  seenEventIds.add(eventId)
  if (seenEventIds.size > 200) {
    const oldest = seenEventIds.values().next().value
    if (oldest) seenEventIds.delete(oldest)
  }
  return true
}

export function RealtimeBridge() {
  const queryClient = useQueryClient()

  useEffect(
    () =>
      onSessionExpired(() => {
        toast.error('Your session expired. Sign in again to continue.')
        queryClient.removeQueries({
          predicate: (query) => {
            const head = query.queryKey[0]
            return head !== 'nfts' && head !== 'nft'
          },
        })
        void queryClient.invalidateQueries({ queryKey: ['session'] })
      }),
    [queryClient],
  )

  useEffect(() => {
    let cancelled = false
    let reconnects = false
    let detach: (() => void) | undefined

    void getSocket().then((socket) => {
      if (cancelled) return

      const onConnect = () => {
        if (reconnects) {
          void queryClient.invalidateQueries({ queryKey: ['nfts'] })
          void queryClient.invalidateQueries({ queryKey: ['nft'] })
          void queryClient.invalidateQueries({ queryKey: ['cart'] })
          void queryClient.invalidateQueries({ queryKey: ['quote'] })
          void queryClient.invalidateQueries({ queryKey: ['order'] })
          void queryClient.invalidateQueries({ queryKey: ['orders'] })
        }
        reconnects = true
      }

      const onNft = (payload: unknown) => {
        const parsed = nftUpdatedEventSchema.safeParse(payload)
        if (!parsed.success || !remember(parsed.data.eventId)) return
        const name = nftName(queryClient, parsed.data.nftId)
        const priceChanged = applyNftUpdated(queryClient, parsed.data)
        if (priceChanged) {
          toast.info(`${name ?? 'An edition'} is now ${formatEth(parsed.data.priceEth)}`)
        }
      }

      const onOrder = (payload: unknown) => {
        const parsed = orderUpdatedEventSchema.safeParse(payload)
        if (!parsed.success || !remember(parsed.data.eventId)) return
        const applied = applyOrderUpdated(queryClient, parsed.data)
        if (!applied) return
        if (parsed.data.status === 'confirmed') toast.success('Payment confirmed.')
        if (parsed.data.status === 'declined')
          toast.error('Payment was declined. Your cart was kept.')
      }

      socket.on('connect', onConnect)
      socket.on('nft.updated', onNft)
      socket.on('order.updated', onOrder)
      if (socket.connected) onConnect()

      detach = () => {
        socket.off('connect', onConnect)
        socket.off('nft.updated', onNft)
        socket.off('order.updated', onOrder)
      }
      if (cancelled) detach()
    })

    return () => {
      cancelled = true
      detach?.()
    }
  }, [queryClient])

  return null
}
