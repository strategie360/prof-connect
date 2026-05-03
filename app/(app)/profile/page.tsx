import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Calendar, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { type Profile, type Post } from '@/lib/types'
import { getInitials, formatRelativeDate, truncate } from '@/lib/utils'
import { ACADEMIES, SUBJECTS } from '@/lib/constants'
import { categoryColor } from '@/lib/categoryColor'
import { deletePost } from '@/app/(app)/post/actions'
import CityAutocomplete from '@/components/CityAutocomplete'

export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  const { saved, error } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: myPosts }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single<Profile>(),
    supabase
      .from('posts')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .returns<Post[]>(),
  ])

  async function updateProfile(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const full_name = (formData.get('full_name') as string).trim()
    const academy = (formData.get('academy') as string).trim()
    const subject = (formData.get('subject') as string).trim()
    const city = (formData.get('city') as string).trim()
    const bio = (formData.get('bio') as string).trim()

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: full_name || null,
        academy: academy || null,
        subject: subject || null,
        city: city || null,
        bio: bio || null,
      })
      .eq('id', user.id)

    if (error) redirect('/profile?error=sauvegarde_impossible')
    redirect('/profile?saved=1')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 mb-6">Mon profil</h1>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 font-bold text-xl flex items-center justify-center">
              {getInitials(profile?.full_name ?? null, user.email!)}
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                {profile?.full_name ?? 'Sans nom'}
              </p>
              <p className="text-sm text-slate-400">{user.email}</p>
            </div>
          </div>

          {saved && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Profil sauvegardé avec succès.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              Sauvegarde impossible, réessayez.
            </div>
          )}

          <form action={updateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="full_name"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Prénom et nom
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  defaultValue={profile?.full_name ?? ''}
                  placeholder="Marie Dupont"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="academy"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Académie
                </label>
                <select
                  id="academy"
                  name="academy"
                  defaultValue={profile?.academy ?? ''}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">Choisir une académie…</option>
                  {ACADEMIES.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Matière enseignée
                </label>
                <select
                  id="subject"
                  name="subject"
                  defaultValue={profile?.subject ?? ''}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">Choisir une matière…</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ville
                </label>
                <CityAutocomplete initialValue={profile?.city ?? ''} />
              </div>
            </div>

            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Bio <span className="text-slate-400 font-normal">(optionnel)</span>
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                defaultValue={profile?.bio ?? ''}
                placeholder="Quelques mots sur vous, vos projets, vos disponibilités…"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Mes annonces */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Mes annonces{' '}
            <span className="text-slate-400 font-normal text-base">
              ({myPosts?.length ?? 0})
            </span>
          </h2>
          <Link
            href="/post/new"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            + Nouvelle annonce
          </Link>
        </div>

        {!myPosts?.length ? (
          <p className="text-sm text-slate-400">Vous n&apos;avez pas encore publié d&apos;annonce.</p>
        ) : (
          <div className="space-y-3">
            {myPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
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
                    <Link href={`/post/${post.id}`} className="block hover:underline">
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-1">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {truncate(post.content, 120)}
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
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link
                      href={`/post/${post.id}/edit`}
                      className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Modifier"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <form action={deletePost.bind(null, post.id)}>
                      <button
                        type="submit"
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
