'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function setupProfile(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const full_name = (formData.get('full_name') as string).trim()
  const academy = (formData.get('academy') as string).trim()
  const subject = (formData.get('subject') as string | null)?.trim() || null
  const city = (formData.get('city') as string | null)?.trim() || null

  if (!full_name || !academy) redirect('/profile/setup?error=champs_requis')

  await supabase
    .from('profiles')
    .update({ full_name, academy, subject, city })
    .eq('id', user.id)

  redirect('/')
}
