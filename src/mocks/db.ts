import { readStorage, storageKeys, writeStorage } from '@/lib/storage'
import { createSeed, type Database } from './seed'

let memory: Database | null = null

function isDatabase(value: unknown): value is Database {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<Database>
  return (
    record.schemaVersion === 3 &&
    Array.isArray(record.nfts) &&
    record.nfts.length > 0 &&
    Array.isArray(record.users)
  )
}

export function getDb(): Database {
  if (memory) return memory
  const raw = readStorage(storageKeys.db)
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (isDatabase(parsed)) {
        memory = parsed
        return memory
      }
    } catch {
      // Corrupt storage falls through to the seed.
    }
  }
  memory = createSeed()
  persist(memory)
  return memory
}

export function persist(db: Database = getDb()): void {
  memory = db
  writeStorage(storageKeys.db, JSON.stringify(db))
}

export function resetDb(): Database {
  memory = createSeed()
  persist(memory)
  return memory
}
