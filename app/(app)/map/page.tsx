import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
import { type Post } from '@/lib/types'

// Import dynamique sans SSR (Leaflet requiert le DOM)
const PostMap = dynamic(() => import('@/components/PostMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-sm">
      Chargement de la carte…
    </div>
  ),
})

export default async function MapPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, category_name, city, address, lat, lng, profiles(full_name)')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .order('created_at', { ascending: false })
    .limit(200)
    .returns<Post[]>()

  const withGeo = posts ?? []

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 3.5rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between py-3 mb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-semibold text-slate-900">Carte des annonces</h1>
            <p className="text-xs text-slate-400">
              {withGeo.length} annonce{withGeo.length !== 1 ? 's' : ''} géolocalisée{withGeo.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Carte */}
      {withGeo.length === 0 ? (
        <div className="flex-1 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-3 text-slate-400">
          <MapPin className="w-10 h-10 opacity-40" />
          <p className="text-base font-medium">Aucune annonce géolocalisée</p>
          <p className="text-sm text-center max-w-xs">
            Les annonces avec une adresse renseignée apparaissent ici.
          </p>
          <Link
            href="/post/new"
            className="mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Publier une annonce
          </Link>
        </div>
      ) : (
        <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          <PostMap posts={withGeo} />
        </div>
      )}
    </div>
  )
}
