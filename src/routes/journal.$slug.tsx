import { createFileRoute, notFound } from '@tanstack/react-router'
import {
  JournalPostMissing,
  JournalPostPage,
  JournalPostSkeleton,
} from '@/components/journal/journal-post-page'
import { RouteError } from '@/components/route-error'
import { getEditorialPost } from '@/lib/api/editorial'
import { ApiError } from '@/lib/api/errors'
import { queryKeys } from '@/lib/query-keys'
import { getStoredUserId } from '@/lib/storage'

export const Route = createFileRoute('/journal/$slug')({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData({
        queryKey: queryKeys.editorialPost(getStoredUserId(), params.slug),
        queryFn: ({ signal }) => getEditorialPost(params.slug, signal),
      })
    } catch (error) {
      if (error instanceof ApiError && error.code === 'not_found') throw notFound()
      throw error
    }
  },
  head: () => ({
    meta: [
      { title: 'Diário da Cunhagem · Kurio' },
      { name: 'description', content: 'Histórias, guias e insights para colecionadores de NFTs.' },
    ],
  }),
  pendingComponent: JournalPostSkeleton,
  errorComponent: RouteError,
  notFoundComponent: JournalPostMissing,
  component: JournalPostPage,
})
