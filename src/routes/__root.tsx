import { createRootRouteWithContext, HeadContent, Outlet } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { NotFoundPage, RouteError } from '@/components/route-error'
import { Toaster } from '@/components/ui/sonner'
import { sessionQuery } from '@/lib/queries'
import { getSessionEpoch, getStoredUserId, subscribeSession } from '@/lib/storage'
import { RealtimeBridge } from '@/realtime/bridge'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  errorComponent: RouteError,
})

function RootLayout() {
  useSyncExternalStore(subscribeSession, getSessionEpoch, () => 0)
  useQuery(sessionQuery(getStoredUserId()))

  return (
    <>
      <HeadContent />
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Header />
      <div id="content">
        <Outlet />
      </div>
      <RealtimeBridge />
      <Toaster />
    </>
  )
}
