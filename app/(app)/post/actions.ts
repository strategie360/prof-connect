'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MAX_CATEGORIES } from '@/lib/constants'

async function resolveCategories(
  supabase: Awaited<ReturnType<typeof createClient>>,
  names: string[],
  aiNames: string[],
  canCreate: boolean
): Promise<string[]> {
  // Catégories IA : toujours upsertées, quel que soit le rôle
  for (const name of aiNames) {
    const { data: existing } = await supabase
      .from('categories').select('id').ilike('name', name).maybeSingle()
    if (!existing) await supabase.from('categories').insert({ name })
  }

  if (canCreate) {
    // Modérateur / admin : upsert aussi les catégories manuelles
    for (const name of names) {
      if (aiNames.some((a) => a.toLowerCase() === name.toLowerCase())) continue
      const { data: existing } = await supabase
        .from('categories').select('id').ilike('name', name).maybeSingle()
      if (!existing) await supabase.from('categories').insert({ name })
    }
    return names
  }

  // User : filtre les noms manuels inconnus (les noms IA sont déjà dans la DB)
  const { data: existing } = await supabase
    .from('categories').select('name').in('name', names)
  const existingNames = new Set((existing ?? []).map((r) => r.name.toLowerCase()))
  return names.filter((n) => existingNames.has(n.toLowerCase()))
}

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = (formData.get('title') as string).trim()
  const content = (formData.get('content') as string).trim()
  const post_type = formData.get('post_type') === 'offre' ? 'offre' : 'demande'
  const rawCategories = (formData.getAll('category_names') as string[]).filter(Boolean).slice(0, MAX_CATEGORIES)
  const address = (formData.get('address') as string | null)?.trim() || null
  const city = (formData.get('city') as string | null)?.trim() || null
  const latRaw = formData.get('lat') as string | null
  const lngRaw = formData.get('lng') as string | null
  const lat = latRaw ? parseFloat(latRaw) : null
  const lng = lngRaw ? parseFloat(lngRaw) : null

  if (!title || !content) redirect('/post/new?error=champs_requis')

  const aiCategories = (formData.getAll('ai_category_names') as string[]).filter(Boolean)
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const canCreate = profile?.role === 'admin' || profile?.role === 'moderateur'
  const category_names = await resolveCategories(supabase, rawCategories, aiCategories, canCreate)

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

export async function updatePost(postId: string, formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = (formData.get('title') as string).trim()
  const content = (formData.get('content') as string).trim()
  const post_type = formData.get('post_type') === 'offre' ? 'offre' : 'demande'
  const rawCategories = (formData.getAll('category_names') as string[]).filter(Boolean).slice(0, MAX_CATEGORIES)
  const address = (formData.get('address') as string | null)?.trim() || null
  const city = (formData.get('city') as string | null)?.trim() || null
  const latRaw = formData.get('lat') as string | null
  const lngRaw = formData.get('lng') as string | null
  const lat = latRaw ? parseFloat(latRaw) : null
  const lng = lngRaw ? parseFloat(lngRaw) : null

  if (!title || !content) redirect(`/post/${postId}/edit?error=champs_requis`)

  const aiCategories = (formData.getAll('ai_category_names') as string[]).filter(Boolean)
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const canCreate = profile?.role === 'admin' || profile?.role === 'moderateur'
  const category_names = await resolveCategories(supabase, rawCategories, aiCategories, canCreate)

  const { error } = await supabase
    .from('posts')
    .update({
      title,
      content,
      post_type,
      category_names,
      address,
      city,
      lat: lat && !isNaN(lat) ? lat : null,
      lng: lng && !isNaN(lng) ? lng : null,
    })
    .eq('id', postId)
    .eq('author_id', user.id)

  if (error) redirect(`/post/${postId}/edit?error=modification_impossible`)
  redirect(`/post/${postId}`)
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
