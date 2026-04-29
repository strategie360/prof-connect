'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus, Sparkles } from 'lucide-react'
import type { Category } from '@/lib/types'

type Props = {
  categories: Category[]
  defaultValue?: string
  onAISuggest?: () => void
  isAILoading?: boolean
}

export default function CategoryCombobox({
  categories,
  defaultValue = '',
  onAISuggest,
  isAILoading,
}: Props) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState(defaultValue)
  const ref = useRef<HTMLDivElement>(null)

  // Sync when AI suggests a value
  useEffect(() => {
    if (defaultValue && defaultValue !== input) setInput(defaultValue)
  }, [defaultValue]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(input.toLowerCase())
  )
  const showCreate =
    input.trim() &&
    !filtered.some((c) => c.name.toLowerCase() === input.trim().toLowerCase())

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  function pick(name: string) {
    setInput(name)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder="Ex : Location, Covoiturage, Matériel scolaire…"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-8 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {onAISuggest && (
          <button
            type="button"
            onClick={onAISuggest}
            disabled={isAILoading}
            title="Suggérer une catégorie avec l'IA"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            {isAILoading ? 'Analyse…' : 'Suggérer'}
          </button>
        )}
      </div>

      {/* Hidden input for form */}
      <input type="hidden" name="category_name" value={input} />

      {open && (filtered.length > 0 || showCreate) && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.map((cat) => (
            <li key={cat.id}>
              <button
                type="button"
                onMouseDown={() => pick(cat.name)}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <span>{cat.name}</span>
                <span className="text-xs text-slate-400">{cat.post_count} annonce{cat.post_count !== 1 ? 's' : ''}</span>
              </button>
            </li>
          ))}
          {showCreate && (
            <li>
              <button
                type="button"
                onMouseDown={() => pick(input.trim())}
                className="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2 border-t border-slate-100"
              >
                <Plus className="w-4 h-4" />
                Créer «&nbsp;{input.trim()}&nbsp;»
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
