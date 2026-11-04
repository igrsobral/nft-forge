import { createFileRoute, redirect } from '@tanstack/react-router'
import { safeRedirect } from '@/lib/auth'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => {
    const target = typeof search.redirect === 'string' ? safeRedirect(search.redirect) : undefined
    return target && target !== '/' ? { redirect: target } : {}
  },
  beforeLoad: ({ search }) => {
    throw redirect({
      to: '/',
      search: search.redirect ? { auth: 'login', next: search.redirect } : { auth: 'login' },
    })
  },
  component: () => null,
})
