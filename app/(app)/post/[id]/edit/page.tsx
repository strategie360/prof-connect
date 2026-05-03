import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { type Post, type Category } from '@/lib/types'
import EditPostForm from '@/components/EditPostForm'

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: post }, { data: categories }, { data: profile }] = await Promise.all([
    supabase.from('posts').select('*').eq('id', id).eq('author_id', user.id).single<Post>(),
    supabase.from('categories').select('*').order('post_count', { ascending: false }).returns<Category[]>(),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  if (!post) notFound()

  const canCreateCategory = profile?.role === 'admin' || profile?.role === 'moderateur'

  return (
    <div>
      <Link
        href={`/post/${id}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à l&apos;annonce
      </Link>

      <h1 className="text-xl font-semibold text-slate-900 mb-6">Modifier l&apos;annonce</h1>

      <EditPostForm post={post} categories={categories ?? []} error={error} canCreateCategory={canCreateCategory} />
    </div>
  )
}
