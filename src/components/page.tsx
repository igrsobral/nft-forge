import type { ReactNode } from 'react'

export function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 lg:px-10 lg:py-10">
      <h1 className="type-t-18-bold text-foreground lg:text-[32px] lg:leading-tight">{title}</h1>
      {children}
    </main>
  )
}

export function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-1">
      <span className="type-b-14 text-text-secondary">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="type-c-12 text-destructive">
          {error}
        </span>
      ) : null}
    </label>
  )
}
