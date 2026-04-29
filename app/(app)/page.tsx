import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, MapPin, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { type Post } from '@/lib/types'
import { formatRelativeDate, getInitials, truncate } from '@/lib/utils'

export default async function FeedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles(id, full_name, academy, city)')
    .order('created_at', { ascending: false })
    .limit(50)
    .returns<Post[]>()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Fil des annonces</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {posts?.length ?? 0} annonce{(posts?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/post/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle annonce
        </Link>
      </div>

      {!posts || posts.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-lg font-medium mb-1">Aucune annonce pour l&apos;instant</p>
          <p className="text-sm">Soyez le premier à publier !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="block bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex items-center justify-center flex-shrink-0">
                  {getInitials(post.profiles?.full_name ?? null, post.profiles?.city ?? 'P')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-slate-700">
                      {post.profiles?.full_name ?? 'Enseignant·e'}
                    </span>
                    {post.profiles?.academy && (
                      <span className="text-xs text-slate-400">
                        · Académie de {post.profiles.academy}
                      </span>
                    )}
                  </div>
                  <h2 className="font-semibold text-slate-900 text-base leading-snug mb-1">
                    {post.title}
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {truncate(post.content, 160)}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    {post.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {post.city}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatRelativeDate(post.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
