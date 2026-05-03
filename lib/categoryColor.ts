const COLORS = [
  { bg: 'bg-slate-100', text: 'text-slate-700' },
  { bg: 'bg-red-100', text: 'text-red-700' },
  { bg: 'bg-orange-100', text: 'text-orange-700' },
  { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-pink-100', text: 'text-pink-700' },
]

export function categoryColor(name: string) {
  const idx =
    Math.abs(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) %
    COLORS.length
  return COLORS[idx]
}
