import { removeStorage, storageKeys } from '@/lib/storage'
import { isScenario, setScenario } from './scenario'

/** Read mock controls before the router rewrites the URL and before MSW hydrates state. */
export function captureMockControlFromLocation(): void {
  const params = new URLSearchParams(window.location.search)
  const scenario = params.get('scenario')
  if (isScenario(scenario)) setScenario(scenario)
  if (params.get('reset') === '1') {
    removeStorage(storageKeys.db)
    removeStorage(storageKeys.token)
    removeStorage(storageKeys.userId)
  }
}
