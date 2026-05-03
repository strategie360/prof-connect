import { describe, it, expect } from 'vitest'
import {
  isTeacherEmail,
  getInitials,
  getAcademyFromEmail,
  truncate,
  haversineKm,
} from '@/lib/utils'

describe('isTeacherEmail', () => {
  it('accepts @education.gouv.fr', () => {
    expect(isTeacherEmail('jean@education.gouv.fr')).toBe(true)
  })
  it('accepts @ac-paris.fr', () => {
    expect(isTeacherEmail('marie@ac-paris.fr')).toBe(true)
  })
  it('accepts @ac-aix-marseille.fr', () => {
    expect(isTeacherEmail('paul@ac-aix-marseille.fr')).toBe(true)
  })
  it('rejects @gmail.com', () => {
    expect(isTeacherEmail('test@gmail.com')).toBe(false)
  })
  it('rejects @ac-.fr (invalid)', () => {
    expect(isTeacherEmail('test@ac-.fr')).toBe(false)
  })
  it('is case-insensitive', () => {
    expect(isTeacherEmail('JEAN@EDUCATION.GOUV.FR')).toBe(true)
  })
})

describe('getInitials', () => {
  it('returns two initials from full name', () => {
    expect(getInitials('Marie Dupont', 'marie@ac-paris.fr')).toBe('MD')
  })
  it('returns one initial from single name', () => {
    expect(getInitials('Marie', 'marie@ac-paris.fr')).toBe('M')
  })
  it('falls back to email first char when name is null', () => {
    expect(getInitials(null, 'paul@ac-paris.fr')).toBe('P')
  })
})

describe('getAcademyFromEmail', () => {
  it('extracts academy from @ac-paris.fr', () => {
    expect(getAcademyFromEmail('x@ac-paris.fr')).toBe('Paris')
  })
  it('capitalises hyphenated academy', () => {
    expect(getAcademyFromEmail('x@ac-aix-marseille.fr')).toBe('Aix marseille')
  })
  it('returns Éducation nationale for @education.gouv.fr', () => {
    expect(getAcademyFromEmail('x@education.gouv.fr')).toBe('Éducation nationale')
  })
  it('returns null for unknown domain', () => {
    expect(getAcademyFromEmail('x@gmail.com')).toBeNull()
  })
})

describe('haversineKm', () => {
  it('returns 0 for identical points', () => {
    expect(haversineKm(48.8566, 2.3522, 48.8566, 2.3522)).toBeCloseTo(0, 1)
  })

  it('Paris → Lyon is roughly 390 km', () => {
    // Paris (48.8566, 2.3522) → Lyon (45.7640, 4.8357)
    expect(haversineKm(48.8566, 2.3522, 45.764, 4.8357)).toBeCloseTo(390, -1)
  })

  it('Paris → Versailles is under 20 km', () => {
    // Versailles (48.8053, 2.1347)
    expect(haversineKm(48.8566, 2.3522, 48.8053, 2.1347)).toBeLessThan(20)
  })

  it('is symmetric', () => {
    const d1 = haversineKm(48.8566, 2.3522, 45.764, 4.8357)
    const d2 = haversineKm(45.764, 4.8357, 48.8566, 2.3522)
    expect(d1).toBeCloseTo(d2, 5)
  })
})

describe('truncate', () => {
  it('returns text unchanged when under limit', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })
  it('truncates and adds ellipsis', () => {
    expect(truncate('hello world', 5)).toBe('hello…')
  })
  it('returns text unchanged when exactly at limit', () => {
    expect(truncate('hello', 5)).toBe('hello')
  })
})
