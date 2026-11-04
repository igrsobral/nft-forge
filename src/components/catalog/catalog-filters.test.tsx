import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { NftListResponse } from '@/contracts/catalog'
import { toListQuery } from '@/lib/catalog-search'
import { stepByKey } from '@/lib/price-step'
import { CatalogFilters } from './catalog-filters'

const facets: NftListResponse['facets'] = {
  categories: [{ value: 'Fotografia', label: 'Fotografia', count: 5 }],
  collections: [],
  networks: [{ value: 'ethereum', label: 'Ethereum', count: 14 }],
  price: { min: '0.08', max: '18' },
}

describe('catalog filters', () => {
  it('moves a slider thumb with the arrow keys', () => {
    expect(stepByKey(8, 'ArrowRight', 8, 1800)).toBe(9)
    expect(stepByKey(8, 'ArrowLeft', 8, 1800)).toBe(8)
    expect(stepByKey(8, 'PageUp', 8, 20)).toBe(18)
    expect(stepByKey(20, 'End', 8, 20)).toBe(20)
    expect(stepByKey(20, 'Home', 8, 20)).toBe(8)
    expect(stepByKey(10, 'Enter', 0, 20)).toBeNull()
  })

  it('selects a category and applies the current range', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CatalogFilters search={toListQuery({})} facets={facets} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: /Fotografia/ }))
    expect(onChange).toHaveBeenCalledWith({ category: 'Fotografia' })
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    expect(onChange).toHaveBeenLastCalledWith({ minPrice: undefined, maxPrice: undefined })
    expect(screen.getByText('Preço: 0,08 - 18,00 ETH')).toBeInTheDocument()
  })
})
