import Dexie, { type Table } from 'dexie'

export interface Task {
  id?: number
  title: string
  done: boolean
  createdAt: number
}

export type CultureCategory = 'films' | 'series' | 'jeux-societe' | 'jeux-video' | 'livres' | 'spectacles'

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

class HubDB extends Dexie {
  tasks!: Table<Task, number>
  items!: Table<CultureItem, number>
  lists!: Table<CultureList, number>
  portfolios!: Table<Portfolio, number>
  positions!: Table<Position, number>

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
  }
}

// Base locale uniquement : aucune donnée ne quitte l'appareil.
export const db = new HubDB()
