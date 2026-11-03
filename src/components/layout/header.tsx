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
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="mr-auto flex items-center gap-2 font-semibold tracking-tight">
          <span aria-hidden className="size-2.5 rounded-full bg-primary" />
          Atelier Market
        </Link>
        <span
          data-testid="socket-status"
          role="status"
          className="text-xs tracking-wide text-muted-foreground uppercase"
        >
          {statusLabel[status]}
        </span>
        <MockLab />
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
                <dt className="text-muted-foreground">Ada Marlowe</dt>
                <dd>ada@collector.dev · orchid-harbor</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Leo Okonkwo</dt>
                <dd>leo@collector.dev · marble-gallery</dd>
              </div>
            </dl>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}
