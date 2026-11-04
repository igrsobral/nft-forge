export function createEventMemory(limit = 200) {
  const seen = new Set<string>()
  return {
    remember(eventId: string): boolean {
      if (seen.has(eventId)) return false
      seen.add(eventId)
      if (seen.size > limit) {
        const oldest = seen.values().next().value
        if (oldest) seen.delete(oldest)
      }
      return true
    },
  }
}

export const eventMemory = createEventMemory()
