'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition, useRef, useState, useEffect } from 'react'
import {
  Search, X, Map, MapPin, LocateFixed,
  SlidersHorizontal, ChevronDown, ChevronUp, Check,
} from 'lucide-react'
import type { Category } from '@/lib/types'
import { categoryColor } from '@/lib/categoryColor'

const RADIUS_OPTIONS = [5, 20, 50, 100]

type Suggestion = { label: string; lat: number; lng: number }
type Props = { categories: Category[] }

export default function SearchBar({ categories }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [, startTransition] = useTransition()
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>(undefined)
  const geoDebounce = useRef<ReturnType<typeof setTimeout>>(undefined)
  const locationRef = useRef<HTMLDivElement>(null)

  const q = params.get('q') ?? ''
  const categoriesParam = params.get('categories') ?? ''
  const activeCategories = categoriesParam ? categoriesParam.split(',').filter(Boolean) : []
  const sloc = params.get('sloc') ?? ''
  const slat = params.get('slat') ?? ''
  const slng = params.get('slng') ?? ''
  const activeRadius = params.get('radius') ?? ''

  const hasLocation = !!(slat && slng)
  const advancedCount = (hasLocation ? 1 : 0) + (activeCategories.length > 0 ? 1 : 0)

  const [locationInput, setLocationInput] = useState(sloc)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(advancedCount > 0)
  const [isLocating, setIsLocating] = useState(false)
  const [geoError, setGeoError] = useState('')

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
    next.delete('page')
    startTransition(() => router.push(`${pathname}?${next.toString()}`))
  }

  function toggleCategory(name: string) {
    const next = activeCategories.includes(name)
      ? activeCategories.filter((c) => c !== name)
      : [...activeCategories, name]
    updateParams({ categories: next.length ? next.join(',') : null })
  }

  function handleSearch(value: string) {
    clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => updateParams({ q: value || null }), 300)
  }

  function handleLocationInput(value: string) {
    setLocationInput(value)
    setGeoError('')
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
    updateParams({ slat: String(s.lat), slng: String(s.lng), sloc: s.label, radius: activeRadius || '20' })
  }

  function clearLocation() {
    setLocationInput('')
    setSuggestions([])
    setGeoError('')
    updateParams({ slat: null, slng: null, sloc: null, radius: null })
  }

  async function useMyLocation() {
    if (!navigator.geolocation) { setGeoError('Géolocalisation non disponible sur ce navigateur'); return }
    setIsLocating(true)
    setGeoError('')
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      )
      const { latitude: lat, longitude: lng } = pos.coords
      let label = 'Ma position'
      try {
        const res = await fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${lng}&lat=${lat}`)
        const json = await res.json()
        if (json.features[0]) label = json.features[0].properties.city ?? json.features[0].properties.label
      } catch {}
      setLocationInput(label)
      updateParams({ slat: String(lat), slng: String(lng), sloc: label, radius: activeRadius || '20' })
    } catch (err: unknown) {
      const code = (err as GeolocationPositionError)?.code
      setGeoError(code === 1 ? 'Localisation refusée' : 'Impossible de vous localiser')
    } finally {
      setIsLocating(false)
    }
  }

  function clearAllFilters() {
    setLocationInput('')
    setSuggestions([])
    setGeoError('')
    updateParams({ q: null, categories: null, slat: null, slng: null, sloc: null, radius: null })
  }

  const hasAnyFilter = !!(q || activeCategories.length || hasLocation)

  return (
    <div className="space-y-2 mb-6">
      {/* Barre principale */}
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
            <button type="button" onClick={() => updateParams({ q: null })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            showAdvanced || advancedCount > 0
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filtres</span>
          {advancedCount > 0 && (
            <span className="flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-blue-600 text-white leading-none">
              {advancedCount}
            </span>
          )}
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <a href="/map"
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:border-slate-400 rounded-lg transition-colors">
          <Map className="w-4 h-4" />
          <span className="hidden sm:inline">Carte</span>
        </a>
      </div>

      {/* Panneau filtres avancés */}
      {showAdvanced && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">

          {/* Catégories — picklist multiple */}
          {categories.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Catégories
                </p>
                {activeCategories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => updateParams({ categories: null })}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Tout désélectionner
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {categories.map((cat) => {
                  const active = activeCategories.includes(cat.name)
                  const color = categoryColor(cat.name)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.name)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors border ${
                        active
                          ? `${color.bg} ${color.text} border-transparent`
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                        active ? 'bg-current border-current' : 'border-slate-300'
                      }`}>
                        {active && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                      </span>
                      <span className="flex-1 truncate">{cat.name}</span>
                      {cat.post_count > 0 && (
                        <span className="flex-shrink-0 opacity-50">{cat.post_count}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Localisation */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Localisation
            </p>
            <div className="flex gap-2 flex-wrap">
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
                  <button type="button" onClick={clearLocation}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    {suggestions.map((s) => (
                      <li key={s.label}>
                        <button type="button" onMouseDown={() => selectLocation(s)}
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          {s.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button type="button" onClick={useMyLocation} disabled={isLocating}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap">
                <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-pulse text-blue-500' : ''}`} />
                {isLocating ? 'Localisation…' : 'Ma position'}
              </button>
            </div>

            {geoError && <p className="mt-1.5 text-xs text-red-500">{geoError}</p>}

            {hasLocation && (
              <div className="flex gap-1.5 items-center mt-3 flex-wrap">
                <span className="text-xs text-slate-500">Dans un rayon de</span>
                {RADIUS_OPTIONS.map((r) => (
                  <button key={r} type="button" onClick={() => updateParams({ radius: String(r) })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      activeRadius === String(r)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}>
                    {r} km
                  </button>
                ))}
              </div>
            )}
          </div>

          {hasAnyFilter && (
            <div className="pt-2 border-t border-slate-200">
              <button type="button" onClick={clearAllFilters}
                className="text-xs font-medium text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1">
                <X className="w-3.5 h-3.5" />
                Effacer tous les filtres
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
