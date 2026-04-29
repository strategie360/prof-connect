import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { type Profile } from '@/lib/types'
import { getInitials } from '@/lib/utils'

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

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
              <input
                id="academy"
                name="academy"
                type="text"
                defaultValue={profile?.academy ?? ''}
                placeholder="Paris, Lyon, Versailles…"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Matière enseignée
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                defaultValue={profile?.subject ?? ''}
                placeholder="Mathématiques, Français, Histoire…"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Ville
              </label>
              <input
                id="city"
                name="city"
                type="text"
                defaultValue={profile?.city ?? ''}
                placeholder="Paris, Bordeaux…"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
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
  )
}
