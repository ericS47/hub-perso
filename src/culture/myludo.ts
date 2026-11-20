import { db, type CultureItem } from '../db'
import { ensureThemes } from './themes'

// Import de l'export Myludo (profil → Exporter mes données → JSON), source
// Collection ou Wishlist : un tableau de jeux aux champs en français.

interface MyludoGame {
  Titre?: string
  'Catégorie(s)'?: string[]
  'Mécanisme(s)'?: string[]
  'Thème(s)'?: string[]
  'Auteur(s)'?: string[]
  'Joueur(s)'?: string | number
  'Age(s)'?: string
  Date?: string
  // Présent seulement dans l'export Wishlist (niveau d'envie).
  Envie?: number
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const has = (list: string[] | undefined, ...words: string[]) =>
  (list ?? []).some((x) => words.some((w) => norm(x).includes(w)))

// Catégories et mécanismes Myludo → thèmes Maestro (les manquants sont créés).
function themesOf(g: MyludoGame) {
  const cats = g['Catégorie(s)']
  const mechs = g['Mécanisme(s)']
  const out: string[] = []
  const add = (t: string, ok: boolean) => ok && !out.includes(t) && out.push(t)
  const players = String(g['Joueur(s)'] ?? '')
  const maxPlayers = Math.max(0, ...(players.match(/\d+/g) ?? []).map(Number))
  const age = Number(String(g['Age(s)'] ?? '').match(/\d+/)?.[0] ?? 99)

  add('Stratégie', has(mechs, 'strategie', "placement d'ouvriers", 'controle de zone', 'gestion de ressources', 'conquete') || has(cats, 'wargame'))
  add('Ambiance & party', has(cats, "jeu d'ambiance"))
  add('Coopératif', has(mechs, 'cooperati'))
  add('Famille', age <= 8)
  add('Cartes', has(cats, 'jeu de cartes'))
  add('Enquête', has(g['Thème(s)'], 'enquete') || has(mechs, 'deduction'))
  add('Deux joueurs', /duo/i.test(players) || maxPlayers === 2)
  add('Solo', has(cats, 'jeu en solo'))
  add('Tuiles', has(cats, 'jeu de tuiles'))
  add('Dés', has(cats, 'jeu de des'))
  add('Roll & write', has(cats, 'griffonner') || has(mechs, 'roll & write'))
  return out
}

export interface MyludoResult {
  added: number
  updated: number
  skipped: number
  wishlist: boolean
}

export async function importMyludo(file: File): Promise<MyludoResult> {
  let games: MyludoGame[]
  try {
    games = JSON.parse(await file.text())
  } catch {
    throw new Error('Fichier illisible : choisis le fichier .json exporté par Myludo.')
  }
  if (!Array.isArray(games) || !games.some((g) => g && typeof g.Titre === 'string')) {
    throw new Error('Ce fichier ne ressemble pas à un export Myludo (format JSON).')
  }

  // Export Wishlist → « Envie », export Collection → « Je l'ai ».
  const wishlist = games.some((g) => g && 'Envie' in g)
  const entries = games
    .filter((g) => g?.Titre?.trim())
    .map((g, i) => ({
      title: g.Titre!.trim(),
      creator: g['Auteur(s)']?.length ? g['Auteur(s)'].join(', ') : undefined,
      themes: themesOf(g),
      createdAt: g.Date && !Number.isNaN(Date.parse(g.Date.replace(' ', 'T'))) ? Date.parse(g.Date.replace(' ', 'T')) : Date.now() - i,
    }))

  await ensureThemes('jeux-societe', [...new Set(entries.flatMap((e) => e.themes))])
  const existing = new Map<string, CultureItem>()
  for (const i of await db.items.where('category').equals('jeux-societe').toArray()) existing.set(norm(i.title), i)

  const result: MyludoResult = { added: 0, updated: 0, skipped: 0, wishlist }
  const toAdd: CultureItem[] = []
  const toUpdate: CultureItem[] = []
  const seenInFile = new Set<string>()
  for (const e of entries) {
    const key = norm(e.title)
    if (seenInFile.has(key)) {
      result.skipped++
      continue
    }
    seenInFile.add(key)
    // Déjà dans Maestro : thèmes et auteur complétés, statut laissé tel quel.
    const known = existing.get(key)
    if (known) {
      const genres = [...new Set([...known.genres, ...e.themes])]
      if (genres.length > known.genres.length || (!known.creator && e.creator)) {
        toUpdate.push({ ...known, genres, creator: known.creator ?? e.creator })
      } else result.skipped++
      continue
    }
    toAdd.push({
      title: e.title,
      category: 'jeux-societe',
      creator: e.creator,
      seen: false,
      priority: false,
      ownership: wishlist ? 'wish' : 'owned',
      genres: e.themes,
      listIds: [],
      createdAt: e.createdAt,
    })
  }

  await db.items.bulkAdd(toAdd)
  await db.items.bulkPut(toUpdate)
  result.added = toAdd.length
  result.updated = toUpdate.length
  return result
}
