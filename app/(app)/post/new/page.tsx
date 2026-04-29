import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  async function createPost(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const title = (formData.get('title') as string).trim()
    const content = (formData.get('content') as string).trim()
    const city = (formData.get('city') as string).trim()

    if (!title || !content) {
      redirect('/post/new?error=champs_requis')
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        author_id: user.id,
        title,
        content,
        city: city || null,
      })
      .select()
      .single()

    if (error) {
      redirect('/post/new?error=publication_impossible')
    }

    redirect(`/post/${data.id}`)
  }

  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au fil
      </Link>

      <h1 className="text-xl font-semibold text-slate-900 mb-6">Nouvelle annonce</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error === 'champs_requis'
            ? 'Le titre et le contenu sont requis.'
            : 'Publication impossible, réessayez.'}
        </div>
      )}

      <form action={createPost} className="space-y-5">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Titre
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={120}
            placeholder="Ex : Location studio Paris 15e juillet-août, Cherche baby-sitter Lyon…"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={7}
            placeholder="Décrivez votre besoin, ce que vous proposez, vos disponibilités, vos conditions…"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
          />
        </div>

        <div>
          <label
            htmlFor="city"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Ville <span className="text-slate-400 font-normal">(optionnel)</span>
          </label>
          <input
            id="city"
            name="city"
            type="text"
            placeholder="Paris, Lyon, Bordeaux…"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Publier
          </button>
        </div>
      </form>
    </div>
  )
}
