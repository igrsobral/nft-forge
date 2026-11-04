const networkLabels: Record<string, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  base: 'Base',
  solana: 'Solana',
}

export function networkDisplayName(network: string): string {
  return networkLabels[network] ?? network
}

export function shortTxHash(txRef: string): string {
  const body = txRef.startsWith('0x') || txRef.startsWith('0X') ? txRef.slice(2) : txRef
  if (body.length <= 8) return txRef
  return `0x${body.slice(0, 4).toUpperCase()}…${body.slice(-4).toUpperCase()}`
}

export function formatReceiptDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const day = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', timeZone: 'UTC' }).format(date)
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' })
    .format(date)
    .replace('.', '')
  const label = `${month.charAt(0).toUpperCase()}${month.slice(1)}`
  const year = new Intl.DateTimeFormat('pt-BR', { year: 'numeric', timeZone: 'UTC' }).format(date)
  return `${day} ${label}, ${year}`
}

export function etherscanTxUrl(txRef: string): string {
  return `https://etherscan.io/tx/${txRef}`
}

export function confirmationNote(network: string): string {
  return `Transação confirmada na ${networkDisplayName(network)}. A propriedade foi transferida para sua carteira conectada e registrada na rede.`
}
