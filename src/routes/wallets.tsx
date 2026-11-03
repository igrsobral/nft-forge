import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Field, Page } from '@/components/page'
import { Button } from '@/components/ui/button'
import type { Network, WalletRole } from '@/contracts/common'
import { createWallet, setWalletConnection, updateWallet } from '@/lib/api/account'
import { ApiError } from '@/lib/api/errors'
import { requireSession } from '@/lib/auth'
import { walletsQuery } from '@/lib/queries'
import { getStoredUserId } from '@/lib/storage'

export const Route = createFileRoute('/wallets')({
  beforeLoad: ({ location }) => requireSession(location.href),
  head: () => ({ meta: [{ title: 'Wallets · Kurio' }] }),
  component: WalletsPage,
})

const inputClass = 'type-b-14 h-11 w-full rounded-[10px] border border-line bg-background px-3'

function WalletsPage() {
  const userId = getStoredUserId()
  const wallets = useQuery({ ...walletsQuery(userId), enabled: Boolean(userId) })
  const queryClient = useQueryClient()
  const [label, setLabel] = useState('')
  const [address, setAddress] = useState('')
  const [network, setNetwork] = useState<Network>('ethereum')
  const [role, setRole] = useState<WalletRole>('secondary')
  const [error, setError] = useState<ApiError | null>(null)

  const create = useMutation({
    mutationFn: () => createWallet({ label, address, network, role }),
    onSuccess: async () => {
      setError(null)
      setLabel('')
      setAddress('')
      toast.success('Wallet saved')
      await queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
    onError: (caught) => setError(caught instanceof ApiError ? caught : null),
  })
  const connect = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'connect' | 'disconnect' | 'decline' }) =>
      setWalletConnection(id, action),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
    onError: (caught) => toast.error(caught instanceof ApiError ? caught.message : 'Connection failed.'),
  })
  const save = useMutation({
    mutationFn: (body: { id: string; label: string; address: string; network: Network; role: WalletRole }) =>
      updateWallet(body.id, body),
    onSuccess: async () => {
      toast.success('Wallet updated')
      await queryClient.invalidateQueries({ queryKey: ['wallets'] })
    },
    onError: (caught) => toast.error(caught instanceof ApiError ? caught.message : 'Wallet was not updated.'),
  })

  return (
    <Page title="Wallets">
      <ul className="grid gap-4">
        {wallets.data?.map((wallet) => (
          <li key={wallet.id}>
            <WalletEditor
              wallet={wallet}
              onSave={(body) => save.mutate({ id: wallet.id, ...body })}
              onConnect={(action) => connect.mutate({ id: wallet.id, action })}
            />
          </li>
        ))}
      </ul>
      {(wallets.data?.length ?? 0) < 2 ? (
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            create.mutate()
          }}
        >
          <Field label="Label" error={error?.details.find((item) => item.path === 'label')?.message}>
            <input className={inputClass} required minLength={2} value={label} onChange={(event) => setLabel(event.target.value)} />
          </Field>
          <Field label="Address" error={error?.details.find((item) => item.path === 'address')?.message}>
            <input className={inputClass} required value={address} onChange={(event) => setAddress(event.target.value)} />
          </Field>
          <Field label="Network">
            <select className={inputClass} value={network} onChange={(event) => setNetwork(event.target.value as Network)}>
              <option value="ethereum">ethereum</option>
              <option value="polygon">polygon</option>
              <option value="base">base</option>
            </select>
          </Field>
          <Field label="Role">
            <select className={inputClass} value={role} onChange={(event) => setRole(event.target.value as WalletRole)}>
              <option value="primary">primary</option>
              <option value="secondary">secondary</option>
            </select>
          </Field>
          {error ? <p role="alert" className="text-destructive">{error.message}</p> : null}
          <Button type="submit" className="w-full sm:w-auto">Add wallet</Button>
        </form>
      ) : (
        <p className="type-b-14 text-text-secondary">Primary and secondary wallets are both on file.</p>
      )}
    </Page>
  )
}

function WalletEditor({
  wallet,
  onSave,
  onConnect,
}: {
  wallet: { id: string; label: string; address: string; network: Network; role: WalletRole; connected: boolean }
  onSave: (body: { label: string; address: string; network: Network; role: WalletRole }) => void
  onConnect: (action: 'connect' | 'disconnect' | 'decline') => void
}) {
  const [label, setLabel] = useState(wallet.label)
  const [address, setAddress] = useState(wallet.address)
  const [network, setNetwork] = useState(wallet.network)
  const [role, setRole] = useState(wallet.role)
  return (
    <form
      className="grid gap-3 rounded-[14px] border border-line p-3"
      onSubmit={(event) => {
        event.preventDefault()
        onSave({ label, address, network, role })
      }}
    >
      <p className="type-c-12 text-text-secondary">{wallet.connected ? 'Connected' : 'Disconnected'}</p>
      <Field label="Label">
        <input className={inputClass} value={label} onChange={(event) => setLabel(event.target.value)} />
      </Field>
      <Field label="Address">
        <input className={inputClass} value={address} onChange={(event) => setAddress(event.target.value)} />
      </Field>
      <Field label="Network">
        <select className={inputClass} value={network} onChange={(event) => setNetwork(event.target.value as Network)}>
          <option value="ethereum">ethereum</option>
          <option value="polygon">polygon</option>
          <option value="base">base</option>
        </select>
      </Field>
      <Field label="Role">
        <select className={inputClass} value={role} onChange={(event) => setRole(event.target.value as WalletRole)}>
          <option value="primary">primary</option>
          <option value="secondary">secondary</option>
        </select>
      </Field>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" className="w-full sm:w-auto">Save wallet</Button>
        <Button type="button" variant="outline" onClick={() => onConnect(wallet.connected ? 'disconnect' : 'connect')}>
          {wallet.connected ? 'Disconnect' : 'Connect'}
        </Button>
      </div>
    </form>
  )
}
