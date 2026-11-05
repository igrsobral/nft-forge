import { describe, expect, it } from 'vitest'
import { presentEditorialHome, presentEditorialPost } from './editorial'

describe('mock editorial', () => {
  it('presents the home payload with one image per promo and post', () => {
    const home = presentEditorialHome()
    expect(home.promos).toHaveLength(2)
    expect(home.journal).toHaveLength(4)
    for (const item of [...home.promos, ...home.journal]) {
      expect(item.imageUrl).toMatch(/^\/nft\/ape-/)
    }
    expect(home.journal[0]).toMatchObject({
      slug: 'prova-de-trabalho-de-nfts',
      category: 'NFTs',
      dateLabel: '12 de setembro',
      readingMinutes: 6,
    })
    const first = home.journal[0]
    expect(Object.keys(first ?? {})).not.toContain('body')
  })

  it('serves article bodies and rejects unknown slugs', () => {
    const post = presentEditorialPost('raridade-atributos-e-procedencia')
    expect(post).not.toBeNull()
    expect(post?.body.length).toBeGreaterThan(2)
    expect(presentEditorialPost('inexistente')).toBeNull()
  })
})
