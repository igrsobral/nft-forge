import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Field, Page } from '@/components/page'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api/errors'
import { login } from '@/lib/api/account'
import { safeRedirect } from '@/lib/auth'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => {
    const redirect = typeof search.redirect === 'string' ? safeRedirect(search.redirect) : undefined
    return redirect && redirect !== '/' ? { redirect } : {}
  },
  head: () => ({ meta: [{ title: 'Sign in · Kurio' }] }),
  component: LoginPage,
})

function LoginPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <Page title="Sign in">
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          setPending(true)
          setError(null)
          void login({ email, password })
            .then(() => {
              const target = safeRedirect(search.redirect)
              window.location.assign(target)
            })
            .catch((caught: unknown) => {
              setError(caught instanceof ApiError ? caught : null)
              setPending(false)
            })
        }}
      >
        <Field label="Email" error={error?.details.find((item) => item.path === 'email')?.message}>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="type-b-14 h-11 rounded-[10px] border border-line bg-background px-3"
          />
        </Field>
        <Field
          label="Password"
          error={error?.details.find((item) => item.path === 'password')?.message}
        >
          <input
            type="password"
            required
            autoComplete="current-password"
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
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
        <button
          type="button"
          className="type-b-14 text-left text-accent"
          onClick={() => void navigate({ to: '/signup', search: search.redirect ? { redirect: search.redirect } : {} })}
        >
          Create an account
        </button>
      </form>
    </Page>
  )
}
