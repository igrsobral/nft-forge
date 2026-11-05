import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { MoreVertical, Wallet } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { toast } from 'sonner'
import { ProfileField, profileInputClass } from '@/components/profile/profile-shell'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProfileUpdate } from '@/contracts/account'
import type { Network } from '@/contracts/common'
import { setWalletConnection, updateProfile } from '@/lib/api/account'
import { createOrder } from '@/lib/api/commerce'
import { ApiError } from '@/lib/api/errors'
import { formatEth } from '@/lib/money'
import { cartOwnerKey } from '@/lib/owner'
import { cartQuery, quoteQuery, sessionQuery, walletsQuery } from '@/lib/queries'
import { getStoredUserId } from '@/lib/storage'
import { pickWallet } from '@/lib/wallet'

const idempotencyStorageKey = 'nft-market:order-key'

function orderKey(): string {
  const existing = sessionStorage.getItem(idempotencyStorageKey)
  if (existing) return existing
  const created = crypto.randomUUID()
  sessionStorage.setItem(idempotencyStorageKey, created)
  return created
}

/**
 * A chave de idempotência pertence a uma única tentativa de pedido: retries
 * do mesmo pedido (timeout/queda de rede) reutilizam a chave, mas compras
 * novas precisam de uma chave nova — reusar a antiga com outro carrinho
 * dispara conflito no servidor.
 */
function discardOrderKey(): void {
  sessionStorage.removeItem(idempotencyStorageKey)
}

/**
 * Bloco de pagamento com carteira, compartilhado pelo `/checkout` e,
 * no desktop, pela coluna lateral do carrinho (`embedded`).
 * No modo `embedded` ficam de fora os extras exclusivos da tela de pagamento:
 * aviso de carrinho mudado, seção de perfil do colecionador, resumo de total e
 * controles de simulação.
 */
export function WalletPayment({
  couponCode,
  embedded = false,
}: {
  couponCode?: string
  embedded?: boolean
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const userId = getStoredUserId()
  const session = useQuery(sessionQuery(userId))
  const wallets = useQuery({ ...walletsQuery(userId), enabled: Boolean(userId) })
  const owner = cartOwnerKey(userId)
  const cart = useQuery({ ...cartQuery(owner), enabled: !embedded })
  const quote = useQuery(quoteQuery(owner, couponCode ? { couponCode } : {}))
  const [walletId, setWalletId] = useState('')
  const selected = pickWallet(wallets.data, walletId)
  const [acceptedTotal, setAcceptedTotal] = useState<string | null>(null)
  const [provider, setProvider] = useState('WalletConnect')
  const [menuFor, setMenuFor] = useState<string | undefined>(undefined)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileDraft, setProfileDraft] = useState<Omit<ProfileUpdate, 'bio'> | null>(null)
  const [profileError, setProfileError] = useState<ApiError | null>(null)
  const user = session.data?.user
  const activeWalletId = selected?.id ?? ''
  const stale = Boolean(quote.data && acceptedTotal && acceptedTotal !== quote.data.totalEth)
  const blocked = !quote.data?.availabilityOk || stale || !selected?.connected

  const profileValues = {
    displayName: profileDraft?.displayName ?? user?.displayName ?? '',
    username: profileDraft?.username ?? user?.username ?? '',
    email: profileDraft?.email ?? user?.email ?? '',
    ensName: profileDraft?.ensName ?? user?.ensName ?? '',
    walletNickname: profileDraft?.walletNickname ?? user?.walletNickname ?? '',
  }
  const profileDirty = Boolean(
    profileDraft &&
      user &&
      (profileDraft.displayName !== user.displayName ||
        profileDraft.username !== user.username ||
        profileDraft.email !== user.email ||
        profileDraft.ensName !== user.ensName ||
        profileDraft.walletNickname !== user.walletNickname),
  )

  function openProfileEditor() {
    setProfileDraft(
      user
        ? {
            displayName: user.displayName,
            username: user.username,
            email: user.email,
            ensName: user.ensName,
            walletNickname: user.walletNickname,
          }
        : null,
    )
    setProfileError(null)
    setProfileOpen(true)
  }

  function closeProfileEditor() {
    setProfileDraft(null)
    setProfileError(null)
    setProfileOpen(false)
  }

  function profileFieldError(path: string): string | undefined {
    return profileError?.details.find((item) => item.path === path)?.message
  }

  const connect = useMutation({
    mutationFn: ({
      walletId: target,
      action,
    }: {
      walletId: string
      action: 'connect' | 'disconnect' | 'decline'
    }) => setWalletConnection(target, action),
    onSuccess: async () => {
      setMenuFor(undefined)
      await queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
    onError: async (error) => {
      toast.error(error instanceof ApiError ? error.message : 'A carteira não conectou.')
      await queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
  })

  const saveProfile = useMutation({
    mutationFn: (body: Omit<ProfileUpdate, 'bio'>) =>
      updateProfile({ ...body, bio: session.data?.user?.bio ?? '' }),
    onSuccess: async () => {
      setProfileDraft(null)
      setProfileError(null)
      setProfileOpen(false)
      toast.success('Perfil atualizado')
      await queryClient.invalidateQueries({ queryKey: ['session'] })
    },
    onError: (error) => setProfileError(error instanceof ApiError ? error : null),
  })

  const place = useMutation({
    mutationFn: () => {
      if (!quote.data || !selected) throw new Error('Revise o pedido antes de pagar')
      return createOrder(
        {
          walletId: selected.id,
          network: selected.network,
          couponCode,
          expectedTotalEth: quote.data.totalEth,
        },
        orderKey(),
      )
    },
    onSuccess: async (order) => {
      discardOrderKey()
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      await queryClient.setQueryData(['order', userId ?? 'anon', order.id], order)
      void navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
    },
    onError: (error) => {
      // Sem resposta do servidor (timeout/rede) o pedido pode ter sido criado:
      // mantém a chave para o retry reutilizar. Com resposta, o pedido não
      // existe: descarta a chave para a próxima compra não conflitar.
      const noResponse = !(error instanceof ApiError) || error.status === 0
      if (!noResponse) discardOrderKey()
      toast.error(error instanceof ApiError ? error.message : 'O pedido não foi criado.')
      void queryClient.invalidateQueries({ queryKey: ['quote'] })
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  const pending = session.isPending || quote.isPending || wallets.isPending || cart.isPending

  return (
    <form
      className="min-w-0"
      onSubmit={async (event: FormEvent) => {
        event.preventDefault()
        // Confirmação pré-preenchida: o perfil só é persistido se o usuário
        // alterou algo. Falha no perfil impede o pedido (ele ainda não foi
        // enviado, logo a chave de idempotência não é consumida).
        if (profileDirty && profileDraft) {
          try {
            await saveProfile.mutateAsync(profileDraft)
          } catch {
            return
          }
        }
        place.mutate()
      }}
    >
      {pending ? <Skeleton className="h-40 w-full" /> : null}

      {!embedded && cart.data?.items.some((item) => item.changed) ? (
        <p
          role="status"
          className="type-c-13 mb-3 rounded-xl border border-accent px-3 py-2 text-accent"
        >
          O mercado andou enquanto o carrinho estava aberto. Confirme o novo total antes de pagar.
        </p>
      ) : null}

      {!embedded ? (
        <section aria-label="Perfil do colecionador">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="type-b-14-bold text-foreground">Perfil do colecionador</h2>
            {profileOpen ? (
              <button
                type="button"
                className="type-b-14 text-secondary-muted transition-colors hover:text-foreground"
                onClick={closeProfileEditor}
              >
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                aria-expanded={false}
                className="type-b-14 font-bold text-primary underline-offset-2 hover:underline"
                onClick={openProfileEditor}
              >
                Editar
              </button>
            )}
          </div>
          {profileOpen ? (
            <fieldset className="grid gap-3 md:grid-cols-2">
              <legend className="sr-only">Perfil do colecionador</legend>
              <ProfileField label="Nome de exibição" error={profileFieldError('displayName')}>
                <input
                  className={profileInputClass}
                  value={profileValues.displayName}
                  disabled={saveProfile.isPending}
                  onChange={(event) =>
                    setProfileDraft((current) =>
                      current ? { ...current, displayName: event.target.value } : current,
                    )
                  }
                />
              </ProfileField>
              <ProfileField label="Nome de usuário" error={profileFieldError('username')}>
                <input
                  className={profileInputClass}
                  value={profileValues.username}
                  disabled={saveProfile.isPending}
                  onChange={(event) =>
                    setProfileDraft((current) =>
                      current ? { ...current, username: event.target.value } : current,
                    )
                  }
                />
              </ProfileField>
              <ProfileField label="E-mail" error={profileFieldError('email')}>
                <input
                  className={profileInputClass}
                  type="email"
                  autoComplete="email"
                  value={profileValues.email}
                  disabled={saveProfile.isPending}
                  onChange={(event) =>
                    setProfileDraft((current) =>
                      current ? { ...current, email: event.target.value } : current,
                    )
                  }
                />
              </ProfileField>
              <ProfileField label="Nome ENS" error={profileFieldError('ensName')}>
                <input
                  className={profileInputClass}
                  value={profileValues.ensName}
                  disabled={saveProfile.isPending}
                  onChange={(event) =>
                    setProfileDraft((current) =>
                      current ? { ...current, ensName: event.target.value } : current,
                    )
                  }
                />
              </ProfileField>
              <ProfileField label="Apelido da carteira" error={profileFieldError('walletNickname')}>
                <input
                  className={profileInputClass}
                  value={profileValues.walletNickname}
                  disabled={saveProfile.isPending}
                  onChange={(event) =>
                    setProfileDraft((current) =>
                      current ? { ...current, walletNickname: event.target.value } : current,
                    )
                  }
                />
              </ProfileField>
            </fieldset>
          ) : (
            <p className="type-c-13 text-secondary-muted">
              Colecionador {user?.displayName} · {user?.email} · {user?.ensName}
            </p>
          )}
          {profileError ? (
            <p role="alert" className="type-c-13 mt-2 text-destructive">
              {profileError.message}
            </p>
          ) : null}
        </section>
      ) : null}

      <section aria-label="Carteira conectada" className={embedded ? 'mt-5' : undefined}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="type-b-14-bold text-foreground">Carteira conectada</h2>
          <a
            href="/profile/wallets"
            className="type-b-14 font-bold text-primary underline-offset-2 hover:underline"
          >
            Trocar carteira
          </a>
        </div>
        <fieldset className="grid gap-2">
          <legend className="sr-only">Carteiras salvas</legend>
          {wallets.data?.map((wallet) => {
            const checked = (selected?.id ?? '') === wallet.id
            return (
              <label
                key={wallet.id}
                className={
                  checked
                    ? 'relative flex min-w-0 items-center gap-3 rounded-2xl border border-primary/60 bg-surface-panel px-3 py-3'
                    : 'relative flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-surface-panel px-3 py-3'
                }
              >
                <input
                  type="radio"
                  name="wallet"
                  className="size-4 shrink-0 cursor-pointer accent-primary"
                  checked={checked}
                  onChange={() => setWalletId(wallet.id)}
                />
                <span className="min-w-0 flex-1">
                  <span className="type-b-14-bold block truncate text-foreground">
                    {roleLabel(wallet.role)}
                  </span>
                  <span className="type-b-14 block truncate text-foreground">
                    {shortAddress(wallet.address)}
                  </span>
                  <span className="type-c-12 block text-copy-muted">
                    {redeLabel(wallet.network)}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`Ações da carteira ${roleLabel(wallet.role)}`}
                  aria-haspopup="menu"
                  onClick={() =>
                    setMenuFor((current) => (current === wallet.id ? undefined : wallet.id))
                  }
                  className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-secondary-muted transition-colors hover:text-foreground"
                >
                  <MoreVertical className="size-4" />
                </button>
                {menuFor === wallet.id ? (
                  <div
                    role="menu"
                    aria-label={`Carteira ${roleLabel(wallet.role)}`}
                    className="absolute right-2 bottom-2 z-20 flex flex-col rounded-xl border border-border bg-muted p-1 shadow-lg"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="type-b-14 cursor-pointer rounded-lg px-3 py-2 text-left whitespace-nowrap text-foreground hover:bg-surface-inset"
                      onClick={() =>
                        connect.mutate({
                          walletId: wallet.id,
                          action: wallet.connected ? 'disconnect' : 'connect',
                        })
                      }
                    >
                      {wallet.connected ? 'Desconectar' : 'Conectar'}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="type-b-14 cursor-pointer rounded-lg px-3 py-2 text-left whitespace-nowrap text-secondary-muted hover:bg-surface-inset"
                      onClick={() => connect.mutate({ walletId: wallet.id, action: 'decline' })}
                    >
                      Simular recusa
                    </button>
                  </div>
                ) : null}
              </label>
            )
          })}
        </fieldset>
        {wallets.data && wallets.data.length === 0 ? (
          <p className="type-c-13 text-secondary-muted">
            Adicione uma carteira em{' '}
            <a className="text-primary underline-offset-2 hover:underline" href="/profile/wallets">
              Minhas carteiras
            </a>{' '}
            antes de pagar.
          </p>
        ) : null}
      </section>

      <section aria-label="Carteira e rede" className={embedded ? 'mt-5' : 'mt-6'}>
        <h2 className="type-b-14-bold mb-3 text-foreground">Carteira e rede</h2>
        <fieldset className="grid gap-2">
          <legend className="sr-only">Provedor de carteira</legend>
          {(['WalletConnect', 'MetaMask', 'Coinbase Wallet'] as const).map((name) => (
            <label
              key={name}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface-panel px-3 py-2.5"
            >
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-surface-inset text-[13px] font-bold text-primary"
              >
                {name === 'Coinbase Wallet' ? <Wallet className="size-4" /> : name.charAt(0)}
              </span>
              <span className="type-b-14 min-w-0 flex-1 truncate text-foreground">{name}</span>
              <input
                type="radio"
                name="provider"
                className="size-4 shrink-0 cursor-pointer accent-primary"
                checked={provider === name}
                aria-label={name}
                onChange={() => {
                  setProvider(name)
                  if (selected && !selected.connected) {
                    connect.mutate({ walletId: activeWalletId, action: 'connect' })
                  }
                }}
              />
            </label>
          ))}
        </fieldset>
      </section>

      {!embedded ? (
        <div className="mt-7 flex items-baseline justify-end gap-3">
          <span className="type-b-16-bold text-foreground">Total:</span>
          {quote.data ? (
            <span className="type-b-16-bold text-foreground" data-testid="checkout-total">
              {formatEth(quote.data.totalEth)}
            </span>
          ) : (
            <Skeleton className="h-4 w-28" />
          )}
        </div>
      ) : null}

      {quote.data && !quote.data.availabilityOk ? (
        <p role="alert" className="type-c-13 mt-3 text-destructive">
          {quote.data.issues.map((issue) => issue.message).join(' ')}
        </p>
      ) : null}
      {stale ? (
        <p role="status" className="type-c-13 mt-3 text-accent">
          A cotação mudou. Confirme o novo total.
        </p>
      ) : null}
      {quote.data ? (
        <label
          className={
            embedded
              ? 'mt-4 flex cursor-pointer items-start gap-2'
              : 'mt-3 flex cursor-pointer items-start gap-2'
          }
        >
          <input
            type="checkbox"
            className="mt-0.5 size-4 cursor-pointer accent-primary"
            checked={acceptedTotal === quote.data.totalEth}
            onChange={(event) =>
              setAcceptedTotal(event.target.checked ? (quote.data?.totalEth ?? null) : null)
            }
          />
          <span className="type-c-13 text-secondary-muted">
            Confirmo este total, a taxa e a disponibilidade.
          </span>
        </label>
      ) : null}

      <Button
        type="submit"
        className="mt-6 h-12 w-full rounded-full text-[15px] font-bold lg:h-14"
        disabled={
          blocked ||
          acceptedTotal !== quote.data?.totalEth ||
          place.isPending ||
          saveProfile.isPending ||
          !selected
        }
      >
        {place.isPending || saveProfile.isPending ? 'Enviando…' : 'Confirmar compra'}
      </Button>

      {!embedded ? (
        <>
          <div className="mt-8 hidden justify-center gap-2 lg:flex">
            <Button
              type="button"
              variant="outline"
              onClick={() => connect.mutate({ walletId: activeWalletId, action: 'connect' })}
            >
              Conectar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => connect.mutate({ walletId: activeWalletId, action: 'disconnect' })}
            >
              Desconectar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => connect.mutate({ walletId: activeWalletId, action: 'decline' })}
            >
              Simular recusa
            </Button>
          </div>
          <p className="type-c-12 mt-3 hidden text-secondary-muted lg:block">
            Rede da carteira: {selected ? (selected.network as Network) : 'não selecionada'}. Um
            clique repetido reutiliza a mesma chave de idempotência.
          </p>
        </>
      ) : null}
    </form>
  )
}

function roleLabel(role: string | undefined): string {
  if (role === 'primary') return 'Principal'
  if (role === 'secondary') return 'Reserva'
  return 'Nenhuma carteira'
}

function networkLabel(network: string): string {
  if (network === 'ethereum') return 'Ethereum'
  if (network === 'polygon') return 'Polygon'
  if (network === 'base') return 'Base'
  return network
}

function redeLabel(network: string): string {
  if (network === 'ethereum') return 'Rede principal Ethereum'
  return `Rede ${networkLabel(network)}`
}

function shortAddress(address: string): string {
  if (address.length < 12) return address
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}
