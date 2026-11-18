import { jsonp } from './suggest'

// Recherche IMDb (celle de la barre de recherche du site) : sans clé, accepte
// le début d'un titre et les titres français, et fournit l'affiche officielle.
// Elle répond par un script qui appelle imdb$<recherche>(…), d'où le JSONP.

export interface ImdbResult {
  title: string
  year?: number
  stars?: string
  poster?: string
}

interface ImdbRaw {
  l?: string
  y?: number
  s?: string
  qid?: string
  i?: [string, number, number]
}

const KINDS = {
  film: new Set(['movie', 'tvMovie']),
  series: new Set(['tvSeries', 'tvMiniSeries']),
}

// « Le Parrain » → « leparrain » : nom du fichier et de la fonction de rappel.
// Mots collés : au-delà de deux mots séparés, IMDb renvoie un nom de fonction
// invalide (« imdb$game_of%20thrones »), alors que « gameofthrones » marche.
function key(q: string) {
  return q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 60)
}

// Image Amazon réduite à 500 px de large (l'originale pèse plusieurs Mo).
const resize = (url: string) => url.replace(/\._V1_.*\.jpg$/, '._V1_SX500.jpg')

export async function imdbSearch(q: string, kind: 'film' | 'series', signal: AbortSignal): Promise<ImdbResult[]> {
  const k = key(q)
  if (!k) return []
  const data = (await jsonp(`https://sg.media-imdb.com/suggests/${k[0]}/${k}.json`, signal, `imdb$${k}`)) as {
    d?: ImdbRaw[]
  }
  return (data.d ?? [])
    .filter((r) => r.l && KINDS[kind].has(r.qid ?? ''))
    .map((r) => ({ title: r.l!, year: r.y, stars: r.s, poster: r.i?.[0] ? resize(r.i[0]) : undefined }))
}
