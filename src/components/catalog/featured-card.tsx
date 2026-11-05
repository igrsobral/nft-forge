import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/contracts/catalog'

export function FeaturedCard({ nft }: { nft: NftSummary | null }) {
  if (!nft) return null
  return (
    <section aria-label="NFT em destaque">
      <p className="type-c-13 font-bold tracking-[0.16em] text-primary uppercase">
        NFT em destaque
      </p>
      <p className="type-c-13 mt-1 font-bold tracking-[0.14em] text-foreground uppercase">
        Oferta limitada
      </p>
      <Link
        to="/nfts/$nftId"
        params={{ nftId: nft.id }}
        className="mt-4 block overflow-hidden rounded-[24px] bg-surface-panel"
      >
        <img
          src={nft.imageUrl}
          alt={`${nft.name}, oferta limitada`}
          width={260}
          height={320}
          loading="lazy"
          decoding="async"
          className="aspect-[4/5] w-full object-cover"
        />
      </Link>
    </section>
  )
}
