import { useNavigate } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { Order } from '@/contracts/commerce'
import { formatEth } from '@/lib/money'
import { confirmationNote, etherscanTxUrl, formatReceiptDate, shortTxHash } from '@/lib/receipt'

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
        overlayClassName="bg-background/80"
        className="max-h-[100dvh] w-full max-w-[560px] gap-0 overflow-y-auto rounded-none border border-line-strong bg-surface-panel p-0 text-foreground ring-0 sm:max-w-[560px] max-lg:!inset-x-0 max-lg:!top-auto max-lg:!bottom-0 max-lg:!h-auto max-lg:!max-h-[100dvh] max-lg:!w-full max-lg:!max-w-none max-lg:!translate-x-0 max-lg:!translate-y-0 max-lg:!rounded-none"
        aria-describedby="receipt-note"
      >
        <header className="relative px-4 pt-5 pb-4 text-center sm:px-6">
          <button
            type="button"
            aria-label="Fechar"
            className="absolute top-2 right-2 flex size-11 items-center justify-center text-secondary-muted hover:text-foreground"
            onClick={() => void navigate({ to: '/' })}
          >
            <X className="size-4" />
          </button>
          <ThankYouMark />
          <DialogTitle className="mt-2 text-center text-sm font-bold text-secondary">
            Seus NFTs agora estão na sua carteira
          </DialogTitle>
        </header>
        <dl className="grid grid-cols-[1.25fr_1.1fr_1fr_.9fr] border-y border-primary px-4 py-3 text-left min-[480px]:px-8">
          <SummaryCell
            label="ID da transação"
            value={txRef ? shortTxHash(txRef) : '—'}
            testId="tx-ref"
          />
          <SummaryCell label="Data" value={formatReceiptDate(order.receipt.purchasedAt)} />
          <SummaryCell label="Total" value={formatEth(order.receipt.totalEth)} />
          <SummaryCell label="Carteira" value={order.walletLabel || 'Carteira'} last />
        </dl>
        <section className="mx-4 border-b border-line-strong pt-4 pb-3 min-[480px]:mx-10">
          <h2 className="text-sm font-bold">Detalhes da transação</h2>
          <table className="mt-2 w-full table-fixed text-left text-sm">
            <thead>
              <tr className="border-b border-line-strong text-sm font-bold text-foreground">
                <th scope="col" className="w-[58%] pb-2">
                  NFTs
                </th>
                <th scope="col" className="w-[18%] pb-2 text-center">
                  Edições
                </th>
                <th scope="col" className="w-[24%] pb-2 text-right">
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
                          width={64}
                          height={64}
                          loading="lazy"
                          decoding="async"
                          className="size-16 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="size-16 shrink-0 rounded-lg bg-background" />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-[clamp(0.7rem,3vw,0.875rem)] font-bold">
                          {line.name}
                        </span>
                        <span className="block truncate text-xs text-secondary-muted">
                          ID do token: {line.tokenId || '—'}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="py-2 text-center align-middle text-[clamp(0.65rem,2.5vw,0.8125rem)] whitespace-nowrap text-secondary-muted">
                    (x {line.quantity})
                  </td>
                  <td className="py-2 text-right align-middle text-[clamp(0.7rem,3vw,1rem)] font-bold whitespace-nowrap text-primary">
                    {formatEth(line.lineTotalEth)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ml-auto mt-1 grid w-[66%] gap-1 text-sm">
            <p className="flex items-baseline justify-between gap-3">
              <span className="text-secondary-muted">Taxa de rede</span>
              <span className="whitespace-nowrap">{formatEth(order.receipt.networkFeeEth)}</span>
            </p>
            <p className="flex items-baseline justify-between gap-3 text-base font-bold">
              <span>Total</span>
              <span className="text-primary">{formatEth(order.receipt.totalEth)}</span>
            </p>
          </div>
        </section>
        <footer className="px-4 pt-3 pb-10 sm:px-10">
          <DialogDescription
            id="receipt-note"
            className="text-center text-[13px] leading-5 text-secondary-muted"
          >
            {note}
          </DialogDescription>
          {txRef ? (
            <a
              href={etherscanTxUrl(txRef)}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto mt-4 flex h-11 w-fit items-center justify-center rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-accent"
            >
              Ver no Etherscan
            </a>
          ) : null}
          <p data-testid="order-status" className="sr-only">
            {order.status}
          </p>
        </footer>
        <div aria-hidden className="h-2.5 bg-primary" />
      </DialogContent>
    </Dialog>
  )
}

function ThankYouMark() {
  return (
    <svg
      width="60"
      height="73"
      viewBox="0 0 66 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="mx-auto"
    >
      <path
        d="M29.28 25.9317C29.884 26.1624 30.5617 25.8588 30.7922 25.2536L31.1851 24.2217H33.9576L34.3458 25.2503C34.5228 25.7195 34.9687 26.0088 35.4423 26.0088C35.5798 26.0088 35.7197 25.9844 35.8559 25.933C36.4614 25.7045 36.767 25.0284 36.5384 24.4228L33.8309 17.2483C33.827 17.2378 33.8228 17.227 33.8186 17.2167C33.6117 16.7133 33.1264 16.3881 32.5822 16.3881C32.5819 16.3881 32.5815 16.3881 32.5812 16.3881C32.0365 16.3884 31.5512 16.7144 31.345 17.2183C31.3414 17.2273 31.3376 17.2361 31.3344 17.2453L28.602 24.4195C28.3715 25.0242 28.6751 25.7013 29.28 25.9317V25.9317ZM33.0731 21.8781H32.0778L32.5776 20.5656L33.0731 21.8781Z"
        fill="var(--primary)"
      />
      <path
        d="M38.9121 26.0085C39.5595 26.0085 40.084 25.4839 40.084 24.8366V21.3327L42.8588 25.3508C43.1926 25.8333 43.7537 26.0377 44.2884 25.8708C44.8319 25.7013 45.183 25.1989 45.183 24.58L45.1151 17.5486C45.1088 16.9053 44.5854 16.388 43.9435 16.388C43.9396 16.388 43.9357 16.388 43.932 16.388C43.2846 16.3942 42.7651 16.9241 42.7713 17.5711L42.806 21.1497L39.8765 16.9075C39.5851 16.4855 39.0535 16.3024 38.5634 16.4547C38.0738 16.6074 37.7402 17.0606 37.7402 17.5735V24.8364C37.7402 25.4839 38.2648 26.0085 38.9121 26.0085Z"
        fill="var(--primary)"
      />
      <path
        d="M47.8302 26.0084C48.4776 26.0084 49.0021 25.4839 49.0021 24.8366V23.5698L51.1893 25.68C51.4167 25.8994 51.7099 26.0086 52.0028 26.0086C52.3098 26.0086 52.6163 25.8886 52.8462 25.6503C53.2956 25.1847 53.2823 24.4427 52.8165 23.9934L49.7724 21.0564L52.5376 18.5145C53.0142 18.0766 53.0454 17.3352 52.6073 16.8587C52.1695 16.3822 51.4279 16.3511 50.9515 16.7891L49.002 18.5809V17.56C49.002 16.9127 48.4774 16.3881 47.8301 16.3881C47.1827 16.3881 46.6582 16.9127 46.6582 17.56V24.8366C46.6584 25.4839 47.1829 26.0084 47.8302 26.0084V26.0084Z"
        fill="var(--primary)"
      />
      <path
        d="M20.9902 26.0084C21.6376 26.0084 22.1621 25.4839 22.1621 24.8366V22.2453H24.854V24.8366C24.854 25.4839 25.3785 26.0084 26.0259 26.0084C26.6732 26.0084 27.1977 25.4839 27.1977 24.8366V17.56C27.1977 16.9127 26.6732 16.3881 26.0259 16.3881C25.3785 16.3881 24.854 16.9127 24.854 17.56V19.9016H22.1621V17.56C22.1621 16.9127 21.6376 16.3881 20.9902 16.3881C20.3429 16.3881 19.8184 16.9127 19.8184 17.56V24.8366C19.8184 25.4839 20.3429 26.0084 20.9902 26.0084Z"
        fill="var(--primary)"
      />
      <path
        d="M18.2334 31.64L20.3662 34.9061L20.3579 38.273C20.3564 38.9203 20.8798 39.4463 21.5268 39.4478H21.5298C22.1757 39.4478 22.7001 38.925 22.7017 38.2789L22.7099 34.908L24.826 31.657C25.1792 31.1145 25.0257 30.3886 24.4834 30.0356C23.941 29.6822 23.2149 29.8359 22.862 30.3783L21.5373 32.4131L20.1956 30.3586C19.8417 29.8166 19.1159 29.6645 18.5737 30.0181C18.032 30.372 17.8793 31.0981 18.2334 31.64V31.64Z"
        fill="var(--primary)"
      />
      <path
        d="M36.3097 36.0064C36.3097 37.1997 36.8758 38.1662 37.9924 38.8798C38.5808 39.2556 39.2438 39.4467 39.963 39.4478H39.9685C40.5858 39.4478 41.1663 39.3133 41.6938 39.0475C42.9938 38.3928 43.7097 37.3109 43.7097 36.0011V30.9992C43.7097 30.3519 43.1852 29.8273 42.5379 29.8273C41.8905 29.8273 41.366 30.3519 41.366 30.9992V36.0011C41.366 36.3061 41.278 36.6326 40.6396 36.9542C40.4394 37.0551 40.2199 37.104 39.9686 37.104C39.9679 37.104 39.9669 37.104 39.9661 37.104C39.6963 37.1037 39.4633 37.0384 39.2541 36.9048C38.6993 36.5503 38.6533 36.2776 38.6533 36.0065V30.9994C38.6533 30.352 38.1288 29.8275 37.4814 29.8275C36.8341 29.8275 36.3096 30.352 36.3096 30.9994V36.0064H36.3097Z"
        fill="var(--primary)"
      />
      <path
        d="M13.3447 18.7319H14.1741V24.8366C14.1741 25.4839 14.6986 26.0084 15.346 26.0084C15.9933 26.0084 16.5179 25.4839 16.5179 24.8366V18.7319H17.3633C18.0107 18.7319 18.5352 18.2073 18.5352 17.56C18.5352 16.9127 18.0107 16.3881 17.3633 16.3881H13.3447C12.6974 16.3881 12.1729 16.9127 12.1729 17.56C12.1729 18.2073 12.6974 18.7319 13.3447 18.7319V18.7319Z"
        fill="var(--primary)"
      />
      <path
        d="M30.2125 29.8275C27.5602 29.8275 25.4023 31.9855 25.4023 34.6377C25.4023 37.2898 27.5603 39.4478 30.2125 39.4478C32.865 39.4478 35.0228 37.2898 35.0228 34.6377C35.0228 31.9855 32.8648 29.8275 30.2125 29.8275ZM30.2125 37.1041C28.8525 37.1041 27.7461 35.9977 27.7461 34.6377C27.7461 33.2777 28.8525 32.1712 30.2125 32.1712C31.5725 32.1712 32.6791 33.2777 32.6791 34.6377C32.6791 35.9977 31.5725 37.1041 30.2125 37.1041Z"
        fill="var(--primary)"
      />
      <path
        d="M63.3789 28.0734L59.9291 24.4797V9.46422C59.9291 7.37484 58.2292 5.67484 56.1397 5.67484H41.8753C41.8717 5.67109 41.8687 5.66687 41.8652 5.66313L39.0922 2.77469C37.3744 0.985469 35.0623 0 32.582 0C30.1017 0 27.7897 0.985469 26.072 2.77469L23.2877 5.675H9.02438C6.93484 5.675 5.235 7.375 5.235 9.46437V24.48L1.78516 28.0734C0.634063 29.2725 0 30.8483 0 32.5103V76.2106C0 78.3002 1.7 80 3.78937 80H61.3745C63.4639 80 65.1639 78.3002 65.1639 76.2106V32.5103C65.1639 30.8483 64.53 29.2725 63.3789 28.0734V28.0734ZM61.6881 29.6967C62.4181 30.457 62.8202 31.4564 62.8202 32.5105V35.168L59.9289 38.1797V27.8641L61.6881 29.6967ZM27.7627 4.39781C29.0344 3.07328 30.7458 2.34375 32.582 2.34375C34.4183 2.34375 36.1297 3.07328 37.4014 4.39781L38.6273 5.67484H26.5367L27.7627 4.39781ZM9.02438 8.01859H56.1395C56.9367 8.01859 57.5852 8.66703 57.5852 9.46422V40.6209L45.1459 53.5784L39.0919 47.2722C37.3742 45.483 35.0622 44.4975 32.5819 44.4975C30.1016 44.4975 27.7895 45.483 26.0719 47.2722L20.0178 53.5784L7.57859 40.6209V9.46422C7.57875 8.66719 8.22734 8.01859 9.02438 8.01859V8.01859ZM18.3936 55.2706L2.34391 71.9891V38.5522L18.3936 55.2706ZM2.34391 32.5103C2.34391 31.4562 2.74594 30.4569 3.47594 29.6966L5.23516 27.8641V38.1794L2.34391 35.1677V32.5103ZM61.3745 77.6562H3.78953C2.99234 77.6562 2.34391 77.0078 2.34391 76.2106V75.3733L27.7628 48.8953C29.0345 47.5706 30.7459 46.8412 32.5822 46.8412C34.4184 46.8412 36.1298 47.5708 37.4016 48.8953L46.8138 58.6997C47.262 59.1667 48.0037 59.1814 48.4706 58.7334C48.9373 58.2853 48.9527 57.5434 48.5044 57.0766L46.7706 55.2706L62.8203 38.5522V71.9891L52.2734 61.0028C51.8252 60.5359 51.0834 60.5209 50.6166 60.9691C50.1498 61.4172 50.1345 62.1591 50.5828 62.6259L62.8203 75.3733V76.2105C62.8202 77.0078 62.1717 77.6562 61.3745 77.6562V77.6562Z"
        fill="var(--primary)"
      />
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
    <div className={last ? 'min-w-0 px-1' : 'min-w-0 border-r border-line-strong px-1'}>
      <dt className="text-[clamp(0.65rem,2.5vw,0.8125rem)] leading-tight font-bold text-secondary-muted">
        {label}
      </dt>
      <dd
        data-testid={testId}
        className="mt-1 text-[clamp(0.65rem,2.5vw,0.8125rem)] leading-tight break-words text-secondary"
      >
        {value}
      </dd>
    </div>
  )
}
