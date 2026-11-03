import { mocksEnabled } from '@/lib/env'
import { captureMockControlFromLocation } from '@/mocks/control'

captureMockControlFromLocation()

async function start() {
  if (mocksEnabled) {
    const { worker } = await import('@/mocks/browser')
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: '/mockServiceWorker.js' },
      quiet: true,
    })
  }
  await import('@/bootstrap')
}

void start().catch((error: unknown) => {
  const root = document.getElementById('root')
  const message = error instanceof Error ? error.message : 'The marketplace could not start.'
  if (root) {
    root.replaceChildren()
    const alert = document.createElement('p')
    alert.setAttribute('role', 'alert')
    alert.textContent = message
    root.append(alert)
  }
  console.error(error)
})
