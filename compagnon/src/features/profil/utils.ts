import { isoDate, parseIso } from '../../lib/dates'
import type { ZoneId } from './types'

export function toggleIn<T>(list: T[] | undefined, v: T): T[] {
  const arr = list ?? []
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
}

export function ageFrom(birth: string | undefined, today = isoDate()): number | undefined {
  if (!birth || !/^\d{4}-\d{2}-\d{2}$/.test(birth)) return undefined
  const b = parseIso(birth)
  const t = parseIso(today)
  let age = t.getFullYear() - b.getFullYear()
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age -= 1
  return age >= 0 && age < 130 ? age : undefined
}

export const ZONES: { id: ZoneId; label: string }[] = [
  { id: 'tete', label: 'Tête' },
  { id: 'nuque', label: 'Nuque / cou' },
  { id: 'epaules', label: 'Épaules' },
  { id: 'poitrine', label: 'Poitrine' },
  { id: 'haut-dos', label: 'Haut du dos' },
  { id: 'bas-dos', label: 'Bas du dos' },
  { id: 'ventre', label: 'Ventre' },
  { id: 'coudes', label: 'Coudes / bras' },
  { id: 'mains', label: 'Poignets / mains' },
  { id: 'hanches', label: 'Hanches' },
  { id: 'genoux', label: 'Genoux / jambes' },
  { id: 'pieds', label: 'Chevilles / pieds' },
  { id: 'autre', label: 'Ailleurs' },
]

export const ZONE_LABEL = Object.fromEntries(ZONES.map((z) => [z.id, z.label])) as Record<ZoneId, string>
