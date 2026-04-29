import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, MapPin, Calendar } from 'lucide-react'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { type Post, type Category } from '@/lib/types'
import { formatRelativeDate, getInitials, truncate } from '@/lib/utils'
import { categoryColor } from '@/lib/categoryColor'
import SearchBar from '@/components/SearchBar'

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>
}) {
  const { q, category } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Catégories pour les filtres
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('post_count', { ascending: false })
    .limit(20)
    .returns<Category[]>()

  // Construction de la requête avec recherche + filtre
  let query = supabase
    .from('posts')
    .select('*, profiles(id, full_name, academy, city)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (q) {
    // Recherche full-text sur le vecteur généré
    query = query.textSearch('search_vector', q
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .join(' | '), { config: 'french' })
  }

  if (category) {
    query = query.contains('category_names', [category])
  }

  const { data: posts } = await query.returns<Post[]>()

  const hasFilters = !!(q || category)

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Fil des annonces</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {posts?.length ?? 0} annonce{(posts?.length ?? 0) !== 1 ? 's' : ''}
            {hasFilters && ' trouvée' + ((posts?.length ?? 0) !== 1 ? 's' : '')}
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

      {/* SearchBar (client) avec Suspense requis par useSearchParams */}
      <Suspense fallback={<div className="h-16 bg-slate-100 rounded-lg animate-pulse mb-6" />}>
        <SearchBar categories={categories ?? []} />
      </Suspense>

      {!posts || posts.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          {hasFilters ? (
            <>
              <p className="text-lg font-medium mb-1">Aucun résultat</p>
              <p className="text-sm">Essayez avec d'autres mots-clés ou supprimez les filtres.</p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium mb-1">Aucune annonce pour l'instant</p>
              <p className="text-sm">Soyez le premier à publier !</p>
            </>
          )}
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
                  {getInitials(
                    post.profiles?.full_name ?? null,
                    post.profiles?.city ?? 'P'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        post.post_type === 'offre'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {post.post_type === 'offre' ? 'Offre' : 'Demande'}
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      {post.profiles?.full_name ?? 'Enseignant·e'}
                    </span>
                    {post.profiles?.academy && (
                      <span className="text-xs text-slate-400">
                        · Académie de {post.profiles.academy}
                      </span>
                    )}
                    {post.category_names?.map((name) => {
                      const color = categoryColor(name)
                      return (
                        <span
                          key={name}
                          className={`px-2 py-0.5 text-xs rounded font-medium ${color.bg} ${color.text}`}
                        >
                          {name}
                        </span>
                      )
                    })}
                  </div>
                  <h2 className="font-semibold text-slate-900 text-base leading-snug mb-1">
                    {post.title}
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {truncate(post.content, 160)}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    {(post.city || post.address) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {post.city ?? post.address}
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
