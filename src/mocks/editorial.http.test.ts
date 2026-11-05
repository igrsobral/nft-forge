import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { getEditorialHome, getEditorialPost } from '@/lib/api/editorial'
import type { ApiError } from '@/lib/api/errors'
import { httpHandlers } from './http'

const server = setupServer(...httpHandlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('editorial mock endpoints', () => {
  it('serves the home payload with promos and journal posts', async () => {
    const home = await getEditorialHome()
    expect(home.promos).toHaveLength(2)
    expect(home.journal).toHaveLength(4)
    for (const item of [...home.promos, ...home.journal]) {
      expect(item.imageUrl).toMatch(/^data:image\/svg\+xml/)
    }
  })

  it('serves a post by slug and rejects unknown slugs', async () => {
    const post = await getEditorialPost('prova-de-trabalho-de-nfts')
    expect(post.title).toBe('Como funciona a prova de trabalho de NFTs')
    expect(post.body.length).toBeGreaterThan(2)

    await expect(getEditorialPost('inexistente')).rejects.toMatchObject({
      code: 'not_found',
    } satisfies Partial<ApiError>)
  })
})
