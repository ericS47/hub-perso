import Dexie, { type Table } from 'dexie'

export interface Task {
  id?: number
  title: string
  done: boolean
  createdAt: number
}

export type CultureCategory = 'films' | 'series' | 'jeux-societe' | 'jeux-video' | 'livres' | 'spectacles'

export interface CultureItem {
  id?: number
  title: string
  category: CultureCategory
  cover?: string
  seen: boolean
  priority: boolean
  listIds: number[]
  createdAt: number
}

export interface CultureList {
  id?: number
  name: string
  createdAt: number
}

class HubDB extends Dexie {
  tasks!: Table<Task, number>
  items!: Table<CultureItem, number>
  lists!: Table<CultureList, number>

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
  }
}

// Base locale uniquement : aucune donnée ne quitte l'appareil.
export const db = new HubDB()
