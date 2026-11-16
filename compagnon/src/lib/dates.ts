// Dates locales au format 'YYYY-MM-DD' (jamais toISOString, qui décale en UTC).
export function isoDate(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, n: number): string {
  const d = parseIso(iso)
  d.setDate(d.getDate() + n)
  return isoDate(d)
}

// Jour de la semaine avec lundi = 0 … dimanche = 6.
export function weekday(iso: string): number {
  return (parseIso(iso).getDay() + 6) % 7
}

// Lundi de la semaine contenant la date.
export function startOfWeek(iso: string = isoDate()): string {
  return addDays(iso, -weekday(iso))
}

// Les 7 dates de la semaine commençant au lundi donné.
export function weekDates(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

// Numéro de semaine ISO, utile pour l'alternance petite / grande semaine (pair = A, impair = B).
export function isoWeekNumber(iso: string): number {
  const d = parseIso(iso)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const firstThursday = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7)
}

export const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
export const DAY_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function formatDay(iso: string): string {
  return parseIso(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function fromMinutes(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`
}
