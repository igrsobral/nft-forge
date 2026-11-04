export const authModes = ['login', 'signup', 'forgot'] as const
export type AuthMode = (typeof authModes)[number]

export type AuthSearch = {
  auth?: AuthMode
  next?: string
}

export function pickAuth(search: Record<string, unknown> | undefined): AuthSearch {
  if (!search) return {}
  const result: AuthSearch = {}
  if (search.auth === 'login' || search.auth === 'signup' || search.auth === 'forgot') {
    result.auth = search.auth
  }
  if (
    typeof search.next === 'string' &&
    search.next.startsWith('/') &&
    !search.next.startsWith('//')
  ) {
    result.next = search.next
  }
  return result
}

export function hrefWithAuth(mode: AuthMode | null, next?: string): string {
  const url = new URL(window.location.href)
  if (mode) url.searchParams.set('auth', mode)
  else url.searchParams.delete('auth')
  if (next) url.searchParams.set('next', next)
  if (!mode) url.searchParams.delete('next')
  return `${url.pathname}${url.search}${url.hash}`
}
