import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { title, content } = await req.json()
  if (!title && !content) {
    return NextResponse.json({ error: 'Titre ou contenu requis' }, { status: 400 })
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('name, post_count')
    .order('post_count', { ascending: false })
    .limit(30)

  const existingList =
    categories && categories.length > 0
      ? categories.map((c) => c.name).join(', ')
      : 'aucune encore'

  const client = new Anthropic()
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 50,
    messages: [
      {
        role: 'user',
        content: `Tu es un assistant de classification d'annonces pour enseignants français.

Catégories existantes : ${existingList}

Annonce à classer :
Titre : ${title ?? ''}
Description : ${content ?? ''}

Propose UNE catégorie courte (2-3 mots maximum) en français pour cette annonce.
- Si une catégorie existante convient parfaitement, utilise-la à l'identique.
- Sinon, crée une catégorie courte et descriptive.
Réponds UNIQUEMENT avec le nom de la catégorie, sans ponctuation ni explication.`,
      },
    ],
  })

  const category = (
    message.content[0] as { type: string; text: string }
  ).text.trim()

  return NextResponse.json({ category })
}
