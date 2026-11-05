import { useQueries, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { formatEth } from '@/lib/money'
import { favoritesQuery, nftDetailQuery } from '@/lib/queries'
import { getStoredUserId } from '@/lib/storage'

export const Route = createFileRoute('/profile/watchlist')({
  head: () => ({ meta: [{ title: 'Lista de interesse · Kurio' }] }),
  component: WatchlistPage,
})

function WatchlistPage() {
  const userId = getStoredUserId()
  const favorites = useQuery({ ...favoritesQuery(userId), enabled: Boolean(userId) })
  const details = useQueries({
    queries: (favorites.data ?? []).map((nftId) => nftDetailQuery(userId, nftId)),
  })
  const items = details.flatMap((query) => (query.data ? [query.data] : []))
  return (
    <section>
      <h2 className="type-b-16-bold mb-4 text-foreground">Lista de interesse</h2>
      {favorites.data && favorites.data.length === 0 ? (
        <p className="text-sm text-[#c9a27a]">Você ainda não favoritou nenhuma edição.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((nft) => (
            <li key={nft.id}>
              <Link
                to="/nfts/$nftId"
                params={{ nftId: nft.id }}
                className="flex items-center gap-3 rounded-xl bg-[#24140f] p-3 hover:text-primary"
              >
                <img src={nft.imageUrl} alt="" className="size-14 rounded-lg object-cover" />
                <span>
                  <span className="block font-bold">{nft.name}</span>
                  <span className="text-sm text-primary">{formatEth(nft.priceEth)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
