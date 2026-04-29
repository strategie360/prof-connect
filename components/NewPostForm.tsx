'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createPost } from '@/app/(app)/post/actions'
import CategoryMultiSelect from './CategoryMultiSelect'
import AddressAutocomplete from './AddressAutocomplete'
import type { Category } from '@/lib/types'

type Props = {
  categories: Category[]
  error?: string
}

export default function NewPostForm({ categories, error }: Props) {
  const [isPending, startTransition] = useTransition()
  const [postType, setPostType] = useState<'demande' | 'offre'>('demande')
  const [aiCategory, setAiCategory] = useState('')
  const [isAILoading, setIsAILoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  async function suggestCategory() {
    if (!title && !content) {
      setAiError("Remplissez le titre ou la description d'abord.")
      return
    }
    setIsAILoading(true)
    setAiError('')
    try {
      const res = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })
      if (!res.ok) throw new Error()
      const { category } = await res.json()
      setAiCategory(category)
    } catch {
      setAiError("Impossible d'obtenir une suggestion IA.")
    } finally {
      setIsAILoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => createPost(formData))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error === 'champs_requis'
            ? 'Le titre et la description sont requis.'
            : 'Publication impossible, réessayez.'}
        </div>
      )}

      {/* Type d'annonce */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Type d&apos;annonce
        </label>
        <input type="hidden" name="post_type" value={postType} />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPostType('demande')}
            className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
              postType === 'demande'
                ? 'border-amber-400 bg-amber-50 text-amber-800'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
            }`}
          >
            <span className="text-xl">🔍</span>
            <span>Demande / Recherche</span>
            <span className="text-xs font-normal opacity-70">Je cherche quelque chose</span>
          </button>
          <button
            type="button"
            onClick={() => setPostType('offre')}
            className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
              postType === 'offre'
                ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
            }`}
          >
            <span className="text-xl">📢</span>
            <span>Offre / Proposition</span>
            <span className="text-xs font-normal opacity-70">Je propose quelque chose</span>
          </button>
        </div>
      </div>

      {/* Titre */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
          Titre
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex : Location studio Paris 15e juillet-août, Cherche baby-sitter Lyon…"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">
          Description
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Décrivez votre besoin, ce que vous proposez, vos disponibilités, vos conditions…"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
        />
      </div>

      {/* Catégories (multi-select Notion) */}
      <div className="relative">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Catégories{' '}
          <span className="text-slate-400 font-normal">(optionnel)</span>
        </label>
        <CategoryMultiSelect
          categories={categories}
          aiSuggestion={aiCategory}
          onAISuggest={suggestCategory}
          isAILoading={isAILoading}
        />
        {aiError && <p className="mt-1 text-xs text-red-500">{aiError}</p>}
      </div>

      {/* Adresse */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Localisation{' '}
          <span className="text-slate-400 font-normal">
            (optionnel — permet l&apos;affichage sur la carte)
          </span>
        </label>
        <AddressAutocomplete />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Link
          href="/"
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          Annuler
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors"
        >
          {isPending ? 'Publication…' : 'Publier'}
        </button>
      </div>
    </form>
  )
}
