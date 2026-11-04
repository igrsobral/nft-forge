import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { profileInputClass, ProfileField } from '@/components/profile/profile-shell'
import { Button } from '@/components/ui/button'
import { changePassword, updateAvatar, updateProfile } from '@/lib/api/account'
import { ApiError } from '@/lib/api/errors'
import { sessionQuery } from '@/lib/queries'
import { getStoredUserId } from '@/lib/storage'

export const Route = createFileRoute('/profile/')({
  head: () => ({ meta: [{ title: 'Perfil do colecionador · Kurio' }] }),
  component: ProfileDetailsPage,
})

function ProfileDetailsPage() {
  const userId = getStoredUserId()
  const session = useQuery(sessionQuery(userId))
  const user = session.data?.user
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [ensName, setEnsName] = useState(user?.ensName ?? '')
  const [walletNickname, setWalletNickname] = useState(user?.walletNickname ?? '')
  const [seenUser, setSeenUser] = useState(user?.id)
  if (user && seenUser !== user.id) {
    setSeenUser(user.id)
    setDisplayName(user.displayName)
    setUsername(user.username)
    setEmail(user.email)
    setEnsName(user.ensName)
    setWalletNickname(user.walletNickname)
  }
  const [profileError, setProfileError] = useState<ApiError | null>(null)
  const [passwordError, setPasswordError] = useState<ApiError | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const save = useMutation({
    mutationFn: () =>
      updateProfile({
        displayName,
        username,
        email,
        ensName,
        walletNickname,
        bio: user?.bio ?? '',
      }),
    onSuccess: async () => {
      setProfileError(null)
      toast.success('Perfil salvo')
      await queryClient.invalidateQueries({ queryKey: ['session'] })
    },
    onError: (error) => setProfileError(error instanceof ApiError ? error : null),
  })
  const avatar = useMutation({
    mutationFn: (imageDataUrl: string | null) => updateAvatar(imageDataUrl),
    onSuccess: async () => {
      toast.success('Avatar atualizado')
      await queryClient.invalidateQueries({ queryKey: ['session'] })
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : 'O avatar não foi salvo.'),
  })
  const password = useMutation({
    mutationFn: () => changePassword({ currentPassword, newPassword, confirmPassword }),
    onSuccess: () => {
      setPasswordError(null)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Senha alterada')
    },
    onError: (error) => setPasswordError(error instanceof ApiError ? error : null),
  })
  const field = (error: ApiError | null, path: string) =>
    error?.details.find((item) => item.path === path)?.message

  return (
    <form
      className="grid gap-8"
      onSubmit={(event) => {
        event.preventDefault()
        const passwordTouched = Boolean(currentPassword || newPassword || confirmPassword)
        save.mutate(undefined, {
          onSuccess: () => {
            if (passwordTouched) password.mutate()
          },
        })
      }}
    >
      <section>
        <h2 className="type-b-16-bold mb-5 text-foreground">Perfil do colecionador</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <ProfileField label="Nome de exibição" error={field(profileError, 'displayName')}>
            <input
              className={profileInputClass}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </ProfileField>
          <ProfileField label="Nome de usuário" error={field(profileError, 'username')}>
            <input
              className={profileInputClass}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </ProfileField>
          <ProfileField label="E-mail" error={field(profileError, 'email')}>
            <input
              className={profileInputClass}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </ProfileField>
          <ProfileField label="Nome ENS" error={field(profileError, 'ensName')}>
            <span className="flex">
              <span className="flex h-11 items-center rounded-l-md border border-r-0 border-[#6a4332] bg-[#1a100c] px-3 text-sm text-[#c9a27a]">
                .eth
              </span>
              <input
                className={`${profileInputClass} rounded-l-none`}
                value={ensName}
                onChange={(event) => setEnsName(event.target.value)}
              />
            </span>
          </ProfileField>
          <ProfileField label="Apelido da carteira" error={field(profileError, 'walletNickname')}>
            <input
              className={profileInputClass}
              value={walletNickname}
              onChange={(event) => setWalletNickname(event.target.value)}
            />
          </ProfileField>
          <div className="flex items-center gap-3">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="size-16 rounded-full object-cover" />
            ) : (
              <span className="flex size-16 items-center justify-center rounded-full border border-[#6a4332] text-xs text-[#c9a27a]">
                Avatar
              </span>
            )}
            <input
              ref={fileRef}
              data-testid="avatar-file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                  if (typeof reader.result === 'string') avatar.mutate(reader.result)
                }
                reader.readAsDataURL(file)
              }}
            />
            <Button type="button" className="h-9 px-4" onClick={() => fileRef.current?.click()}>
              Alterar
            </Button>
            <button
              type="button"
              className="text-sm text-[#c9a27a] hover:text-primary"
              onClick={() => avatar.mutate(null)}
            >
              Remover
            </button>
          </div>
        </div>
        {profileError ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {profileError.message}
          </p>
        ) : null}
      </section>
      <section className="grid max-w-xl gap-4">
        <h2 className="type-b-16-bold text-foreground">Alterar senha</h2>
        <PasswordField
          label="Senha atual"
          value={currentPassword}
          autoComplete="current-password"
          error={field(passwordError, 'currentPassword')}
          onChange={setCurrentPassword}
        />
        <PasswordField
          label="Nova senha"
          value={newPassword}
          autoComplete="new-password"
          error={field(passwordError, 'newPassword')}
          onChange={setNewPassword}
        />
        <PasswordField
          label="Confirmar nova senha"
          value={confirmPassword}
          autoComplete="new-password"
          error={field(passwordError, 'confirmPassword')}
          onChange={setConfirmPassword}
        />
        {passwordError ? (
          <p role="alert" className="text-sm text-destructive">
            {passwordError.message}
          </p>
        ) : null}
      </section>
      <Button
        type="submit"
        className="h-11 w-full max-w-xs"
        disabled={save.isPending || password.isPending}
      >
        Salvar
      </Button>
    </form>
  )
}

function PasswordField({
  label,
  value,
  autoComplete,
  error,
  onChange,
}: {
  label: string
  value: string
  autoComplete: string
  error?: string
  onChange: (value: string) => void
}) {
  const [shown, setShown] = useState(false)
  const id = label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm text-foreground">
        {label}
      </label>
      <span className="relative block">
        <input
          id={id}
          type={shown ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${profileInputClass} pr-11`}
        />
        <button
          type="button"
          aria-label={shown ? `Ocultar ${label}` : `Mostrar ${label}`}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-[#c9a27a]"
          onClick={() => setShown((current) => !current)}
        >
          {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  )
}
