import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Field, Page } from '@/components/page'
import { Button } from '@/components/ui/button'
import { signup } from '@/lib/api/account'
import { ApiError } from '@/lib/api/errors'
import { safeRedirect } from '@/lib/auth'

export const Route = createFileRoute('/signup')({
  validateSearch: (search: Record<string, unknown>) => {
    const redirect = typeof search.redirect === 'string' ? safeRedirect(search.redirect) : undefined
    return redirect && redirect !== '/' ? { redirect } : {}
  },
  head: () => ({ meta: [{ title: 'Create account · Kurio' }] }),
  component: SignupPage,
})

function SignupPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [pending, setPending] = useState(false)
  const field = (path: string) => error?.details.find((item) => item.path === path)?.message

  return (
    <Page title="Create account">
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          setPending(true)
          setError(null)
          void signup({ displayName, email, password })
            .then(() => window.location.assign(safeRedirect(search.redirect)))
            .catch((caught: unknown) => {
              setError(caught instanceof ApiError ? caught : null)
              setPending(false)
            })
        }}
      >
        <Field label="Display name" error={field('displayName')}>
          <input
            required
            minLength={2}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="type-b-14 h-11 rounded-[10px] border border-line bg-background px-3"
          />
        </Field>
        <Field label="Email" error={field('email')}>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="type-b-14 h-11 rounded-[10px] border border-line bg-background px-3"
          />
        </Field>
        <Field label="Password" error={field('password')}>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="type-b-14 h-11 rounded-[10px] border border-line bg-background px-3"
          />
        </Field>
        {error ? (
          <p role="alert" className="type-c-13 text-destructive">
            {error.message}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? 'Creating…' : 'Create account'}
        </Button>
        <button
          type="button"
          className="type-b-14 text-left text-accent"
          onClick={() => void navigate({ to: '/login', search: search.redirect ? { redirect: search.redirect } : {} })}
        >
          Already collecting? Sign in
        </button>
      </form>
    </Page>
  )
}
