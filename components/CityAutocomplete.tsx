'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, X } from 'lucide-react'

type Props = {
  name?: string
  initialValue?: string
  placeholder?: string
}

export default function CityAutocomplete({
  name = 'city',
  initialValue = '',
  placeholder = 'Paris, Lyon, Bordeaux…',
}: Props) {
  const [input, setInput] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    function close(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  function handleChange(value: string) {
    setInput(value)
    clearTimeout(debounceRef.current)
    if (value.trim().length < 2) { setSuggestions([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(value)}&type=municipality&limit=6`
        )
        const json = await res.json()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setSuggestions(json.features.map((f: any) => f.properties.city as string))
        setOpen(true)
      } catch {}
    }, 300)
  }

  function select(city: string) {
    setInput(city)
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        name={name}
        type="text"
        value={input}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full border border-slate-300 rounded-lg pl-9 pr-8 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
      {input && (
        <button
          type="button"
          onClick={() => { setInput(''); setSuggestions([]) }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((city) => (
            <li key={city}>
              <button
                type="button"
                onMouseDown={() => select(city)}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                {city}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
