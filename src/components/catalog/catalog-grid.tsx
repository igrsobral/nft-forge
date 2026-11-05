import { NftCard } from '@/components/catalog/nft-card'
import type { NftSummary } from '@/contracts/catalog'

export function NftGrid({ items }: { items: NftSummary[] }) {
  if (items.length === 0) return <EmptyResults />
  return (
    <ul className="grid grid-cols-2 gap-4 max-lg:[&>li:nth-child(2n)]:mt-10 lg:grid-cols-3 lg:gap-5">
      {items.map((nft) => (
        <li key={nft.id} className="min-w-0">
          <NftCard nft={nft} />
        </li>
      ))}
    </ul>
  )
}

function EmptyResults() {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center">
      <h2 className="text-lg font-medium">Nenhuma edição encontrada</h2>
      <p className="mt-2 text-muted-foreground">Limpe um filtro ou tente outro nome.</p>
    </div>
  )
}
