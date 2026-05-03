'use client'

import { useTransition } from 'react'
import { ACADEMIES, SUBJECTS } from '@/lib/constants'
import { setupProfile } from '@/app/(app)/profile/setup/actions'
import CityAutocomplete from './CityAutocomplete'

export default function ProfileSetupForm({ error }: { error?: string }) {
  const [isPending, startTransition] = useTransition()

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
        <CityAutocomplete />
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
