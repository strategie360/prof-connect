import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { groqJSON } from '@/lib/groq'

export type PostAnalysis = {
  categories: string[]
  post_type: 'offre' | 'demande'
  key_info: Record<string, string | null>
  improved_title: string
  improved_content: string
  has_improvement: boolean
}

const SYSTEM_PROMPT = `Tu es un assistant expert pour ProfConnect, une plateforme d'annonces entre enseignants français.
Analyse l'annonce et réponds UNIQUEMENT en JSON valide avec exactement cette structure :
{
  "categories": ["catégorie"],
  "post_type": "offre" | "demande",
  "key_info": { "prix": null, "matière": null, "niveau": null, "format": null, "période": null, "type_bien": null },
  "improved_title": "...",
  "improved_content": "...",
  "has_improvement": false
}

Règles :
- categories : 1 à 3 items. Utilise prioritairement : "Cours & éducation", "Logement & échange", "Biens (achat/vente)", "Services". Puis affine avec une sous-catégorie si utile (ex: "Location", "Cours particuliers").
- post_type : "offre" si l'auteur propose, "demande" s'il cherche.
- key_info : extrais uniquement les infos présentes. Mets null sinon.
- improved_title/content : corrige fautes, améliore clarté, reste concis. Si c'est déjà bien, retourne l'original identique.
- has_improvement : true seulement si tu as vraiment amélioré le texte.`

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

  try {
    const result = await groqJSON<PostAnalysis>(
      SYSTEM_PROMPT,
      `Titre : ${title ?? ''}\nDescription : ${content ?? ''}`,
      512
    )
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Analyse impossible' }, { status: 500 })
  }
}
