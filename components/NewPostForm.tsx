'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Sparkles, Loader2, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { createPost } from '@/app/(app)/post/actions'
import CategoryMultiSelect from './CategoryMultiSelect'
import AddressAutocomplete from './AddressAutocomplete'
import type { Category } from '@/lib/types'
import type { PostAnalysis } from '@/app/api/analyze-post/route'

type Props = {
  categories: Category[]
  error?: string
  canCreateCategory?: boolean
}

export default function NewPostForm({ categories, error, canCreateCategory = false }: Props) {
  const [isPending, startTransition] = useTransition()
  const [postType, setPostType] = useState<'demande' | 'offre'>('demande')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')
  const [analysis, setAnalysis] = useState<PostAnalysis | null>(null)
  const [showKeyInfo, setShowKeyInfo] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])

  async function analyzePost() {
    if (!title && !content) {
      setAnalyzeError("Remplissez le titre ou la description d'abord.")
      return
    }
    setIsAnalyzing(true)
    setAnalyzeError('')
    setAnalysis(null)
    try {
      const res = await fetch('/api/analyze-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })
      if (!res.ok) throw new Error()
      const data: PostAnalysis = await res.json()
      setAnalysis(data)
      setAiSuggestions(data.categories ?? [])
      if (data.post_type) setPostType(data.post_type)
    } catch {
      setAnalyzeError("Analyse impossible, réessayez.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  function applyImprovement() {
    if (!analysis) return
    setTitle(analysis.improved_title)
    setContent(analysis.improved_content)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => createPost(formData))
  }

  const keyInfoEntries = analysis
    ? Object.entries(analysis.key_info).filter(([, v]) => v !== null)
    : []

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
          <button type="button" onClick={() => setPostType('demande')}
            className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
              postType === 'demande'
                ? 'border-amber-400 bg-amber-50 text-amber-800'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
            }`}>
            <span className="text-xl">🔍</span>
            <span>Demande / Recherche</span>
            <span className="text-xs font-normal opacity-70">Je cherche quelque chose</span>
          </button>
          <button type="button" onClick={() => setPostType('offre')}
            className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
              postType === 'offre'
                ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
            }`}>
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
          id="title" name="title" type="text" required maxLength={120}
          value={title} onChange={(e) => setTitle(e.target.value)}
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
          id="content" name="content" required rows={6}
          value={content} onChange={(e) => setContent(e.target.value)}
          placeholder="Décrivez votre besoin, ce que vous proposez, vos disponibilités, vos conditions…"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
        />
      </div>

      {/* Bouton Analyser */}
      <div>
        <button type="button" onClick={analyzePost} disabled={isAnalyzing}
          className="flex items-center gap-2 text-sm font-medium text-purple-700 hover:text-purple-900 disabled:opacity-50 transition-colors">
          {isAnalyzing
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Sparkles className="w-4 h-4" />}
          {isAnalyzing ? "Analyse en cours…" : "Analyser avec l'IA"}
        </button>
        {analyzeError && <p className="mt-1 text-xs text-red-500">{analyzeError}</p>}
      </div>

      {/* Panneau résultat IA */}
      {analysis && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-purple-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Analyse IA
            </span>
            <button type="button" onClick={() => setAnalysis(null)}
              className="text-purple-400 hover:text-purple-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Type suggéré */}
          <div className="flex items-center gap-2 text-purple-800">
            <Check className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
            <span>Type détecté : <strong>{analysis.post_type === 'offre' ? 'Offre' : 'Demande'}</strong>
              {' '}<span className="text-purple-500 text-xs">(appliqué)</span>
            </span>
          </div>

          {/* Catégories suggérées */}
          {analysis.categories.length > 0 && (
            <div className="flex items-start gap-2 text-purple-800">
              <Check className="w-3.5 h-3.5 text-purple-500 flex-shrink-0 mt-0.5" />
              <span>
                Catégories suggérées : {analysis.categories.map((c) => (
                  <span key={c} className="inline-block bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-medium mr-1">{c}</span>
                ))}
                <span className="text-purple-500 text-xs">(ajoutées)</span>
              </span>
            </div>
          )}

          {/* Infos extraites */}
          {keyInfoEntries.length > 0 && (
            <div>
              <button type="button"
                onClick={() => setShowKeyInfo((v) => !v)}
                className="flex items-center gap-1 text-purple-700 hover:text-purple-900 text-xs font-medium">
                {showKeyInfo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {keyInfoEntries.length} info{keyInfoEntries.length > 1 ? 's' : ''} extraite{keyInfoEntries.length > 1 ? 's' : ''}
              </button>
              {showKeyInfo && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {keyInfoEntries.map(([k, v]) => (
                    <span key={k} className="bg-white border border-purple-200 text-purple-800 px-2.5 py-1 rounded-full text-xs">
                      <span className="opacity-60">{k} : </span>{v}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Texte amélioré */}
          {analysis.has_improvement && (
            <div className="pt-2 border-t border-purple-200">
              <button type="button" onClick={applyImprovement}
                className="text-sm font-medium text-purple-700 hover:text-purple-900 underline underline-offset-2">
                Appliquer la version améliorée ✨
              </button>
              <p className="text-xs text-purple-500 mt-0.5">
                Fautes corrigées et texte reformulé — vous pourrez encore modifier.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Catégories */}
      <div className="relative">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Catégories{' '}
          <span className="text-slate-400 font-normal">(optionnel)</span>
        </label>
        <CategoryMultiSelect
          categories={categories}
          aiSuggestions={aiSuggestions}
          canCreateCategory={canCreateCategory}
        />
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
        <Link href="/"
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
          Annuler
        </Link>
        <button type="submit" disabled={isPending}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors">
          {isPending ? 'Publication…' : 'Publier'}
        </button>
      </div>
    </form>
  )
}
