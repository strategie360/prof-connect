'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Plus } from 'lucide-react'
import type { Category } from '@/lib/types'
import { categoryColor } from '@/lib/categoryColor'
import { MAX_CATEGORIES } from '@/lib/constants'

export { categoryColor }

type Props = {
  categories: Category[]
  aiSuggestions?: string[]
  initialSelected?: string[]
  canCreateCategory?: boolean
}

export default function CategoryMultiSelect({
  categories,
  aiSuggestions,
  initialSelected,
  canCreateCategory = false,
}: Props) {
  const [selected, setSelected] = useState<string[]>(initialSelected ?? [])
  // Noms qui viennent de l'IA — toujours upsertés côté serveur quel que soit le rôle
  const [aiSourced, setAiSourced] = useState<Set<string>>(new Set())
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aiSuggestions?.length) return
    setSelected((prev) => {
      const toAdd = aiSuggestions.filter((s) => !prev.includes(s))
      return toAdd.length ? [...prev, ...toAdd] : prev
    })
    setAiSourced((prev) => {
      const next = new Set(prev)
      aiSuggestions.forEach((s) => next.add(s))
      return next
    })
  }, [aiSuggestions]) // eslint-disable-line react-hooks/exhaustive-deps

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
    canCreateCategory &&
    input.trim() &&
    !selected.includes(input.trim()) &&
    !categories.some(
      (c) => c.name.toLowerCase() === input.trim().toLowerCase()
    )

  const add = useCallback((name: string) => {
    setSelected((prev) => {
      if (prev.includes(name) || prev.length >= MAX_CATEGORIES) return prev
      return [...prev, name]
    })
    setInput('')
    inputRef.current?.focus()
  }, [])

  function remove(name: string) {
    setSelected((prev) => prev.filter((s) => s !== name))
    setAiSourced((prev) => { const next = new Set(prev); next.delete(name); return next })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = input.trim()
      if (trimmed) {
        const match = categories.find(
          (c) => c.name.toLowerCase() === trimmed.toLowerCase()
        )
        if (match) add(match.name)
        else if (canCreateCategory) add(trimmed)
      }
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
        {selected.length < MAX_CATEGORIES ? (
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
            placeholder={selected.length === 0 ? 'Ajouter des catégories…' : ''}
            className="flex-1 min-w-[140px] outline-none text-sm text-slate-900 placeholder:text-slate-400 bg-transparent py-0.5"
          />
        ) : (
          <span className="text-xs text-slate-400 ml-1">
            Max {MAX_CATEGORIES} catégories
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && selected.length < MAX_CATEGORIES && (available.length > 0 || showCreate) && (
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
      {/* Catégories suggérées par l'IA — traitées séparément côté serveur */}
      {selected
        .filter((name) => aiSourced.has(name))
        .map((name, i) => (
          <input key={i} type="hidden" name="ai_category_names" value={name} />
        ))}
    </div>
  )
}
