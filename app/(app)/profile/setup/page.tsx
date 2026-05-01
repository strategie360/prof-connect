import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileSetupForm from '@/components/ProfileSetupForm'

export default async function ProfileSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, academy')
    .eq('id', user.id)
    .single()

  if (profile?.full_name && profile?.academy) redirect('/')

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white text-2xl flex items-center justify-center mx-auto mb-4">
          👋
        </div>
        <h1 className="text-xl font-semibold text-slate-900 mb-1">
          Bienvenue sur ProfConnect
        </h1>
        <p className="text-sm text-slate-500">
          Quelques infos pour compléter votre profil
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <ProfileSetupForm error={error} />
      </div>
    </div>
  )
}
