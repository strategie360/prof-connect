'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition, useRef } from 'react'
import { Search, X, Map } from 'lucide-react'
import type { Category } from '@/lib/types'

type Props = {
  categories: Category[]
}

export default function SearchBar({ categories }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const q = params.get('q') ?? ''
  const activeCategory = params.get('category') ?? ''

  function updateParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    startTransition(() => router.push(`${pathname}?${next.toString()}`))
  }

  function handleSearch(value: string) {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updateParams({ q: value || null }), 300)
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Barre de recherche */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            defaultValue={q}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Rechercher une annonce…"
            className="w-full border border-slate-300 rounded-lg pl-9 pr-9 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
          />
          {q && (
            <button
              type="button"
              onClick={() => updateParams({ q: null })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <a
          href="/map"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:border-slate-400 rounded-lg transition-colors whitespace-nowrap"
        >
          <Map className="w-4 h-4" />
          Carte
        </a>
      </div>

      {/* Filtres catégories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateParams({ category: null })}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !activeCategory
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            Toutes
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                updateParams({
                  category: cat.name === activeCategory ? null : cat.name,
                })
              }
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                cat.name === activeCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {cat.name}
              <span className="ml-1 opacity-60">{cat.post_count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
