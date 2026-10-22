import Dexie, { type Table } from 'dexie'

export interface Task {
  id?: number
  title: string
  done: boolean
  createdAt: number
}

class HubDB extends Dexie {
  tasks!: Table<Task, number>

  constructor() {
    super('hub')
    this.version(1).stores({
      tasks: '++id, done, createdAt',
    })
  }
}

// Base locale uniquement : aucune donnée ne quitte l'appareil.
export const db = new HubDB()
