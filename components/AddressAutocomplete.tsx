'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin } from 'lucide-react'

type GeoFeature = {
  properties: {
    label: string
    city: string
    postcode: string
    context: string
  }
  geometry: {
    coordinates: [number, number] // [lng, lat]
  }
}

type SelectedGeo = {
  address: string
  city: string
  lat: number
  lng: number
}

export default function AddressAutocomplete() {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<GeoFeature[]>([])
  const [selected, setSelected] = useState<SelectedGeo | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  function handleChange(value: string) {
    setInput(value)
    setSelected(null)
    clearTimeout(debounceRef.current)

    if (value.length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(value)}&limit=5`
        )
        const data = await res.json()
        setSuggestions(data.features ?? [])
        setOpen(true)
      } catch {
        // ignore network errors
      }
    }, 300)
  }

  function handleSelect(feature: GeoFeature) {
    const geo: SelectedGeo = {
      address: feature.properties.label,
      city: feature.properties.city,
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
    }
    setSelected(geo)
    setInput(feature.properties.label)
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Adresse ou ville en France"
          autoComplete="off"
          className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {suggestions.map((feature, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={() => handleSelect(feature)}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="flex-1">{feature.properties.label}</span>
                <span className="text-slate-400 text-xs flex-shrink-0">
                  {feature.properties.context.split(',')[0]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Hidden inputs pour le formulaire */}
      <input type="hidden" name="address" value={selected?.address ?? ''} />
      <input type="hidden" name="city" value={selected?.city ?? (input || '')} />
      <input type="hidden" name="lat" value={selected?.lat ?? ''} />
      <input type="hidden" name="lng" value={selected?.lng ?? ''} />
    </div>
  )
}
