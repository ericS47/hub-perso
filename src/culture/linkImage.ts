import { loads } from './fillCovers'

// Lien collé → image. Lien direct vers une image : utilisé tel quel. Lien vers
// la page d'un produit : on demande à Microlink (service d'aperçu de liens,
// gratuit sans clé, 50 liens par jour) l'image d'aperçu que les sites
// fournissent pour les partages. Certains sites (Amazon…) la cachent.

export const isWebLink = (s: string) => /^https?:\/\/\S+\.\S+/.test(s.trim())

export async function imageFromLink(link: string, signal?: AbortSignal): Promise<string | undefined> {
  const url = link.trim()
  if (await loads(url, 8000, 100)) return url
  if (signal?.aborted) return undefined
  const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`, { signal })
  if (!res.ok) return undefined
  const data = await res.json()
  const image: string | undefined = data?.data?.image?.url
  // Images factices (1 pixel, data:) que renvoient certains sites : écartées.
  if (!image || image.startsWith('data:') || !(await loads(image, 8000, 100))) return undefined
  return image
}
