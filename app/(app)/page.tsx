import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, MapPin, Calendar } from 'lucide-react'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { type Post } from '@/lib/types'
import { formatRelativeDate, getInitials, truncate } from '@/lib/utils'
import { categoryColor } from '@/lib/categoryColor'
import SearchBar from '@/components/SearchBar'

const PAGE_SIZE = 20

type PostWithDistance = Post & { distance_km?: number }

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    categories?: string
    slat?: string
    slng?: string
    sloc?: string
    radius?: string
    page?: string
  }>
}) {
  const { q, categories: categoriesParam, slat, slng, sloc, radius, page: pageParam } = await searchParams
  const selectedCategories = categoriesParam ? categoriesParam.split(',').filter(Boolean) : []
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Redirect to onboarding if profile is incomplete
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, academy')
    .eq('id', user.id)
    .single()
  if (!profile?.full_name || !profile?.academy) redirect('/profile/setup')

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('post_count', { ascending: false })
    .limit(20)

  const searchLat = slat ? parseFloat(slat) : null
  const searchLng = slng ? parseFloat(slng) : null
  const radiusKm = radius ? parseFloat(radius) : null
  const hasDistanceFilter = searchLat !== null && searchLng !== null && radiusKm !== null
  const page = Math.max(1, parseInt(pageParam ?? '1'))
  const showCount = page * PAGE_SIZE

  // Prépare le tsquery pour la recherche textuelle
  const tsquery = q
    ? q
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w.replace(/[^\p{L}\p{N}]/gu, '') + ':*')
        .filter((w) => w.length > 1)
        .join(' & ')
    : null

  let posts: PostWithDistance[] = []
  let hasMore = false

  if (hasDistanceFilter && searchLat !== null && searchLng !== null && radiusKm !== null) {
    // Filtre distance côté serveur via PostGIS
    const { data: nearby } = await supabase.rpc('posts_within_radius', {
      p_lat: searchLat,
      p_lng: searchLng,
      p_radius_km: radiusKm,
      p_limit: showCount + 1,
    }) as { data: { id: string; distance_km: number }[] | null }

    hasMore = (nearby?.length ?? 0) > showCount
    const nearbyPage = (nearby ?? []).slice(0, showCount)
    const distanceMap = Object.fromEntries(nearbyPage.map((r) => [r.id, r.distance_km]))
    const nearbyIds = nearbyPage.map((r) => r.id)

    if (nearbyIds.length > 0) {
      let q2 = supabase
        .from('posts')
        .select('*, profiles(id, full_name, academy, city)')
        .in('id', nearbyIds)
        .neq('author_id', user.id)
      if (tsquery) q2 = q2.textSearch('search_vector', tsquery, { config: 'french' })
      if (selectedCategories.length > 0) q2 = q2.overlaps('category_names', selectedCategories)

      const { data } = await q2.returns<Post[]>()
      posts = (data ?? [])
        .map((p) => ({ ...p, distance_km: distanceMap[p.id] }))
        .sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999))
    }
  } else {
    // Requête normale avec pagination
    let query = supabase
      .from('posts')
      .select('*, profiles(id, full_name, academy, city)')
      .neq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(showCount + 1)

    if (tsquery) query = query.textSearch('search_vector', tsquery, { config: 'french' })
    if (selectedCategories.length > 0) query = query.overlaps('category_names', selectedCategories)

    const { data } = await query.returns<Post[]>()
    hasMore = (data?.length ?? 0) > showCount
    posts = (data ?? []).slice(0, showCount)
  }

  // URL pour "Charger plus" — préserve tous les filtres actifs
  const loadMoreParams = new URLSearchParams()
  if (q) loadMoreParams.set('q', q)
  if (categoriesParam) loadMoreParams.set('categories', categoriesParam)
  if (slat) loadMoreParams.set('slat', slat)
  if (slng) loadMoreParams.set('slng', slng)
  if (sloc) loadMoreParams.set('sloc', sloc)
  if (radius) loadMoreParams.set('radius', radius)
  loadMoreParams.set('page', String(page + 1))

  const hasFilters = !!(q || selectedCategories.length || hasDistanceFilter)

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Fil des annonces</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {posts.length} annonce{posts.length !== 1 ? 's' : ''}
            {hasFilters && ' trouvée' + (posts.length !== 1 ? 's' : '')}
            {hasMore && '+'}
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

      {posts.length === 0 ? (
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
        <>
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
                          {post.distance_km < 1 ? '< 1 km' : `${post.distance_km} km`}
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

          {hasMore && (
            <div className="mt-6 text-center">
              <Link
                href={`?${loadMoreParams.toString()}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-blue-600 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Charger plus d&apos;annonces
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
