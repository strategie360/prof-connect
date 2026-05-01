'use client'

import { useTransition, useState, useRef, useEffect } from 'react'
import { MapPin, X } from 'lucide-react'
import { ACADEMIES, SUBJECTS } from '@/lib/constants'
import { setupProfile } from '@/app/(app)/profile/setup/actions'

type Suggestion = { label: string }

export default function ProfileSetupForm({ error }: { error?: string }) {
  const [isPending, startTransition] = useTransition()
  const [cityInput, setCityInput] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function close(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setShowSuggestions(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  function handleCityInput(value: string) {
    setCityInput(value)
    if (!value.trim()) { setSuggestions([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(value)}&type=municipality&limit=5`
        )
        const json = await res.json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSuggestions(json.features.map((f: any) => ({ label: f.properties.label })))
        setShowSuggestions(true)
      } catch {}
    }, 300)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => setupProfile(fd))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Prénom/nom et académie sont obligatoires.
        </div>
      )}

      {/* Prénom et nom */}
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 mb-1">
          Prénom et nom <span className="text-red-500">*</span>
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          placeholder="Marie Dupont"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Académie */}
      <div>
        <label htmlFor="academy" className="block text-sm font-medium text-slate-700 mb-1">
          Académie <span className="text-red-500">*</span>
        </label>
        <select
          id="academy"
          name="academy"
          required
          defaultValue=""
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
        >
          <option value="" disabled>Choisir une académie…</option>
          {ACADEMIES.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Matière */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">
          Matière enseignée{' '}
          <span className="text-slate-400 font-normal">(optionnel)</span>
        </label>
        <select
          id="subject"
          name="subject"
          defaultValue=""
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
        >
          <option value="">Choisir une matière…</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Ville */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Ville{' '}
          <span className="text-slate-400 font-normal">(optionnel)</span>
        </label>
        <div ref={containerRef} className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            name="city"
            type="text"
            value={cityInput}
            onChange={(e) => handleCityInput(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Paris, Lyon, Bordeaux…"
            className="w-full border border-slate-300 rounded-lg pl-9 pr-8 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          {cityInput && (
            <button type="button" onClick={() => { setCityInput(''); setSuggestions([]) }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((s) => (
                <li key={s.label}>
                  <button type="button"
                    onMouseDown={() => { setCityInput(s.label); setSuggestions([]); setShowSuggestions(false) }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
      >
        {isPending ? 'Enregistrement…' : 'Continuer →'}
      </button>
    </form>
  )
}
