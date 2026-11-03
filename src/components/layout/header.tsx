import { Link } from '@tanstack/react-router'
import { useSyncExternalStore } from 'react'
import { MockLab } from '@/components/mock-lab'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { getSocketStatus, subscribeSocketStatus } from '@/realtime/socket'

const statusLabel = {
  connecting: 'Connecting',
  live: 'Live',
  offline: 'Offline',
} as const

export function Header() {
  const status = useSyncExternalStore(
    subscribeSocketStatus,
    getSocketStatus,
    () => 'connecting' as const,
  )

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 lg:items-start lg:justify-between lg:px-10 lg:pt-6">
        <Link to="/" aria-label="Kurio, home" className="type-wordmark text-foreground">
          KURIO
        </Link>
        <nav aria-label="Primary" className="hidden lg:block">
          <Link
            to="/"
            aria-current="page"
            className="type-b-16 flex flex-col gap-3 font-bold text-accent"
          >
            Marketplace
            <span aria-hidden className="h-[3px] w-full bg-primary" />
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0 lg:gap-4">
          <span
            data-testid="socket-status"
            role="status"
            className="type-c-12 tracking-wide text-text-secondary uppercase"
          >
            {statusLabel[status]}
          </span>
          <span className="hidden sm:contents">
            <MockLab />
          </span>
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" size="sm">
                Sign in
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sign-in is the next stage</DialogTitle>
                <DialogDescription>
                  Accounts, checkout, and wallets are wired in the mock API. This foundation slice
                  does not submit a login. Demo passwords are hashed, not stored in clear text.
                </DialogDescription>
              </DialogHeader>
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-text-secondary">Ada Marlowe</dt>
                  <dd>ada@collector.dev · orchid-harbor</dd>
                </div>
                <div>
                  <dt className="text-text-secondary">Leo Okonkwo</dt>
                  <dd>leo@collector.dev · marble-gallery</dd>
                </div>
              </dl>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div aria-hidden className="mx-4 hidden border-t border-primary/30 lg:mx-10 lg:block" />
    </header>
  )
}
