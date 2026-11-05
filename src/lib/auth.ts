import { redirect } from '@tanstack/react-router'
import { getStoredToken } from '@/lib/storage'

export function requireSession(href: string): void {
  if (getStoredToken()) return
  const next = safeRedirect(href)
  throw redirect({
    to: '/',
    search: next === '/' ? { auth: 'login' } : { auth: 'login', next },
  })
}

export function safeRedirect(value: string | undefined): string {
  if (!value?.startsWith('/') || value.startsWith('//')) return '/'
  return value
}
