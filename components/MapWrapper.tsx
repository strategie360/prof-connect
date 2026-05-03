'use client'

import dynamic from 'next/dynamic'
import type { Post } from '@/lib/types'

const PostMap = dynamic(() => import('./PostMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-sm">
      Chargement de la carte…
    </div>
  ),
})

export default function MapWrapper({ posts }: { posts: Post[] }) {
  return <PostMap posts={posts} />
}
