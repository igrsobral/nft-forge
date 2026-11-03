import { envScenario } from '@/lib/env'
import { readStorage, storageKeys, writeStorage } from '@/lib/storage'

export const scenarios = [
  'success',
  'empty',
  'latency',
  'offline',
  'http_error',
  'expired_session',
  'unauthorized',
  'signup_conflict',
  'invalid_coupon',
  'expired_coupon',
  'price_changed',
  'sold_out',
  'order_timeout',
  'payment_confirmed',
  'payment_declined',
] as const

export type Scenario = (typeof scenarios)[number]

export const scenarioDescriptions: Record<Scenario, string> = {
  success: 'Catalog, detail, and a confirmed payment after a short pending state.',
  empty: 'NFT search returns no rows. Direct detail links still resolve.',
  latency: 'Deterministic per-URL delay so later requests can finish first.',
  offline: 'Every API call fails like a dropped connection. Dev controls still answer.',
  http_error: 'Reads and writes return a transient 503.',
  expired_session: 'Any request carrying a session token returns 401.',
  unauthorized: 'A signed-in collector receives 403 on private resources.',
  signup_conflict: 'Account creation always conflicts, even for a new email.',
  invalid_coupon: 'Every coupon code is rejected as invalid.',
  expired_coupon: 'Every coupon code is rejected as expired.',
  price_changed: 'Checkout mutates the price and refuses the stale total.',
  sold_out: 'Checkout marks the cart editions sold out and refuses the order.',
  order_timeout: 'The order is stored, then the response hangs so a retry can reuse the key.',
  payment_confirmed: 'The order is confirmed in the create response and on the socket.',
  payment_declined: 'The order stays pending, then the socket marks it declined.',
}

export function isScenario(value: string | null | undefined): value is Scenario {
  return scenarios.some((scenario) => scenario === value)
}

export function getScenario(): Scenario {
  const stored = readStorage(storageKeys.scenario)
  if (isScenario(stored)) return stored
  if (isScenario(envScenario)) return envScenario
  return 'success'
}

export function setScenario(scenario: Scenario): void {
  writeStorage(storageKeys.scenario, scenario)
}
