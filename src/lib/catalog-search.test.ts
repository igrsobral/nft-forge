import { describe, expect, it } from 'vitest'
import { toListQuery, toRouteSearch } from './catalog-search'

describe('catalog search params', () => {
  it('fills defaults and drops invalid filters', () => {
    expect(toListQuery({})).toMatchObject({
      tab: 'all',
      sort: 'newest',
      page: 1,
      pageSize: 9,
    })
    expect(
      toListQuery({ category: 'Nope', page: '0', sort: 'price_desc', q: '  relic  ' }),
    ).toMatchObject({
      category: undefined,
      page: 1,
      sort: 'price_desc',
      q: 'relic',
    })
  })

  it('parses the price range and in-stock flag', () => {
    expect(toListQuery({ minPrice: '0.08', maxPrice: '5', inStock: 'true' })).toMatchObject({
      minPrice: '0.08',
      maxPrice: '5',
      inStock: true,
    })
    expect(toListQuery({ minPrice: '1,5', inStock: 'false' }).minPrice).toBeUndefined()
    expect(toListQuery({ inStock: 'false' }).inStock).toBe(false)
  })

  it('omits defaults from the route and keeps a safe auth redirect', () => {
    const query = toListQuery({ category: 'Fotografia', page: 2, tab: 'new' })
    expect(toRouteSearch(query, { auth: 'login', next: '/checkout' })).toMatchObject({
      category: 'Fotografia',
      page: 2,
      tab: 'new',
      auth: 'login',
      next: '/checkout',
    })
    expect(toRouteSearch(toListQuery({}), { auth: 'nope', next: '//evil' })).toEqual({})
  })
})
