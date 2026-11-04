export function pickWallet<T extends { id: string }>(
  wallets: readonly T[] | undefined,
  walletId: string,
): T | undefined {
  if (!wallets || wallets.length === 0) return undefined
  return wallets.find((wallet) => wallet.id === walletId) ?? wallets[0]
}
