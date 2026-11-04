import { createFileRoute, redirect } from '@tanstack/react-router'
import { safeRedirect } from '@/lib/auth'

export const Route = createFileRoute('/signup')({
  validateSearch: (search: Record<string, unknown>) => {
    const target = typeof search.redirect === 'string' ? safeRedirect(search.redirect) : undefined
    return target && target !== '/' ? { redirect: target } : {}
  },
  beforeLoad: ({ search }) => {
    throw redirect({
      to: '/',
      search: search.redirect ? { auth: 'signup', next: search.redirect } : { auth: 'signup' },
    })
  },
  component: () => null,
})
