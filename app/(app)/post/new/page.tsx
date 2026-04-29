import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { type Category } from '@/lib/types'
import NewPostForm from '@/components/NewPostForm'

export default async function NewPostPage({
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

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('post_count', { ascending: false })
    .returns<Category[]>()

  return (
    <div>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au fil
      </Link>

      <h1 className="text-xl font-semibold text-slate-900 mb-6">Nouvelle annonce</h1>

      <NewPostForm categories={categories ?? []} error={error} />
    </div>
  )
}
