import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { api } from '@/lib/api/client'
import { clearStoredSession } from '@/lib/storage'
import { getScenario, scenarioDescriptions, scenarios, type Scenario } from '@/mocks/scenario'

export function MockLab() {
  const [open, setOpen] = useState(false)
  const active = getScenario()

  async function choose(scenario: Scenario) {
    await api.post('/dev/scenario', { scenario })
    window.location.assign(`/?scenario=${scenario}&reset=1`)
  }

  async function reset() {
    await api.post('/dev/reset')
    clearStoredSession()
    toast.success('Mock data restored to the seed.')
    window.location.assign('/?reset=1')
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Mock lab
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Mock lab</SheetTitle>
          <SheetDescription>
            Scenarios are deterministic. Reset restores the seed catalog, carts, and accounts.
            Current scenario: {active}.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 px-4 pb-6">
          <Button type="button" variant="secondary" onClick={() => void reset()}>
            Reset to seed
          </Button>
          <ul className="mt-2 flex flex-col gap-2">
            {scenarios.map((scenario) => (
              <li key={scenario}>
                <button
                  type="button"
                  onClick={() => void choose(scenario)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-left hover:bg-muted"
                  aria-current={scenario === active ? 'true' : undefined}
                >
                  <span className="block text-sm font-medium">{scenario}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {scenarioDescriptions[scenario]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  )
}
