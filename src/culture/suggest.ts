import type { CultureCategory } from '../db'

export interface Suggestion {
  title: string
  // Année, auteur, réalisateur ou description courte.
  subtitle?: string
  cover?: string
  genres: string[]
  source: string
}

// Propositions pendant la saisie du titre, à la manière des applis de watchlist
// ou de Babelio. Sources gratuites, sans clé, appelées depuis le navigateur.

async function getJson(url: string, signal: AbortSignal) {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const year = (date?: string) => date?.slice(0, 4)

interface ItunesResult {
  trackName?: string
  collectionName?: string
  artistName?: string
  artworkUrl100?: string
  releaseDate?: string
  primaryGenreName?: string
}

async function itunes(q: string, media: 'movie' | 'tvShow', signal: AbortSignal): Promise<Suggestion[]> {
  const entity = media === 'movie' ? 'movie' : 'tvSeason'
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=${media}&entity=${entity}&country=fr&lang=fr_fr&limit=10`
  const data = await getJson(url, signal)
  return (data.results ?? []).map((r: ItunesResult) => ({
    // Les saisons arrivent sous la forme « Titre, Saison 2 ».
    title: (r.trackName ?? r.collectionName ?? '').replace(/,\s*Saison \d+$/i, ''),
    subtitle: [year(r.releaseDate), media === 'movie' ? r.artistName : undefined].filter(Boolean).join(' · '),
    cover: r.artworkUrl100?.replace('100x100bb', '600x600bb'),
    genres: r.primaryGenreName ? [r.primaryGenreName] : [],
    source: 'iTunes',
  }))
}

interface GoogleBook {
  volumeInfo: {
    title: string
    subtitle?: string
    authors?: string[]
    publishedDate?: string
    imageLinks?: { thumbnail?: string }
  }
}

async function googleBooks(q: string, signal: AbortSignal): Promise<Suggestion[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10&printType=books&langRestrict=fr`
  const data = await getJson(url, signal)
  return (data.items ?? []).map(({ volumeInfo: v }: GoogleBook) => ({
    title: v.title,
    subtitle: [v.authors?.join(', '), year(v.publishedDate)].filter(Boolean).join(' · '),
    cover: v.imageLinks?.thumbnail?.replace('http://', 'https://').replace('&edge=curl', ''),
    genres: [],
    source: 'Google Livres',
  }))
}

async function openLibrary(q: string, signal: AbortSignal): Promise<Suggestion[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8&fields=title,author_name,first_publish_year,cover_i`
  const data = await getJson(url, signal)
  return (data.docs ?? []).map(
    (d: { title: string; author_name?: string[]; first_publish_year?: number; cover_i?: number }) => ({
      title: d.title,
      subtitle: [d.author_name?.[0], d.first_publish_year].filter(Boolean).join(' · '),
      cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : undefined,
      genres: [],
      source: 'Open Library',
    }),
  )
}

// La recherche Wikipédia est guidée par un mot-clé (« jeu de société »…) ;
// pilicense=any inclut les boîtes et affiches non libres.
async function wikipedia(lang: 'fr' | 'en', q: string, hint: string, signal: AbortSignal): Promise<Suggestion[]> {
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*` +
    `&generator=search&gsrsearch=${encodeURIComponent(`${q} ${hint}`.trim())}&gsrlimit=8` +
    `&prop=pageimages|description&piprop=thumbnail&pithumbsize=500&pilicense=any`
  const data = await getJson(url, signal)
  const pages = Object.values(data.query?.pages ?? {}) as {
    index: number
    title: string
    description?: string
    thumbnail?: { source: string }
  }[]
  return pages
    .sort((a, b) => a.index - b.index)
    .map((p) => ({
      // « Catan (jeu) » → « Catan »
      title: p.title.replace(/\s*\([^)]*\)$/, ''),
      subtitle: p.description,
      cover: p.thumbnail?.source,
      genres: [],
      source: `Wikipédia ${lang}`,
    }))
}

function sourcesFor(category: CultureCategory, q: string, signal: AbortSignal) {
  switch (category) {
    case 'films':
      return [itunes(q, 'movie', signal)]
    case 'series':
      return [itunes(q, 'tvShow', signal)]
    case 'livres':
      return [googleBooks(q, signal), openLibrary(q, signal)]
    case 'jeux-video':
      return [wikipedia('fr', q, 'jeu vidéo', signal), wikipedia('en', q, 'video game', signal)]
    case 'jeux-societe':
      return [wikipedia('fr', q, 'jeu de société', signal), wikipedia('en', q, 'board game', signal)]
    case 'spectacles':
      return [wikipedia('fr', q, 'spectacle', signal)]
  }
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()

export async function suggest(category: CultureCategory, query: string, signal: AbortSignal) {
  const settled = await Promise.allSettled(sourcesFor(category, query.trim(), signal))
  // Sources entrelacées, doublons (même titre et même sous-titre) écartés.
  const lists = settled.map((s) => (s.status === 'fulfilled' ? s.value : []))
  const out: Suggestion[] = []
  const seen = new Set<string>()
  for (let i = 0; i < Math.max(0, ...lists.map((l) => l.length)); i++) {
    for (const list of lists) {
      const s = list[i]
      if (!s?.title) continue
      const key = `${norm(s.title)}|${norm(s.subtitle ?? '')}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(s)
    }
  }
  // Une œuvre avec image passe devant à pertinence égale ou presque.
  const ranked = out.map((s, i) => ({ s, score: i - (s.cover ? 3 : 0) })).sort((a, b) => a.score - b.score)
  return {
    suggestions: ranked.map((r) => r.s).slice(0, 8),
    failed: settled.every((s) => s.status === 'rejected'),
  }
}
