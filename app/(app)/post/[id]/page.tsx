import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, MapPin, Calendar, Trash2, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { type Post } from '@/lib/types'
import { formatDate, getInitials } from '@/lib/utils'

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: post } = await supabase
    .from('posts')
    .select('*, profiles(id, full_name, academy, subject, city, bio, email)')
    .eq('id', id)
    .single<Post>()

  if (!post) notFound()

  const isOwner = post.author_id === user.id

  async function deletePost() {
    'use server'
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    await supabase.from('posts').delete().eq('id', id).eq('author_id', user.id)
    redirect('/')
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

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <span
              className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full mb-2 ${
                post.post_type === 'offre'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {post.post_type === 'offre' ? '📢 Offre / Proposition' : '🔍 Demande / Recherche'}
            </span>
            <h1 className="text-2xl font-semibold text-slate-900 leading-snug">
              {post.title}
            </h1>
          </div>
          {isOwner && (
            <form action={deletePost}>
              <button
                type="submit"
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Supprimer l'annonce"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-400 mb-6">
          {post.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {post.city}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(post.created_at)}
          </span>
        </div>

        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Carte auteur */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
        <div className="flex items-start gap-4">
          <Link href={`/profile/${post.profiles?.id}`}>
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center flex-shrink-0 hover:bg-blue-200 transition-colors">
              {getInitials(post.profiles?.full_name ?? null, post.profiles?.email ?? 'P')}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href={`/profile/${post.profiles?.id}`}
              className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
            >
              {post.profiles?.full_name ?? 'Enseignant·e'}
            </Link>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-sm text-slate-500">
              {post.profiles?.academy && (
                <span>Académie de {post.profiles.academy}</span>
              )}
              {post.profiles?.subject && <span>· {post.profiles.subject}</span>}
              {post.profiles?.city && <span>· {post.profiles.city}</span>}
            </div>
            {post.profiles?.bio && (
              <p className="text-sm text-slate-500 mt-2">{post.profiles.bio}</p>
            )}
          </div>

          {!isOwner && (
            <Link
              href={`/messages/${post.profiles?.id}?post=${post.id}`}
              className="flex-shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Contacter
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
