import { Link } from '@tanstack/react-router'
import { FavoriteToggle } from '@/components/catalog/favorite-toggle'
import type { NftSummary } from '@/contracts/catalog'
import { formatEth } from '@/lib/money'

export function NftCard({ nft }: { nft: NftSummary }) {
  return (
    <article
      data-testid="nft-card"
      data-category={nft.category}
      className="group relative flex h-full min-w-0 flex-col rounded-xl bg-[#24140f] p-3"
    >
      <div className="relative min-w-0">
        <img
          src={nft.imageUrl}
          alt={`${nft.name} por ${nft.creator}`}
          width={250}
          height={250}
          className="aspect-square w-full min-w-0 rounded-xl object-cover"
        />
        {nft.rarity === 'raro' ? <RarityBadge /> : null}
        <span className="hidden max-lg:contents">
          <FavoriteToggle nft={nft} />
        </span>
      </div>
      <h2 className="type-b-14 mt-3 truncate text-foreground">
        <Link
          to="/nfts/$nftId"
          params={{ nftId: nft.id }}
          data-testid="nft-name"
          className="after:absolute after:inset-0 after:content-[''] hover:text-primary"
        >
          {nft.name}
        </Link>
      </h2>
      <p className="mt-1.5 flex items-baseline gap-2">
        <span data-testid="nft-card-price" className="type-b-16-bold text-primary">
          {formatEth(nft.priceEth)}
        </span>
        {nft.previousPriceEth ? (
          <span className="type-c-13 text-[#8d847c] line-through">
            {formatEth(nft.previousPriceEth)}
          </span>
        ) : null}
      </p>
    </article>
  )
}

function RarityBadge() {
  return (
    <span className="absolute top-4 -left-2 z-10 hidden rounded-md bg-primary px-2 py-1 text-[10px] leading-none font-bold uppercase tracking-wide text-primary-foreground max-lg:block">
      Raro
    </span>
  )
}
