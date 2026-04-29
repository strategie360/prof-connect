import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isTeacherEmail } from '@/lib/utils'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  async function register(formData: FormData) {
    'use server'
    const email = (formData.get('email') as string).trim().toLowerCase()
    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string

    if (!isTeacherEmail(email)) {
      redirect('/register?error=email_invalide')
    }

    if (password !== confirm) {
      redirect('/register?error=mots_de_passe')
    }

    if (password.length < 8) {
      redirect('/register?error=mot_de_passe_court')
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      redirect('/register?error=inscription_impossible')
    }

    redirect('/verify')
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Créer un compte</h2>
      <p className="text-sm text-slate-500 mb-6">
        Réservé aux enseignants de l&apos;Éducation nationale
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error === 'email_invalide'
            ? 'Adresse email non autorisée. Utilisez votre email @ac-…fr ou @education.gouv.fr'
            : error === 'mots_de_passe'
              ? 'Les mots de passe ne correspondent pas.'
              : error === 'mot_de_passe_court'
                ? 'Le mot de passe doit contenir au moins 8 caractères.'
                : error === 'inscription_impossible'
                  ? 'Inscription impossible. Cet email est peut-être déjà utilisé.'
                  : 'Une erreur est survenue.'}
        </div>
      )}

      <form action={register} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Email professionnel
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="prenom.nom@ac-paris.fr"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <p className="mt-1 text-xs text-slate-400">
            @ac-academie.fr ou @education.gouv.fr
          </p>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="8 caractères minimum"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="confirm"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Confirmer le mot de passe
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
        >
          Créer mon compte
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-blue-600 hover:underline font-medium">
          Se connecter
        </Link>
      </p>
    </>
  )
}
