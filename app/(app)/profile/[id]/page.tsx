import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { type Profile, type Post } from '@/lib/types'
import { formatRelativeDate, getInitials, truncate } from '@/lib/utils'

export default async function PublicProfilePage({
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

  if (id === user.id) redirect('/profile')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single<Profile>()

  if (!profile) notFound()

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('author_id', id)
    .order('created_at', { ascending: false })
    .limit(10)
    .returns<Post[]>()

  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au fil
      </Link>

      {/* Carte profil */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 font-bold text-xl flex items-center justify-center flex-shrink-0">
            {getInitials(profile.full_name, profile.email)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-slate-900">
              {profile.full_name ?? 'Enseignant·e'}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500">
              {profile.academy && (
                <span>Académie de {profile.academy}</span>
              )}
              {profile.subject && <span>· {profile.subject}</span>}
              {profile.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {profile.city}
                </span>
              )}
            </div>
            {profile.bio && (
              <p className="text-sm text-slate-600 mt-3">{profile.bio}</p>
            )}
          </div>
          <Link
            href={`/messages/${profile.id}`}
            className="flex-shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Contacter
          </Link>
        </div>
      </div>

      {/* Annonces de cet enseignant */}
      {posts && posts.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Annonces
          </h2>
          <div className="space-y-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="block bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-slate-300 transition-all"
              >
                <h3 className="font-medium text-slate-900 mb-1">{post.title}</h3>
                <p className="text-sm text-slate-500">{truncate(post.content, 120)}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  {post.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {post.city}
                    </span>
                  )}
                  <span>{formatRelativeDate(post.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
