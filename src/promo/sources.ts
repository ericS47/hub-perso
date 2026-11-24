// Bons plans (flux Dealabs) et catalogues des magasins autour de
// Saint-Sulpice-la-Pointe (81370).

export interface Deal {
  title: string
  // Température Dealabs : plus elle est haute, plus le bon plan plaît.
  temperature?: number
  price?: string
  shop?: string
  link: string
  image?: string
  date: number
}

export const DEAL_FEEDS = [
  { id: 'tendance', label: '🔥 Tendances', url: 'https://www.dealabs.com/rss/tendance' },
  { id: 'lego', label: '🧱 LEGO', url: 'https://www.dealabs.com/rss/groupe/lego' },
  { id: 'jeux', label: '🎲 Jeux de société', url: 'https://www.dealabs.com/rss/groupe/jeux-de-societe' },
  { id: 'high-tech', label: '📱 High-tech', url: 'https://www.dealabs.com/rss/groupe/high-tech' },
] as const

export type FeedId = (typeof DEAL_FEEDS)[number]['id']

const decode = (s: string) => {
  const el = document.createElement('textarea')
  el.innerHTML = s
  return el.value
}

// Derniers bons plans gardés sur l'appareil : affichés si le service ne répond
// pas, et réutilisés pendant 30 minutes pour ménager le service gratuit.
const CACHE_MINUTES = 30
const cacheKey = (feed: FeedId) => `deals-${feed}`

export function cachedDeals(feed: FeedId): { deals: Deal[]; at: number } | undefined {
  try {
    const raw = localStorage.getItem(cacheKey(feed))
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

export class TooManyRequests extends Error {}

// Dealabs ne s'ouvre pas aux pages web : rss2json (lecteur RSS gratuit,
// ouvert aux appels depuis l'appli) lit le flux pour nous.
export async function fetchDeals(feed: FeedId, signal?: AbortSignal): Promise<Deal[]> {
  const cached = cachedDeals(feed)
  if (cached && Date.now() - cached.at < CACHE_MINUTES * 60_000) return cached.deals
  const url = DEAL_FEEDS.find((f) => f.id === feed)!.url
  const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`, { signal })
  if (res.status === 429) throw new TooManyRequests()
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  if (data.status !== 'ok') throw new Error(data.message ?? 'Flux indisponible')
  const deals = parse(data)
  try {
    localStorage.setItem(cacheKey(feed), JSON.stringify({ deals, at: Date.now() }))
  } catch {
    // Stockage indisponible : pas de mémoire, la liste s'affiche quand même.
  }
  return deals
}

interface RssItem {
  title: string
  link: string
  thumbnail?: string
  description?: string
  pubDate?: string
}

function parse(data: { items?: RssItem[] }): Deal[] {
  return (data.items ?? []).map(
    (i) => {
      // « 112° - Titre » : la température en tête du titre.
      const m = decode(i.title).match(/^(-?\d+)°\s*-\s*(.*)$/)
      // Description : « <strong>121,34€ - E.Leclerc</strong> ».
      const head = decode(i.description?.match(/<strong>(.*?)<\/strong>/)?.[1] ?? '')
      const [price, ...shop] = head.split(' - ')
      return {
        title: m ? m[2] : decode(i.title),
        temperature: m ? Number(m[1]) : undefined,
        price: /\d/.test(price ?? '') ? price.trim() : undefined,
        shop: shop.join(' - ').trim() || undefined,
        link: i.link,
        image: i.thumbnail?.replace('/re/150x150/', '/re/300x300/') || undefined,
        date: i.pubDate ? Date.parse(i.pubDate.replace(' ', 'T')) : Date.now(),
      }
    },
  )
}

// Pages vérifiées : catalogues de Saint-Sulpice (Tarn) et de ses enseignes.
export const CATALOGS = [
  { name: 'Tous les catalogues (Bonial)', url: 'https://www.bonial.fr/Saint-Sulpice/Catalogues-en-cours' },
  { name: 'Tous les catalogues (Tiendeo)', url: 'https://www.tiendeo.fr/saint-sulpice' },
]

export const STORES = [
  { name: 'Carrefour Market', url: 'https://www.bonial.fr/Saint-Sulpice/Carrefour-Market/p-r5' },
  { name: 'Action', url: 'https://www.bonial.fr/Saint-Sulpice/Action/p-r1080' },
  { name: 'JouéClub', url: 'https://www.bonial.fr/Saint-Sulpice/JoueClub/p-r190' },
  { name: 'Weldom', url: 'https://www.bonial.fr/Saint-Sulpice/Weldom/p-r27' },
  { name: 'AD (auto)', url: 'https://www.bonial.fr/Saint-Sulpice/AD/p-r1516' },
]
