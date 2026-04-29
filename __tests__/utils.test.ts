import { describe, it, expect } from 'vitest'
import {
  isTeacherEmail,
  getInitials,
  getAcademyFromEmail,
  truncate,
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
