// Suivi des exercices d'une partie (pur, utilisé avec useReducer).
import { dureeEstimee, type Exercice } from './exercices'

export interface Suivi {
  debut: number
  faits: number
  passes: number
  // Secondes d'activité estimées (exercices faits).
  secondes: number
  // Derniers exercices proposés, pour éviter les répétitions.
  recents: string[]
}

export type SuiviAction = { type: 'fait' | 'passe'; exercice: Exercice } | { type: 'reset'; now: number }

export function suiviInitial(now: number): Suivi {
  return { debut: now, faits: 0, passes: 0, secondes: 0, recents: [] }
}

export function suiviReducer(s: Suivi, a: SuiviAction): Suivi {
  if (a.type === 'reset') return suiviInitial(a.now)
  const recents = [a.exercice.id, ...s.recents].slice(0, 6)
  if (a.type === 'passe') return { ...s, passes: s.passes + 1, recents }
  return { ...s, faits: s.faits + 1, secondes: s.secondes + dureeEstimee(a.exercice), recents }
}

export function formatMinutes(sec: number): string {
  if (sec < 60) return sec === 0 ? '0 minute' : 'moins d’une minute'
  const min = Math.round(sec / 60)
  return `${min} minute${min > 1 ? 's' : ''}`
}
