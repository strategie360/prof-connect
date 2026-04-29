export function isTeacherEmail(email: string): boolean {
  const lower = email.toLowerCase()
  if (lower.endsWith('@education.gouv.fr')) return true
  if (/^[^@]+@ac-[a-z][a-z-]*\.fr$/.test(lower)) return true
  return false
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'à l\'instant'
  if (minutes < 60) return `il y a ${minutes} min`
  if (hours < 24) return `il y a ${hours}h`
  if (days < 7) return `il y a ${days}j`
  return formatDate(dateString)
}

export function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email[0].toUpperCase()
}

export function getAcademyFromEmail(email: string): string | null {
  const match = email.toLowerCase().match(/@ac-([a-z-]+)\.fr$/)
  if (match) {
    const name = match[1].replace(/-/g, ' ')
    return name.charAt(0).toUpperCase() + name.slice(1)
  }
  if (email.endsWith('@education.gouv.fr')) return 'Éducation nationale'
  return null
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trim() + '…'
}
