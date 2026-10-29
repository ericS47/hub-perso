import type { CultureCategory } from '../db'

export interface CoverHit {
  url: string
  label: string
  source: string
}

// Sources gratuites, sans clé et ouvertes aux appels depuis le navigateur.
// Chaque source est interrogée séparément : une panne n'empêche pas les autres.

async function getJson(url: string, signal: AbortSignal) {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function itunes(q: string, media: string, entity: string, signal: AbortSignal): Promise<CoverHit[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=${media}&entity=${entity}&country=fr&limit=8`
  const data = await getJson(url, signal)
  return (data.results ?? [])
    .filter((r: { artworkUrl100?: string }) => r.artworkUrl100)
    .map((r: { artworkUrl100: string; trackName?: string; collectionName?: string }) => ({
      url: r.artworkUrl100.replace('100x100bb', '600x600bb'),
      label: r.trackName ?? r.collectionName ?? q,
      source: 'iTunes',
    }))
}

async function googleBooks(q: string, signal: AbortSignal): Promise<CoverHit[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=8&printType=books`
  const data = await getJson(url, signal)
  return (data.items ?? [])
    .filter((b: { volumeInfo?: { imageLinks?: { thumbnail?: string } } }) => b.volumeInfo?.imageLinks?.thumbnail)
    .map((b: { volumeInfo: { title: string; imageLinks: { thumbnail: string } } }) => ({
      url: b.volumeInfo.imageLinks.thumbnail.replace('http://', 'https://').replace('&edge=curl', ''),
      label: b.volumeInfo.title,
      source: 'Google Livres',
    }))
}

async function openLibrary(q: string, signal: AbortSignal): Promise<CoverHit[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8&fields=title,cover_i`
  const data = await getJson(url, signal)
  return (data.docs ?? [])
    .filter((d: { cover_i?: number }) => d.cover_i)
    .map((d: { title: string; cover_i: number }) => ({
      url: `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`,
      label: d.title,
      source: 'Open Library',
    }))
}

// pilicense=any : inclut les affiches et boîtes non libres (wiki anglophone).
async function wikipedia(lang: 'fr' | 'en', q: string, signal: AbortSignal): Promise<CoverHit[]> {
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*` +
    `&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=6` +
    `&prop=pageimages&piprop=thumbnail&pithumbsize=500&pilicense=any`
  const data = await getJson(url, signal)
  const pages = Object.values(data.query?.pages ?? {}) as {
    index: number
    title: string
    thumbnail?: { source: string }
  }[]
  return pages
    .filter((p) => p.thumbnail)
    .sort((a, b) => a.index - b.index)
    .map((p) => ({ url: p.thumbnail!.source, label: p.title, source: `Wikipédia ${lang}` }))
}

function sourcesFor(category: CultureCategory, q: string, signal: AbortSignal) {
  switch (category) {
    case 'films':
      return [itunes(q, 'movie', 'movie', signal), wikipedia('en', `${q} film`, signal)]
    case 'series':
      return [itunes(q, 'tvShow', 'tvSeason', signal), wikipedia('en', `${q} TV series`, signal)]
    case 'livres':
      return [googleBooks(q, signal), openLibrary(q, signal)]
    case 'jeux-video':
      return [wikipedia('en', `${q} video game`, signal), wikipedia('fr', `${q} jeu vidéo`, signal)]
    case 'jeux-societe':
      return [wikipedia('en', `${q} board game`, signal), wikipedia('fr', `${q} jeu de société`, signal)]
    case 'spectacles':
      return [wikipedia('fr', q, signal), wikipedia('en', q, signal)]
  }
}

export async function searchCovers(category: CultureCategory, title: string, signal: AbortSignal) {
  const settled = await Promise.allSettled(sourcesFor(category, title.trim(), signal))
  const seen = new Set<string>()
  const hits: CoverHit[] = []
  for (const s of settled) {
    if (s.status !== 'fulfilled') continue
    for (const h of s.value) {
      if (seen.has(h.url)) continue
      seen.add(h.url)
      hits.push(h)
    }
  }
  const failed = settled.every((s) => s.status === 'rejected')
  return { hits: hits.slice(0, 16), failed }
}
