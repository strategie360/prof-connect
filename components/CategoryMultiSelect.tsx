'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Plus, Sparkles } from 'lucide-react'
import type { Category } from '@/lib/types'

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

type Props = {
  categories: Category[]
  aiSuggestion?: string
  onAISuggest?: () => void
  isAILoading?: boolean
}

export default function CategoryMultiSelect({
  categories,
  aiSuggestion,
  onAISuggest,
  isAILoading,
}: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Ajoute la suggestion IA à la sélection si elle n'y est pas encore
  useEffect(() => {
    if (aiSuggestion && !selected.includes(aiSuggestion)) {
      setSelected((prev) => [...prev, aiSuggestion])
    }
  }, [aiSuggestion]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function close(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const available = categories.filter(
    (c) =>
      !selected.includes(c.name) &&
      c.name.toLowerCase().includes(input.toLowerCase())
  )
  const showCreate =
    input.trim() &&
    !selected.includes(input.trim()) &&
    !categories.some(
      (c) => c.name.toLowerCase() === input.trim().toLowerCase()
    )

  const add = useCallback((name: string) => {
    setSelected((prev) => (prev.includes(name) ? prev : [...prev, name]))
    setInput('')
    inputRef.current?.focus()
  }, [])

  function remove(name: string) {
    setSelected((prev) => prev.filter((s) => s !== name))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (input.trim()) add(input.trim())
    }
    if (e.key === 'Backspace' && !input && selected.length > 0) {
      remove(selected[selected.length - 1])
    }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Zone de saisie + chips */}
      <div
        className={`min-h-[42px] flex flex-wrap gap-1.5 items-center px-2.5 py-2 border rounded-lg bg-white cursor-text transition-shadow ${
          open
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : 'border-slate-300 hover:border-slate-400'
        }`}
        onClick={() => {
          setOpen(true)
          inputRef.current?.focus()
        }}
      >
        {selected.map((name) => {
          const color = categoryColor(name)
          return (
            <span
              key={name}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${color.bg} ${color.text}`}
            >
              {name}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.stopPropagation()
                  remove(name)
                }}
                className="hover:opacity-60 transition-opacity ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )
        })}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={
            selected.length === 0 ? 'Ajouter des catégories…' : ''
          }
          className="flex-1 min-w-[140px] outline-none text-sm text-slate-900 placeholder:text-slate-400 bg-transparent py-0.5"
        />
      </div>

      {/* Bouton suggestion IA */}
      {onAISuggest && (
        <button
          type="button"
          onClick={onAISuggest}
          disabled={isAILoading}
          className="flex items-center gap-1.5 text-xs font-medium text-purple-700 hover:text-purple-900 disabled:opacity-50 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isAILoading ? 'Analyse en cours…' : "Suggérer avec l'IA"}
        </button>
      )}

      {/* Dropdown */}
      {open && (available.length > 0 || showCreate) && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {available.length > 0 && (
            <li className="px-3 py-1.5 text-xs text-slate-400 uppercase tracking-wide">
              Catégories
            </li>
          )}
          {available.map((cat) => {
            const color = categoryColor(cat.name)
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onMouseDown={() => add(cat.name)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${color.bg} ${color.text}`}
                  >
                    {cat.name}
                  </span>
                </button>
              </li>
            )
          })}
          {showCreate && (
            <li>
              <button
                type="button"
                onMouseDown={() => add(input.trim())}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2 border-t border-slate-100 text-sm text-blue-600"
              >
                <Plus className="w-4 h-4 flex-shrink-0" />
                Créer «&nbsp;{input.trim()}&nbsp;»
              </button>
            </li>
          )}
        </ul>
      )}

      {/* Hidden inputs pour le formulaire */}
      {selected.map((name, i) => (
        <input key={i} type="hidden" name="category_names" value={name} />
      ))}
    </div>
  )
}
