import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { groqJSON } from '@/lib/groq'

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
    .select('name')
    .order('post_count', { ascending: false })
    .limit(30)

  const existingList =
    categories && categories.length > 0
      ? categories.map((c) => c.name).join(', ')
      : 'aucune encore'

  try {
    const result = await groqJSON<{ category: string }>(
      `Tu es un assistant de classification d'annonces pour enseignants français.
Réponds UNIQUEMENT en JSON : { "category": "nom de la catégorie" }
Catégories existantes : ${existingList}
Propose UNE catégorie courte (2-3 mots) en français. Utilise une existante si elle convient.`,
      `Titre : ${title ?? ''}\nDescription : ${content ?? ''}`,
      32
    )
    return NextResponse.json({ category: result.category })
  } catch {
    return NextResponse.json({ error: 'Analyse impossible' }, { status: 500 })
  }
}
