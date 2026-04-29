'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = (formData.get('title') as string).trim()
  const content = (formData.get('content') as string).trim()
  const post_type = formData.get('post_type') === 'offre' ? 'offre' : 'demande'
  const category_names = (formData.getAll('category_names') as string[]).filter(Boolean)
  const address = (formData.get('address') as string | null)?.trim() || null
  const city = (formData.get('city') as string | null)?.trim() || null
  const latRaw = formData.get('lat') as string | null
  const lngRaw = formData.get('lng') as string | null
  const lat = latRaw ? parseFloat(latRaw) : null
  const lng = lngRaw ? parseFloat(lngRaw) : null

  if (!title || !content) redirect('/post/new?error=champs_requis')

  // Upsert des catégories (crée celles qui n'existent pas encore)
  for (const name of category_names) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', name)
      .maybeSingle()
    if (!existing) {
      await supabase.from('categories').insert({ name })
    }
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      title,
      content,
      post_type,
      category_names,
      address,
      city,
      lat: lat && !isNaN(lat) ? lat : null,
      lng: lng && !isNaN(lng) ? lng : null,
    })
    .select('id')
    .single()

  if (error) redirect('/post/new?error=publication_impossible')
  redirect(`/post/${data.id}`)
}

export async function deletePost(postId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('posts').delete().eq('id', postId).eq('author_id', user.id)
  redirect('/')
}
