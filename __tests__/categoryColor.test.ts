import { describe, it, expect } from 'vitest'
import { categoryColor } from '@/lib/categoryColor'

describe('categoryColor', () => {
  it('returns an object with bg and text keys', () => {
    const color = categoryColor('Mathématiques')
    expect(color).toHaveProperty('bg')
    expect(color).toHaveProperty('text')
  })

  it('is deterministic — same name always returns same color', () => {
    expect(categoryColor('Français')).toEqual(categoryColor('Français'))
  })

  it('different names can produce different colors', () => {
    const colors = ['Maths', 'Histoire', 'SVT', 'EPS', 'Musique', 'Arts', 'Physique', 'Chimie']
      .map(categoryColor)
    const unique = new Set(colors.map((c) => c.bg))
    expect(unique.size).toBeGreaterThan(1)
  })

  it('bg class starts with bg-', () => {
    expect(categoryColor('test').bg).toMatch(/^bg-/)
  })

  it('text class starts with text-', () => {
    expect(categoryColor('test').text).toMatch(/^text-/)
  })
})
