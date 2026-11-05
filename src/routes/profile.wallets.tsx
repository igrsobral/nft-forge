import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { ProfileField, profileInputClass } from '@/components/profile/profile-shell'
import { Button } from '@/components/ui/button'
import type { Wallet } from '@/contracts/account'
import type { Network, WalletRole } from '@/contracts/common'
import { createWallet, updateWallet } from '@/lib/api/account'
import { ApiError } from '@/lib/api/errors'
import { sessionQuery, walletsQuery } from '@/lib/queries'
import { getStoredUserId } from '@/lib/storage'

export const Route = createFileRoute('/profile/wallets')({
  head: () => ({ meta: [{ title: 'Carteiras · Kurio' }] }),
  component: WalletsPage,
})

const empty = {
  displayName: '',
  label: '',
  network: 'ethereum' as Network,
  profileName: '',
  address: '',
  ensName: '',
  role: 'secondary' as WalletRole,
  referralCode: '',
  contactEmail: '',
}

function WalletsPage() {
  const userId = getStoredUserId()
  const session = useQuery(sessionQuery(userId))
  const wallets = useQuery({ ...walletsQuery(userId), enabled: Boolean(userId) })
  const user = session.data?.user
  const primary = wallets.data?.find((wallet) => wallet.role === 'primary')
  const secondary = wallets.data?.find((wallet) => wallet.role === 'secondary')
  const [adding, setAdding] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)

  return (
    <div className="grid gap-10">
      <section aria-labelledby="carteira-principal">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 id="carteira-principal" className="type-b-16-bold text-foreground">
            Carteira principal
          </h2>
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => setAdding(true)}
          >
            Adicionar
          </button>
        </div>
        <p className="mb-5 max-w-xl text-sm text-secondary-muted">
          Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
        </p>
        <WalletForm
          key={primary?.id ?? 'new-primary'}
          wallet={primary}
          walletRole="primary"
          defaults={{
            displayName: primary?.displayName || user?.displayName || '',
            label: primary?.label || user?.walletNickname || '',
            network: primary?.network ?? 'ethereum',
            profileName: primary?.profileName || user?.username || '',
            address: primary?.address ?? '',
            ensName: primary?.ensName || user?.ensName || '',
            role: 'primary',
            referralCode: primary?.referralCode || 'KURIO',
            contactEmail: primary?.contactEmail || user?.email || '',
          }}
          submitLabel="Salvar carteira"
        />
      </section>
      <section id="secundaria">
        <h2 className="type-b-16-bold text-foreground">Carteira secundária</h2>
        {secondary ? (
          <div className="mt-4">
            <WalletForm
              key={secondary.id}
              wallet={secondary}
              walletRole="secondary"
              defaults={{
                displayName: secondary.displayName,
                label: secondary.label,
                network: secondary.network,
                profileName: secondary.profileName,
                address: secondary.address,
                ensName: secondary.ensName,
                role: 'secondary',
                referralCode: secondary.referralCode,
                contactEmail: secondary.contactEmail,
              }}
              submitLabel="Salvar carteira"
            />
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-secondary-muted">
              Você ainda não adicionou uma carteira secundária.
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={sameAsPrimary}
                  onChange={(event) => setSameAsPrimary(event.target.checked)}
                />
                Igual à carteira principal
              </label>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setAdding(true)}
              >
                Adicionar
              </button>
            </div>
            {adding ? (
              <div className="mt-4">
                <WalletForm
                  walletRole="secondary"
                  defaults={
                    sameAsPrimary && primary
                      ? {
                          displayName: primary.displayName,
                          label: `${primary.label} 2`,
                          network: primary.network,
                          profileName: primary.profileName,
                          address: primary.address,
                          ensName: primary.ensName,
                          role: 'secondary',
                          referralCode: primary.referralCode || 'KURIO',
                          contactEmail: primary.contactEmail || user?.email || '',
                        }
                      : { ...empty, role: 'secondary' }
                  }
                  submitLabel="Salvar carteira"
                  onDone={() => setAdding(false)}
                />
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  )
}

function WalletForm({
  wallet,
  walletRole,
  defaults,
  submitLabel,
  onDone,
}: {
  wallet?: Wallet
  walletRole: WalletRole
  defaults: typeof empty
  submitLabel: string
  onDone?: () => void
}) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState(defaults)
  const [error, setError] = useState<ApiError | null>(null)
  const field = (path: string) => error?.details.find((item) => item.path === path)?.message
  const set = (key: keyof typeof empty) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [key]: event.target.value }))

  const save = useMutation({
    mutationFn: () => {
      const body = {
        label: values.label,
        address: values.address,
        network: values.network,
        role: walletRole,
        displayName: values.displayName,
        profileName: values.profileName,
        ensName: values.ensName,
        referralCode: values.referralCode,
        contactEmail: values.contactEmail,
      }
      return wallet ? updateWallet(wallet.id, body) : createWallet(body)
    },
    onSuccess: async () => {
      setError(null)
      toast.success('Carteira salva')
      await queryClient.invalidateQueries({ queryKey: ['wallets'] })
      onDone?.()
    },
    onError: (caught) => setError(caught instanceof ApiError ? caught : null),
  })

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate()
      }}
    >
      <ProfileField label="Nome de exibição" error={field('displayName')}>
        <input
          className={profileInputClass}
          value={values.displayName}
          onChange={set('displayName')}
        />
      </ProfileField>
      <ProfileField label="Apelido da carteira" error={field('label')}>
        <input className={profileInputClass} value={values.label} onChange={set('label')} />
      </ProfileField>
      <ProfileField label="Rede" error={field('network')}>
        <select
          className={profileInputClass}
          value={values.network}
          onChange={(event) =>
            setValues((current) => ({ ...current, network: event.target.value as Network }))
          }
        >
          <option value="ethereum">Ethereum</option>
          <option value="polygon">Polygon</option>
          <option value="base">Base</option>
        </select>
      </ProfileField>
      <ProfileField label="Nome do perfil" error={field('profileName')}>
        <input
          className={profileInputClass}
          value={values.profileName}
          onChange={set('profileName')}
        />
      </ProfileField>
      <ProfileField label="Endereço da carteira" error={field('address')}>
        <input
          className={profileInputClass}
          placeholder="Endereço 0x da carteira"
          value={values.address}
          onChange={set('address')}
        />
      </ProfileField>
      <ProfileField label="ENS ou carteira secundária (opcional)" error={field('ensName')}>
        <input className={profileInputClass} value={values.ensName} onChange={set('ensName')} />
      </ProfileField>
      <ProfileField label="Tipo de carteira" error={field('role')}>
        <select className={profileInputClass} value={walletRole} disabled>
          <option value="primary">Principal</option>
          <option value="secondary">Secundária</option>
        </select>
      </ProfileField>
      <ProfileField label="Código de indicação" error={field('referralCode')}>
        <input
          className={profileInputClass}
          value={values.referralCode}
          onChange={set('referralCode')}
        />
      </ProfileField>
      <ProfileField label="E-mail" error={field('contactEmail')}>
        <input
          className={profileInputClass}
          value={values.contactEmail}
          onChange={set('contactEmail')}
        />
      </ProfileField>
      <ProfileField label="Nome ENS">
        <span className="flex">
          <span className="flex h-11 items-center rounded-l-md border border-r-0 border-line-strong bg-surface-inset px-3 text-sm text-secondary-muted">
            .eth
          </span>
          <input
            className={`${profileInputClass} rounded-l-none`}
            value={values.ensName}
            onChange={set('ensName')}
          />
        </span>
      </ProfileField>
      {error ? (
        <p role="alert" className="text-sm text-destructive md:col-span-2">
          {error.message}
        </p>
      ) : null}
      <Button
        type="submit"
        className="h-11 w-full md:col-span-2 md:w-fit"
        disabled={save.isPending}
      >
        {submitLabel}
      </Button>
    </form>
  )
}
