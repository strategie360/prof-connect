'use client'

import { useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import type { Post } from '@/lib/types'

type Props = {
  posts: Post[]
}

export default function PostMap({ posts }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

    ;(async () => {
      const L = await import('leaflet')
      if (cancelled || !containerRef.current || mapRef.current) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const postsWithGeo = posts.filter((p) => p.lat && p.lng)

      let center: [number, number] = [46.6, 2.3]
      let zoom = 5
      if (postsWithGeo.length === 1) {
        center = [postsWithGeo[0].lat!, postsWithGeo[0].lng!]
        zoom = 12
      } else if (postsWithGeo.length > 1) {
        const avgLat = postsWithGeo.reduce((s, p) => s + p.lat!, 0) / postsWithGeo.length
        const avgLng = postsWithGeo.reduce((s, p) => s + p.lng!, 0) / postsWithGeo.length
        center = [avgLat, avgLng]
        zoom = 6
      }

      const map = L.map(containerRef.current!).setView(center, zoom)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

      postsWithGeo.forEach((post) => {
        L.marker([post.lat!, post.lng!])
          .bindPopup(
            `<div style="min-width:180px;font-family:system-ui">
              <p style="font-weight:600;margin:0 0 4px">${post.title}</p>
              ${post.category_names?.length ? `<span style="background:#eff6ff;color:#1d4ed8;font-size:11px;padding:2px 8px;border-radius:999px">${post.category_names.join(', ')}</span>` : ''}
              ${post.city ? `<p style="color:#64748b;font-size:12px;margin:4px 0 0">${post.city}</p>` : ''}
              <a href="/post/${post.id}" style="display:inline-block;margin-top:8px;color:#2563eb;font-size:12px;font-weight:500">Voir l'annonce →</a>
            </div>`,
            { maxWidth: 240 }
          )
          .addTo(map)
      })
    })()

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
      <div ref={containerRef} className="w-full h-full" />
    </>
  )
}
