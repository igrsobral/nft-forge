import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Field, Page } from '@/components/page'
import { Button } from '@/components/ui/button'
import { changePassword, updateAvatar, updateProfile } from '@/lib/api/account'
import { ApiError } from '@/lib/api/errors'
import { requireSession } from '@/lib/auth'
import { sessionQuery } from '@/lib/queries'
import { getStoredUserId } from '@/lib/storage'

export const Route = createFileRoute('/profile')({
  beforeLoad: ({ location }) => requireSession(location.href),
  head: () => ({ meta: [{ title: 'Profile · Kurio' }] }),
  component: ProfilePage,
})

function ProfilePage() {
  const userId = getStoredUserId()
  const session = useQuery(sessionQuery(userId))
  const user = session.data?.user
  const queryClient = useQueryClient()
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [seenUser, setSeenUser] = useState(user?.id)
  if (user && seenUser !== user.id) {
    setSeenUser(user.id)
    setDisplayName(user.displayName)
    setBio(user.bio)
  }
  const [profileError, setProfileError] = useState<ApiError | null>(null)
  const [passwordError, setPasswordError] = useState<ApiError | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const save = useMutation({
    mutationFn: () => updateProfile({ displayName, bio }),
    onSuccess: async () => {
      setProfileError(null)
      toast.success('Profile saved')
      await queryClient.invalidateQueries({ queryKey: ['session'] })
    },
    onError: (error) => setProfileError(error instanceof ApiError ? error : null),
  })
  const avatar = useMutation({
    mutationFn: (imageDataUrl: string) => updateAvatar(imageDataUrl),
    onSuccess: async () => {
      toast.success('Avatar updated')
      await queryClient.invalidateQueries({ queryKey: ['session'] })
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Avatar was not saved.'),
  })
  const password = useMutation({
    mutationFn: () => changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setPasswordError(null)
      setCurrentPassword('')
      setNewPassword('')
      toast.success('Password changed')
    },
    onError: (error) => setPasswordError(error instanceof ApiError ? error : null),
  })

  const field = (error: ApiError | null, path: string) => error?.details.find((item) => item.path === path)?.message

  return (
    <Page title="Profile">
      {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt="" width={72} height={72} className="size-[72px] rounded-full object-cover" />
      ) : null}
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          save.mutate()
        }}
      >
        <Field label="Display name" error={field(profileError, 'displayName')}>
          <input
            required
            minLength={2}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="type-b-14 h-11 rounded-[10px] border border-line bg-background px-3"
          />
        </Field>
        <Field label="Bio" error={field(profileError, 'bio')}>
          <textarea
            value={bio}
            maxLength={280}
            onChange={(event) => setBio(event.target.value)}
            className="type-b-14 min-h-24 rounded-[10px] border border-line bg-background px-3 py-2"
          />
        </Field>
        {profileError ? <p role="alert" className="text-destructive">{profileError.message}</p> : null}
        <Button type="submit" disabled={save.isPending} className="w-full sm:w-auto">
          Save profile
        </Button>
      </form>
      <Field label="Avatar">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
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
      </Field>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          password.mutate()
        }}
      >
        <Field label="Current password" error={field(passwordError, 'currentPassword')}>
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="type-b-14 h-11 rounded-[10px] border border-line bg-background px-3"
          />
        </Field>
        <Field label="New password" error={field(passwordError, 'newPassword')}>
          <input
            type="password"
            minLength={8}
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="type-b-14 h-11 rounded-[10px] border border-line bg-background px-3"
          />
        </Field>
        {passwordError ? <p role="alert" className="text-destructive">{passwordError.message}</p> : null}
        <Button type="submit" variant="outline" disabled={password.isPending} className="w-full sm:w-auto">
          Change password
        </Button>
      </form>
    </Page>
  )
}
