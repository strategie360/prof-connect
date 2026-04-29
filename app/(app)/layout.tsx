import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MessageSquare, User, LogOut, Layers } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { count: unreadCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', user.id)
    .is('read_at', null)

  async function logout() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-blue-600 text-lg"
          >
            <Layers className="w-5 h-5" />
            ProfConnect
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/messages"
              className="relative flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title="Messages"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadCount && unreadCount > 0 ? (
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
              ) : null}
            </Link>

            <Link
              href="/profile"
              className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title="Mon profil"
            >
              <User className="w-5 h-5" />
            </Link>

            <form action={logout}>
              <button
                type="submit"
                className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
