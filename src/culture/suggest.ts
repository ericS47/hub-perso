import type { CultureCategory } from '../db'

export interface Suggestion {
  title: string
  // Année, auteur, réalisateur ou description courte.
  subtitle?: string
  cover?: string
  genres: string[]
  source: string
}

export interface SourceStatus {
  name: string
  ok: boolean
  count: number
}

// Propositions pendant la saisie du titre, à la manière des applis de watchlist
// ou de Babelio. Sources gratuites, sans clé, appelées depuis le navigateur.

async function getJson(url: string, signal: AbortSignal) {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

let jsonpSeq = 0

// iTunes n'autorise pas toujours les appels directs depuis une page web :
// JSONP (réponse chargée comme un script) contourne cette restriction.
export function jsonp(url: string, signal: AbortSignal, timeoutMs = 8000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const name = `__hubJsonp${++jsonpSeq}`
    const w = window as unknown as Record<string, unknown>
    const script = document.createElement('script')
    const cleanup = () => {
      // Une réponse tardive appellera une fonction vide plutôt que de planter.
      w[name] = () => {}
      script.remove()
      window.clearTimeout(timer)
      signal.removeEventListener('abort', onAbort)
    }
    const onAbort = () => {
      cleanup()
      reject(new DOMException('Annulé', 'AbortError'))
    }
    const timer = window.setTimeout(() => {
      cleanup()
      reject(new Error('Délai dépassé'))
    }, timeoutMs)
    w[name] = (data: unknown) => {
      cleanup()
      resolve(data)
    }
    script.onerror = () => {
      cleanup()
      reject(new Error('Script refusé'))
    }
    signal.addEventListener('abort', onAbort)
    script.src = `${url}&callback=${name}`
    document.head.appendChild(script)
  })
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
  const data = (await jsonp(url, signal)) as { results?: ItunesResult[] }
  return (data.results ?? []).map((r) => ({
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
    authors?: string[]
    publishedDate?: string
    imageLinks?: { thumbnail?: string }
  }
}

async function googleBooks(q: string, signal: AbortSignal): Promise<Suggestion[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10&printType=books`
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
  // Dernier mot complété par * : « dun » trouve « Dune ».
  const prefix = q.replace(/[*?:()"]/g, ' ').trim() + '*'
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(prefix)}&limit=8&fields=title,author_name,first_publish_year,cover_i`
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

// Wikidata : recherche faite pour l'autocomplétion (début de mot accepté),
// filtrée par la description de l'œuvre pour ne garder que le bon type.
const WIKIDATA_TYPE: Record<CultureCategory, RegExp> = {
  films: /film|movie|long[- ]métrage|court[- ]métrage|documentaire|documentary/i,
  series: /série|feuilleton|television series|tv series|web series|miniseries|sitcom|anime|téléfilm/i,
  'jeux-video': /jeu vidéo|video game/i,
  'jeux-societe': /jeu de société|jeu de cartes|jeu de plateau|jeu de rôle|board game|card game|tabletop/i,
  livres: /roman|livre|bande dessinée|manga|essai|recueil|nouvelle|novel|book|comic|biographi|poè|saga/i,
  spectacles: /spectacle|théâtre|comédie musicale|opéra|ballet|cirque|humour|humoriste|one[- ]man|show|tournée|musical|play/i,
}

interface WikidataHit {
  id: string
  label?: string
  description?: string
}

async function pageImages(lang: 'fr' | 'en', titles: string[], signal: AbortSignal) {
  if (titles.length === 0) return new Map<string, string>()
  const url =
    `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1` +
    `&titles=${encodeURIComponent(titles.join('|'))}&prop=pageimages&piprop=thumbnail&pithumbsize=500&pilicense=any`
  const data = await getJson(url, signal)
  // Titre demandé → titre final (normalisation, redirections) → image.
  const alias = new Map<string, string>()
  for (const n of [...(data.query?.normalized ?? []), ...(data.query?.redirects ?? [])]) alias.set(n.from, n.to)
  const byTitle = new Map<string, string>()
  for (const p of Object.values(data.query?.pages ?? {}) as { title: string; thumbnail?: { source: string } }[]) {
    if (p.thumbnail) byTitle.set(p.title, p.thumbnail.source)
  }
  const out = new Map<string, string>()
  for (const t of titles) {
    let final = t
    for (let i = 0; i < 3 && alias.has(final); i++) final = alias.get(final)!
    const img = byTitle.get(final)
    if (img) out.set(t, img)
  }
  return out
}

async function wikidata(category: CultureCategory, q: string, signal: AbortSignal): Promise<Suggestion[]> {
  const url =
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&origin=*` +
    `&language=fr&uselang=fr&type=item&limit=50&search=${encodeURIComponent(q)}`
  const data = await getJson(url, signal)
  const hits = ((data.search ?? []) as WikidataHit[])
    .filter((h) => h.label && h.description && WIKIDATA_TYPE[category].test(h.description))
    .slice(0, 8)
  if (hits.length === 0) return []

  // Couvertures : via les articles Wikipédia liés (anglais d'abord, affiches incluses).
  const covers = new Map<string, string>()
  try {
    const links = await getJson(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&origin=*&props=sitelinks` +
        `&sitefilter=enwiki|frwiki&ids=${hits.map((h) => h.id).join('|')}`,
      signal,
    )
    const entities = links.entities ?? {}
    const en = new Map<string, string>()
    const fr = new Map<string, string>()
    for (const h of hits) {
      const s = entities[h.id]?.sitelinks ?? {}
      if (s.enwiki) en.set(h.id, s.enwiki.title)
      if (s.frwiki) fr.set(h.id, s.frwiki.title)
    }
    const [enImg, frImg] = await Promise.all([
      pageImages('en', [...en.values()], signal).catch(() => new Map<string, string>()),
      pageImages('fr', [...fr.values()], signal).catch(() => new Map<string, string>()),
    ])
    for (const h of hits) {
      const img = enImg.get(en.get(h.id) ?? '') ?? frImg.get(fr.get(h.id) ?? '')
      if (img) covers.set(h.id, img)
    }
  } catch {
    // Sans couverture, la proposition reste utile.
  }

  return hits.map((h) => ({
    title: h.label!,
    subtitle: h.description,
    cover: covers.get(h.id),
    genres: [],
    source: 'Wikidata',
  }))
}

type Source = { name: string; run: (signal: AbortSignal) => Promise<Suggestion[]> }

function sourcesFor(category: CultureCategory, q: string): Source[] {
  const wd: Source = { name: 'Wikidata', run: (s) => wikidata(category, q, s) }
  switch (category) {
    case 'films':
      return [{ name: 'iTunes', run: (s) => itunes(q, 'movie', s) }, wd]
    case 'series':
      return [{ name: 'iTunes', run: (s) => itunes(q, 'tvShow', s) }, wd]
    case 'livres':
      return [
        { name: 'Google Livres', run: (s) => googleBooks(q, s) },
        { name: 'Open Library', run: (s) => openLibrary(q, s) },
        wd,
      ]
    default:
      return [wd]
  }
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()

const yearOf = (s: Suggestion) => s.subtitle?.match(/\b(1[5-9]\d\d|20\d\d)\b/)?.[1]

export async function suggest(category: CultureCategory, query: string, signal: AbortSignal) {
  const sources = sourcesFor(category, query.trim())
  const settled = await Promise.allSettled(sources.map((s) => s.run(signal)))
  const lists = settled.map((s) => (s.status === 'fulfilled' ? s.value : []))
  const status: SourceStatus[] = sources.map((s, i) => ({
    name: s.name,
    ok: settled[i].status === 'fulfilled',
    count: lists[i].length,
  }))

  // Sources entrelacées. Doublon = même titre venant d'une autre source, sans
  // années contradictoires (les deux « Dune » restent séparés) : on garde l'image.
  const out: Suggestion[] = []
  for (let i = 0; i < Math.max(0, ...lists.map((l) => l.length)); i++) {
    for (const list of lists) {
      const s = list[i]
      if (!s?.title) continue
      const twin = out.findIndex(
        (o) =>
          o.source !== s.source &&
          norm(o.title) === norm(s.title) &&
          (!yearOf(o) || !yearOf(s) || yearOf(o) === yearOf(s)),
      )
      if (twin < 0) out.push(s)
      else if (!out[twin].cover && s.cover) out[twin] = { ...out[twin], cover: s.cover }
    }
  }
  return { suggestions: out.slice(0, 10), status }
}
