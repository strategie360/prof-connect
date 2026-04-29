import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, MapPin, Calendar } from 'lucide-react'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { type Post } from '@/lib/types'
import { formatRelativeDate, getInitials, truncate, haversineKm } from '@/lib/utils'
import { categoryColor } from '@/lib/categoryColor'
import SearchBar from '@/components/SearchBar'

type PostWithDistance = Post & { distance_km?: number }

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; slat?: string; slng?: string; radius?: string }>
}) {
  const { q, category, slat, slng, radius } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('post_count', { ascending: false })
    .limit(20)

  const searchLat = slat ? parseFloat(slat) : null
  const searchLng = slng ? parseFloat(slng) : null
  const radiusKm = radius ? parseFloat(radius) : null
  const hasDistanceFilter = searchLat !== null && searchLng !== null && radiusKm !== null

  // Fetch more when distance filtering so we can apply Haversine after
  const fetchLimit = hasDistanceFilter ? 500 : 50

  let query = supabase
    .from('posts')
    .select('*, profiles(id, full_name, academy, city)')
    .order('created_at', { ascending: false })
    .limit(fetchLimit)

  if (q) {
    query = query.textSearch(
      'search_vector',
      q.trim().split(/\s+/).filter(Boolean).join(' | '),
      { config: 'french' }
    )
  }

  if (category) {
    query = query.contains('category_names', [category])
  }

  // Pre-filter to geolocated posts only when distance filter is active
  if (hasDistanceFilter) {
    query = query.not('lat', 'is', null)
  }

  const { data: rawPosts } = await query.returns<Post[]>()

  // Apply Haversine distance filter + sort
  let posts: PostWithDistance[] | null = rawPosts
  if (rawPosts && hasDistanceFilter && searchLat !== null && searchLng !== null && radiusKm !== null) {
    posts = rawPosts
      .map((p) => ({
        ...p,
        distance_km:
          p.lat != null && p.lng != null
            ? haversineKm(searchLat, searchLng, p.lat, p.lng)
            : undefined,
      }))
      .filter((p) => p.distance_km !== undefined && p.distance_km <= radiusKm)
      .sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999))
  }

  const hasFilters = !!(q || category || hasDistanceFilter)

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

      <Suspense fallback={<div className="h-24 bg-slate-100 rounded-lg animate-pulse mb-6" />}>
        <SearchBar categories={categories ?? []} />
      </Suspense>

      {!posts || posts.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          {hasFilters ? (
            <>
              <p className="text-lg font-medium mb-1">Aucun résultat</p>
              <p className="text-sm">Essayez avec d&apos;autres mots-clés ou supprimez les filtres.</p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium mb-1">Aucune annonce pour l&apos;instant</p>
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
                    {post.distance_km !== undefined && (
                      <span className="flex items-center gap-1 text-blue-500 font-medium">
                        <MapPin className="w-3 h-3" />
                        {post.distance_km < 1
                          ? '< 1 km'
                          : `${Math.round(post.distance_km)} km`}
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
