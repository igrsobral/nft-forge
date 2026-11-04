import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { profileInputClass, ProfileField } from '@/components/profile/profile-shell'
import { Button } from '@/components/ui/button'
import { submitSupport } from '@/lib/api/commerce'
import { ApiError } from '@/lib/api/errors'

export const Route = createFileRoute('/profile/support')({
  head: () => ({ meta: [{ title: 'Suporte · Kurio' }] }),
  component: SupportPage,
})

function SupportPage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const field = (path: string) => error?.details.find((item) => item.path === path)?.message
  const send = useMutation({
    mutationFn: () => submitSupport({ subject, message }),
    onSuccess: () => {
      setError(null)
      setSubject('')
      setMessage('')
      toast.success('Mensagem enviada ao suporte')
    },
    onError: (caught) => setError(caught instanceof ApiError ? caught : null),
  })
  return (
    <section className="max-w-xl">
      <h2 className="type-b-16-bold mb-4 text-foreground">Suporte</h2>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          send.mutate()
        }}
      >
        <ProfileField label="Assunto" error={field('subject')}>
          <input
            className={profileInputClass}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          />
        </ProfileField>
        <ProfileField label="Mensagem" error={field('message')}>
          <textarea
            className={`${profileInputClass} min-h-28 py-2`}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </ProfileField>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error.message}
          </p>
        ) : null}
        <Button type="submit" className="h-11 w-fit" disabled={send.isPending}>
          Enviar
        </Button>
      </form>
    </section>
  )
}
