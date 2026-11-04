import { useNavigate } from '@tanstack/react-router'
import { X } from 'lucide-react'
import type { Order } from '@/contracts/commerce'
import { confirmationNote, etherscanTxUrl, formatReceiptDate, shortTxHash } from '@/lib/receipt'
import { formatEth } from '@/lib/money'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

export function ReceiptDialog({ order }: { order: Order }) {
  const navigate = useNavigate()
  const txRef = order.txRef
  const note = confirmationNote(order.network)

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) void navigate({ to: '/' })
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/80"
        className="max-h-[100dvh] w-full max-w-[560px] gap-0 overflow-y-auto border-0 bg-[#24140f] p-0 text-foreground ring-0 sm:max-w-[560px] max-lg:!inset-x-0 max-lg:!top-auto max-lg:!bottom-0 max-lg:!h-auto max-lg:!max-h-[100dvh] max-lg:!w-full max-lg:!max-w-none max-lg:!translate-x-0 max-lg:!translate-y-0 max-lg:!rounded-b-none"
        aria-describedby="receipt-note"
      >
        <div className="relative px-4 pt-5 pb-4 sm:px-6">
          <button
            type="button"
            aria-label="Fechar"
            className="absolute top-2 right-2 flex size-11 items-center justify-center text-[#c9a27a] hover:text-foreground"
            onClick={() => void navigate({ to: '/' })}
          >
            <X className="size-4" />
          </button>
          <ThankYouMark />
          <DialogTitle className="mt-3 text-center text-sm font-bold text-foreground">
            Seus NFTs agora estão na sua carteira
          </DialogTitle>
          <dl className="mt-4 grid grid-cols-4 border-y border-primary py-3 text-center">
            <SummaryCell
              label="ID da transação"
              value={txRef ? shortTxHash(txRef) : '—'}
              testId="tx-ref"
            />
            <SummaryCell label="Data" value={formatReceiptDate(order.receipt.purchasedAt)} />
            <SummaryCell label="Total" value={formatEth(order.receipt.totalEth)} />
            <SummaryCell label="Carteira" value={order.walletLabel || 'Carteira'} last />
          </dl>
          <p className="mt-4 text-sm font-bold">Detalhes da transação</p>
          <table className="mt-2 w-full table-fixed text-left text-sm">
            <thead>
              <tr className="text-xs text-[#c9a27a]">
                <th scope="col" className="w-[58%] pb-2 font-normal">
                  NFTs
                </th>
                <th scope="col" className="w-[18%] pb-2 text-center font-normal">
                  Edições
                </th>
                <th scope="col" className="w-[24%] pb-2 text-right font-normal">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {order.receipt.lines.map((line) => (
                <tr key={`${line.nftId}-${line.editionId}`}>
                  <td className="py-2 pr-2 align-middle">
                    <div className="flex min-w-0 items-center gap-2">
                      {line.imageUrl ? (
                        <img
                          src={line.imageUrl}
                          alt=""
                          width={40}
                          height={40}
                          className="size-10 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <span className="size-10 shrink-0 rounded-md bg-[#140d0a]" />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-bold">{line.name}</span>
                        <span className="block truncate text-xs text-[#c9a27a]">
                          ID do token: {line.tokenId || '—'}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="py-2 text-center align-middle whitespace-nowrap text-[#c9a27a]">
                    (x {line.quantity})
                  </td>
                  <td className="py-2 text-right align-middle font-bold whitespace-nowrap text-primary">
                    {formatEth(line.lineTotalEth)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 grid gap-1 border-t border-[#6a4332] pt-3 text-sm">
            <p className="flex items-baseline justify-between gap-3">
              <span className="text-[#c9a27a]">Taxa de rede</span>
              <span className="font-bold text-primary">
                {formatEth(order.receipt.networkFeeEth)}
              </span>
            </p>
            <p className="flex items-baseline justify-between gap-3 text-base font-bold">
              <span>Total</span>
              <span className="text-primary">{formatEth(order.receipt.totalEth)}</span>
            </p>
          </div>
          <DialogDescription
            id="receipt-note"
            className="mt-4 text-center text-xs leading-5 text-[#8d847c]"
          >
            {note}
          </DialogDescription>
          {txRef ? (
            <a
              href={etherscanTxUrl(txRef)}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto mt-4 flex h-11 w-fit items-center justify-center rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground"
            >
              Ver no Etherscan
            </a>
          ) : null}
          <p data-testid="order-status" className="sr-only">
            {order.status}
          </p>
        </div>
        <div aria-hidden className="h-2 bg-primary" />
      </DialogContent>
    </Dialog>
  )
}

function ThankYouMark() {
  return (
    <svg viewBox="0 0 72 56" aria-hidden className="mx-auto h-14 w-16 text-primary">
      <rect
        x="3"
        y="8"
        width="66"
        height="42"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M4 12 L36 32 L68 12" fill="none" stroke="currentColor" strokeWidth="2" />
      <text
        x="36"
        y="24"
        textAnchor="middle"
        fill="currentColor"
        fontSize="7"
        fontFamily="Roboto Mono, ui-monospace, monospace"
      >
        THANK YOU
      </text>
    </svg>
  )
}

function SummaryCell({
  label,
  value,
  testId,
  last = false,
}: {
  label: string
  value: string
  testId?: string
  last?: boolean
}) {
  return (
    <div className={last ? 'min-w-0 px-1' : 'min-w-0 border-r border-[#6a4332] px-1'}>
      <dt className="text-[10px] leading-tight text-[#c9a27a]">{label}</dt>
      <dd
        data-testid={testId}
        className="mt-1 text-[11px] leading-tight font-bold break-words text-foreground"
      >
        {value}
      </dd>
    </div>
  )
}
