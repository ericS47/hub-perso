import { db, type CultureCategory, type CultureItem } from '../db'
import { ensureThemes } from './themes'

// Import de la sauvegarde de l'appli « Watch List: TV Series & Movies »
// (Réglages → Sauvegarde → Exporter ma watch list), un fichier JSON dont les
// films et séries viennent de TMDB (affiches et genres compris).

interface TmdbGenre {
  name: string
}

interface WatchListBackup {
  format?: string
  data?: {
    movies?: {
      movie?: { title?: string; poster_path?: string | null; genres?: TmdbGenre[]; release_date?: string }
      watchListStatus?: string
      createdDate?: string
    }[]
    tvShows?: {
      tvShowName?: string
      season?: { poster_path?: string | null }
      genres?: TmdbGenre[]
      watchListStatus?: string
      createdDate?: string
    }[]
  }
}

// Genres TMDB → thèmes Maestro (ceux qui manquent sont créés à l'import).
const FILM_THEMES: Record<string, string> = {
  crime: 'Policier & thriller',
  thriller: 'Policier & thriller',
  mystere: 'Policier & thriller',
  'science-fiction': 'Science-fiction',
  fantastique: 'Fantastique',
  histoire: 'Historique',
  guerre: 'Historique',
  familial: 'Famille',
  musique: 'Musique',
  romance: 'Romance',
  western: 'Western',
}

const SERIES_THEMES: Record<string, string> = {
  crime: 'Policier & thriller',
  mystere: 'Policier & thriller',
  'science-fiction & fantastique': 'Science-fiction & fantasy',
  'action & adventure': 'Action & aventure',
  'war & politics': 'Historique',
  'guerre & politique': 'Historique',
  reality: 'Téléréalité',
  kids: 'Jeunesse',
  familial: 'Famille',
}

// Genres sans intérêt comme thème.
const IGNORED = new Set(['telefilm', 'tv movie', 'news', 'talk', 'soap'])

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

function themesOf(genres: TmdbGenre[] | undefined, map: Record<string, string>) {
  const out: string[] = []
  for (const g of genres ?? []) {
    const key = norm(g.name ?? '')
    if (!key || IGNORED.has(key)) continue
    const theme = map[key] ?? g.name.charAt(0).toUpperCase() + g.name.slice(1)
    if (!out.includes(theme)) out.push(theme)
  }
  return out
}

const poster = (path?: string | null) => (path ? `https://image.tmdb.org/t/p/w500${path}` : undefined)
const watched = (status?: string) => /^(watched|seen|completed|done)$/i.test(status ?? '')

interface Entry {
  category: CultureCategory
  title: string
  cover?: string
  themes: string[]
  seen: boolean
  createdAt: number
}

export interface WatchListResult {
  films: number
  series: number
  updated: number
  skipped: number
}

export async function importWatchList(file: File): Promise<WatchListResult> {
  let backup: WatchListBackup
  try {
    backup = JSON.parse(await file.text())
  } catch {
    throw new Error('Fichier illisible : choisis le fichier .json exporté par Watch List.')
  }
  const data = backup.data
  if (!data || (!data.movies && !data.tvShows)) {
    throw new Error('Ce fichier ne ressemble pas à une sauvegarde Watch List.')
  }

  const now = Date.now()
  const date = (d?: string, i = 0) => (d && !Number.isNaN(Date.parse(d)) ? Date.parse(d) : now - i)
  const entries: Entry[] = [
    ...(data.movies ?? []).map((m, i) => ({
      category: 'films' as const,
      title: m.movie?.title?.trim() ?? '',
      cover: poster(m.movie?.poster_path),
      themes: themesOf(m.movie?.genres, FILM_THEMES),
      seen: watched(m.watchListStatus),
      createdAt: date(m.createdDate, i),
    })),
    ...(data.tvShows ?? []).map((s, i) => ({
      category: 'series' as const,
      title: s.tvShowName?.trim() ?? '',
      cover: poster(s.season?.poster_path),
      themes: themesOf(s.genres, SERIES_THEMES),
      seen: watched(s.watchListStatus),
      createdAt: date(s.createdDate, i),
    })),
  ].filter((e) => e.title)

  const result: WatchListResult = { films: 0, series: 0, updated: 0, skipped: 0 }
  const toAdd: CultureItem[] = []
  const toUpdate: CultureItem[] = []

  for (const category of ['films', 'series'] as const) {
    const mine = entries.filter((e) => e.category === category)
    await ensureThemes(category, [...new Set(mine.flatMap((e) => e.themes))])
    const existing = new Map<string, CultureItem>()
    for (const i of await db.items.where('category').equals(category).toArray()) existing.set(norm(i.title), i)
    const seenInFile = new Set<string>()
    for (const e of mine) {
      const key = norm(e.title)
      if (seenInFile.has(key)) {
        result.skipped++
        continue
      }
      seenInFile.add(key)
      // Déjà dans Maestro : on complète thèmes et affiche, sans toucher au reste.
      const known = existing.get(key)
      if (known) {
        const genres = [...new Set([...known.genres, ...e.themes])]
        if (genres.length > known.genres.length || (!known.cover && e.cover)) {
          toUpdate.push({ ...known, genres, cover: known.cover ?? e.cover })
        } else result.skipped++
        continue
      }
      toAdd.push({
        title: e.title,
        category,
        cover: e.cover,
        seen: e.seen,
        priority: false,
        ownership: 'none',
        genres: e.themes,
        listIds: [],
        createdAt: e.createdAt,
      })
      result[category === 'films' ? 'films' : 'series']++
    }
  }

  await db.items.bulkAdd(toAdd)
  await db.items.bulkPut(toUpdate)
  result.updated = toUpdate.length
  return result
}
