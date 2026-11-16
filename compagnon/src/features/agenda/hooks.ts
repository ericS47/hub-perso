import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Session } from '../../db'
import { addDays } from '../../lib/dates'
import { DEFAULT_SETTINGS, useSetting } from '../../lib/settings'

// Façon dont le compagnon s'adresse au patient (tutoiement par défaut).
export function useCompanion() {
  const c = useSetting('companion') ?? DEFAULT_SETTINGS.companion
  const tu = c.tutoiement
  return { name: c.name, tu, t: (a: string, b: string) => (tu ? a : b) }
}

export function useReminders() {
  return useSetting('reminders') ?? DEFAULT_SETTINGS.reminders
}

export function useConstraints() {
  return useLiveQuery(() => db.constraints.toArray(), [])
}

export function sortSessions(list: Session[]): Session[] {
  return [...list].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
}

// Séances entre deux dates incluses, triées.
export function useSessionsBetween(from: string, to: string) {
  return useLiveQuery(async () => sortSessions(await db.sessions.where('date').between(from, to, true, true).toArray()), [from, to])
}

export function useWeekSessions(monday: string) {
  return useSessionsBetween(monday, addDays(monday, 6))
}
