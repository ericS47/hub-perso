import Dexie, { type Table } from 'dexie'
import { DEFAULT_THEMES } from './culture/defaultThemes'
import { CATALOG, EXTRA_RULES, type ScoreCategory, type ScoreRules } from './scores/catalog'

export interface Task {
  id?: number
  title: string
  done: boolean
  createdAt: number
}

export type CultureCategory =
  | 'films'
  | 'series'
  | 'jeux-societe'
  | 'jeux-video'
  | 'livres'
  | 'spectacles'
  | 'lego'
  | 'puzzles'

// Possession : « Je l'ai » (dans ma collection), « Envie » (à acquérir) ou ni l'un ni l'autre.
export type Ownership = 'owned' | 'wish' | 'none'

export interface CultureItem {
  id?: number
  title: string
  category: CultureCategory
  // Lien vers une image en ligne, ou photo importée stockée en data URL.
  cover?: string
  // Vu, lu ou joué selon le type d'œuvre.
  seen: boolean
  // Œuvre souvent conseillée : vignette mise en avant.
  priority: boolean
  recommendedBy?: string
  // Auteur, réalisateur… (rempli par l'import Babelio).
  creator?: string
  // Référence du produit (numéro de set pour les LEGO).
  reference?: string
  ownership: Ownership
  genres: string[]
  listIds: number[]
  createdAt: number
}

export interface CultureList {
  id?: number
  name: string
  createdAt: number
}

export interface Portfolio {
  id?: number
  name: string
  createdAt: number
}

export interface Position {
  id?: number
  portfolioId: number
  name: string
  quantity: number
  buyPrice: number
  currentPrice: number
  createdAt: number
}

// Étiquette de notes : parentId = 0 pour une étiquette racine, sinon l'id du parent
// (sous-catégorie). 0 plutôt que null, car null n'est pas une clé IndexedDB.
export interface NoteLabel {
  id?: number
  name: string
  parentId: number
  createdAt: number
}

// Thème (sous-catégorie) d'un type d'œuvre ; une œuvre en a autant qu'elle veut
// (champ genres de CultureItem, qui contient les noms des thèmes).
export interface CultureTheme {
  id?: number
  category: CultureCategory
  name: string
  createdAt: number
}

// Feuille de route : jeu dont on compte les points.
export interface ScoreGame extends ScoreRules {
  id?: number
  // Identifiant des jeux de la liste de départ (absent pour un jeu ajouté).
  slug?: string
  name: string
  category: ScoreCategory
  icon: string
  favorite: boolean
  createdAt: number
}

// Nom enregistré pour les prochaines parties.
export interface Player {
  id?: number
  name: string
  createdAt: number
}

// Une partie : rounds[manche][joueur] = points marqués.
// Les règles du jeu sont recopiées : modifier le jeu ne change pas les parties jouées.
export interface Match extends ScoreRules {
  id?: number
  gameId: number
  gameName: string
  gameIcon: string
  players: string[]
  rounds: number[][]
  status: 'playing' | 'finished'
  winners?: string[]
  createdAt: number
  updatedAt: number
}

// labelId = 0 : note sans étiquette.
export interface Note {
  id?: number
  labelId: number
  title: string
  body: string
  createdAt: number
  updatedAt: number
}

class HubDB extends Dexie {
  tasks!: Table<Task, number>
  items!: Table<CultureItem, number>
  lists!: Table<CultureList, number>
  portfolios!: Table<Portfolio, number>
  positions!: Table<Position, number>
  labels!: Table<NoteLabel, number>
  notes!: Table<Note, number>
  themes!: Table<CultureTheme, number>
  scoreGames!: Table<ScoreGame, number>
  players!: Table<Player, number>
  matches!: Table<Match, number>

  constructor() {
    super('hub')
    this.version(1).stores({
      tasks: '++id, done, createdAt',
    })
    // Les booléens ne sont pas des clés IndexedDB valides : seen et priority
    // sont filtrés côté application, seules category et listIds sont indexés.
    this.version(2).stores({
      tasks: '++id, done, createdAt',
      items: '++id, category, createdAt, *listIds',
      lists: '++id, createdAt',
    })
    this.version(3).stores({
      tasks: '++id, done, createdAt',
      items: '++id, category, createdAt, *listIds',
      lists: '++id, createdAt',
      portfolios: '++id, createdAt',
      positions: '++id, portfolioId',
    })
    this.version(4)
      .stores({
        tasks: '++id, done, createdAt',
        items: '++id, category, createdAt, *listIds, *genres',
        lists: '++id, createdAt',
        portfolios: '++id, createdAt',
        positions: '++id, portfolioId',
      })
      .upgrade((tx) =>
        tx.table('items').toCollection().modify((item: CultureItem) => {
          item.ownership ??= 'none'
          item.genres ??= []
        }),
      )
    // Version 5 : étiquettes et notes (la version 4 est déjà installée sur les appareils).
    this.version(5).stores({
      tasks: '++id, done, createdAt',
      items: '++id, category, createdAt, *listIds, *genres',
      lists: '++id, createdAt',
      portfolios: '++id, createdAt',
      positions: '++id, portfolioId',
      labels: '++id, parentId, createdAt',
      notes: '++id, labelId, updatedAt',
    })
    // Version 6 : thèmes par type d'œuvre, créés avec une liste de départ
    // complétée par les genres déjà utilisés.
    this.version(6)
      .stores({
        tasks: '++id, done, createdAt',
        items: '++id, category, createdAt, *listIds, *genres',
        lists: '++id, createdAt',
        portfolios: '++id, createdAt',
        positions: '++id, portfolioId',
        labels: '++id, parentId, createdAt',
        notes: '++id, labelId, updatedAt',
        themes: '++id, category, createdAt',
      })
      .upgrade(async (tx) => {
        const items = (await tx.table('items').toArray()) as CultureItem[]
        await tx.table('themes').bulkAdd(seedThemes(items))
      })
    // Version 7 : feuille de route (jeux à points, joueurs, parties).
    this.version(7)
      .stores({
        tasks: '++id, done, createdAt',
        items: '++id, category, createdAt, *listIds, *genres',
        lists: '++id, createdAt',
        portfolios: '++id, createdAt',
        positions: '++id, portfolioId',
        labels: '++id, parentId, createdAt',
        notes: '++id, labelId, updatedAt',
        themes: '++id, category, createdAt',
        scoreGames: '++id, slug, category, name',
        players: '++id, name',
        matches: '++id, gameId, status, updatedAt',
      })
      .upgrade((tx) => tx.table('scoreGames').bulkAdd(seedScoreGames()))
    // Version 8 : règles détaillées (points par manche, dépassement) des jeux de départ.
    this.version(8)
      .stores({
        tasks: '++id, done, createdAt',
        items: '++id, category, createdAt, *listIds, *genres',
        lists: '++id, createdAt',
        portfolios: '++id, createdAt',
        positions: '++id, portfolioId',
        labels: '++id, parentId, createdAt',
        notes: '++id, labelId, updatedAt',
        themes: '++id, category, createdAt',
        scoreGames: '++id, slug, category, name',
        players: '++id, name',
        matches: '++id, gameId, status, updatedAt',
      })
      .upgrade((tx) =>
        tx
          .table('scoreGames')
          .toCollection()
          .modify((g: ScoreGame) => {
            if (g.slug && EXTRA_RULES[g.slug]) Object.assign(g, EXTRA_RULES[g.slug])
          }),
      )
    // Version 9 : catégories LEGO et Puzzles, avec leurs thèmes de départ.
    this.version(9)
      .stores({
        tasks: '++id, done, createdAt',
        items: '++id, category, createdAt, *listIds, *genres',
        lists: '++id, createdAt',
        portfolios: '++id, createdAt',
        positions: '++id, portfolioId',
        labels: '++id, parentId, createdAt',
        notes: '++id, labelId, updatedAt',
        themes: '++id, category, createdAt',
        scoreGames: '++id, slug, category, name',
        players: '++id, name',
        matches: '++id, gameId, status, updatedAt',
      })
      .upgrade(async (tx) => {
        const now = Date.now()
        const add = (['lego', 'puzzles'] as const).flatMap((category) =>
          DEFAULT_THEMES[category].map((name, i) => ({ category, name, createdAt: now + i })),
        )
        await tx.table('themes').bulkAdd(add)
      })
    // Base toute neuve : les upgrades ne tournent pas, on crée les listes ici.
    this.on('populate', async (tx) => {
      await tx.table('themes').bulkAdd(seedThemes([]))
      await tx.table('scoreGames').bulkAdd(seedScoreGames())
    })
  }
}

function seedScoreGames(): ScoreGame[] {
  const now = Date.now()
  return CATALOG.map((g, i) => ({ ...g, favorite: false, createdAt: now + i }))
}

function seedThemes(items: CultureItem[]): CultureTheme[] {
  const out: CultureTheme[] = []
  const now = Date.now()
  for (const [category, names] of Object.entries(DEFAULT_THEMES) as [CultureCategory, string[]][]) {
    const used = items.filter((i) => i.category === category).flatMap((i) => i.genres ?? [])
    const all = [...names, ...used]
    all
      .filter((n, i) => all.findIndex((m) => m.toLowerCase() === n.toLowerCase()) === i)
      .forEach((name, i) => out.push({ category, name, createdAt: now + i }))
  }
  return out
}

// Base locale uniquement : aucune donnée ne quitte l'appareil.
export const db = new HubDB()
