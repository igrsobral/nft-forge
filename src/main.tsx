import { mocksEnabled, otelEnabled, otelEndpoint } from '@/lib/env'
import { captureMockControlFromLocation } from '@/mocks/control'

if (otelEnabled && otelEndpoint) {
  void import('@/lib/telemetry').then((telemetry) => telemetry.initTelemetry())
}

captureMockControlFromLocation()

async function start() {
  const bootstrap = import('@/bootstrap')
  void bootstrap.catch(() => {})
  if (mocksEnabled) {
    const { worker } = await import('@/mocks/browser')
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: { url: '/mockServiceWorker.js' },
      quiet: true,
    })
  }
  const { mountApp } = await bootstrap
  mountApp()
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
