import { createFileRoute } from '@tanstack/react-router'
import { NotFoundPage } from '@/components/route-error'

export const Route = createFileRoute('/$')({
  component: NotFoundPage,
  head: () => ({
    meta: [{ title: 'Page not found · Atelier Market' }],
  }),
})
