import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/profile/downloads')({
  head: () => ({ meta: [{ title: 'Arquivos baixados · Kurio' }] }),
  component: () => (
    <section>
      <h2 className="type-b-16-bold mb-3 text-foreground">Arquivos baixados</h2>
      <p className="text-sm text-secondary-muted">
        Nenhum arquivo baixado. Os comprovantes e metadados que você exportar ficam nesta lista.
      </p>
    </section>
  ),
})
