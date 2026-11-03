import { redirect } from '@tanstack/react-router'
import { getStoredToken } from '@/lib/storage'

export function requireSession(href: string): void {
  if (getStoredToken()) return
  throw redirect({
    to: '/login',
    search: { redirect: safeRedirect(href) },
  })
}

export function safeRedirect(value: string | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/'
  return value
}
