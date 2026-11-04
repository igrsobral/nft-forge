import { describe, expect, it } from 'vitest'
import { createEventMemory } from './dedupe'

describe('socket event memory', () => {
  it('drops a duplicate and forgets the oldest id past the cap', () => {
    const memory = createEventMemory(2)
    expect(memory.remember('a')).toBe(true)
    expect(memory.remember('a')).toBe(false)
    expect(memory.remember('b')).toBe(true)
    expect(memory.remember('c')).toBe(true)
    expect(memory.remember('a')).toBe(true)
  })
})
