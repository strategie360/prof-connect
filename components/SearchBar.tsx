'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition, useRef, useState, useEffect } from 'react'
import { Search, X, Map, MapPin } from 'lucide-react'
import type { Category } from '@/lib/types'

const RADIUS_OPTIONS = [5, 20, 50, 100]

type Suggestion = { label: string; lat: number; lng: number }

type Props = {
  categories: Category[]
}

export default function SearchBar({ categories }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [, startTransition] = useTransition()
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>(undefined)
  const geoDebounce = useRef<ReturnType<typeof setTimeout>>(undefined)
  const locationRef = useRef<HTMLDivElement>(null)

  const q = params.get('q') ?? ''
  const activeCategory = params.get('category') ?? ''
  const sloc = params.get('sloc') ?? ''
  const slat = params.get('slat') ?? ''
  const slng = params.get('slng') ?? ''
  const activeRadius = params.get('radius') ?? ''

  const [locationInput, setLocationInput] = useState(sloc)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Sync input when URL changes (back/forward navigation)
  useEffect(() => { setLocationInput(sloc) }, [sloc])

  useEffect(() => {
    function close(e: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(e.target as Node))
        setShowSuggestions(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  function updateParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    startTransition(() => router.push(`${pathname}?${next.toString()}`))
  }

  function handleSearch(value: string) {
    clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(
      () => updateParams({ q: value || null }),
      300
    )
  }

  function handleLocationInput(value: string) {
    setLocationInput(value)
    if (!value.trim()) {
      setSuggestions([])
      updateParams({ slat: null, slng: null, sloc: null, radius: null })
      return
    }
    clearTimeout(geoDebounce.current)
    geoDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(value)}&type=municipality&limit=5`
        )
        const json = await res.json()
        setSuggestions(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          json.features.map((f: any) => ({
            label: f.properties.label,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
          }))
        )
        setShowSuggestions(true)
      } catch {}
    }, 300)
  }

  function selectLocation(s: Suggestion) {
    setLocationInput(s.label)
    setSuggestions([])
    setShowSuggestions(false)
    updateParams({
      slat: String(s.lat),
      slng: String(s.lng),
      sloc: s.label,
      radius: activeRadius || '20',
    })
  }

  function clearLocation() {
    setLocationInput('')
    setSuggestions([])
    updateParams({ slat: null, slng: null, sloc: null, radius: null })
  }

  const hasLocation = !!(slat && slng)

  return (
    <div className="space-y-3 mb-6">
      {/* Ligne 1 : texte + carte */}
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

      {/* Ligne 2 : localisation + rayon */}
      <div className="flex gap-2 items-center flex-wrap">
        <div ref={locationRef} className="relative flex-1 min-w-[180px]">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={locationInput}
            onChange={(e) => handleLocationInput(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Ville ou commune…"
            className="w-full border border-slate-300 rounded-lg pl-9 pr-8 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
          />
          {locationInput && (
            <button
              type="button"
              onClick={clearLocation}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
              {suggestions.map((s) => (
                <li key={s.label}>
                  <button
                    type="button"
                    onMouseDown={() => selectLocation(s)}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {hasLocation && (
          <div className="flex gap-1.5 items-center flex-wrap">
            <span className="text-xs text-slate-500 whitespace-nowrap">Dans un rayon de</span>
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => updateParams({ radius: String(r) })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  activeRadius === String(r)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        )}
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
                updateParams({ category: cat.name === activeCategory ? null : cat.name })
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
