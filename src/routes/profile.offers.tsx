import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/profile/offers')({
  head: () => ({ meta: [{ title: 'Ofertas · Kurio' }] }),
  component: () => (
    <section>
      <h2 className="type-b-16-bold mb-3 text-foreground">Ofertas</h2>
      <p className="text-sm text-secondary-muted">
        Nenhuma oferta recebida. Quando alguém ofertar por uma edição sua, ela aparece aqui.
      </p>
    </section>
  ),
})
