import type { Constraint } from '../../db'
import { toMinutes } from '../../lib/dates'
import type { FoyerData, Schedule, TimeSlot, TravailData } from './types'

type NewConstraint = Omit<Constraint, 'id'>
type Source = Constraint['source']

// Sources de contraintes gérées par chaque rubrique : elles sont remplacées en bloc à chaque modification.
export const CONSTRAINT_SOURCES: Partial<Record<'travail' | 'foyer', Source[]>> = {
  travail: ['travail'],
  foyer: ['enfants', 'parents'],
}

export function isValidTime(t: string | undefined): t is string {
  return !!t && /^\d{2}:\d{2}$/.test(t)
}

// Une plage dont la fin précède le début (travail de nuit) est coupée en deux à minuit.
function expandSlot(s: TimeSlot): { day: number; start: string; end: string }[] {
  if (!isValidTime(s.start) || !isValidTime(s.end) || s.start === s.end) return []
  if (toMinutes(s.end) > toMinutes(s.start)) return [{ day: s.day, start: s.start, end: s.end }]
  const out = [{ day: s.day, start: s.start, end: '23:59' }]
  if (s.end !== '00:00') out.push({ day: (s.day + 1) % 7, start: '00:00', end: s.end })
  return out
}

export function scheduleToConstraints(
  schedule: Schedule | undefined,
  source: Source,
  label: string,
  altLabels: [string, string] = ['petite semaine', 'grande semaine'],
): NewConstraint[] {
  if (!schedule?.format || schedule.format === 'aleatoire') return []
  const build = (slots: TimeSlot[] | undefined, weekType: Constraint['weekType'], lbl: string) =>
    (slots ?? []).flatMap(expandSlot).map((s) => ({ ...s, source, label: lbl, weekType }))
  if (schedule.format === 'standard') return build(schedule.slots, 'toutes', label)
  const first = schedule.firstWeekType ?? 'A'
  const second = first === 'A' ? 'B' : 'A'
  return [
    ...build(schedule.slots, first, `${label} (${altLabels[0]})`),
    ...build(schedule.slotsAlt, second, `${label} (${altLabels[1]})`),
  ]
}

export function travailConstraints(d: TravailData): NewConstraint[] {
  if (d.works !== true) return []
  return scheduleToConstraints(d.schedule, 'travail', 'Travail')
}

export function foyerConstraints(d: FoyerData): NewConstraint[] {
  const out: NewConstraint[] = []
  if (d.children === true && d.custody && d.custody !== 'non') {
    out.push(...scheduleToConstraints(d.childSchedule, 'enfants', 'Enfants', ['1re semaine', '2e semaine']))
  }
  if (d.parents === true) {
    out.push(...scheduleToConstraints(d.parentsSchedule, 'parents', 'Parents', ['1re semaine', '2e semaine']))
  }
  return out
}
