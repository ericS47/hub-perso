import { useEffect, useState } from 'react'
import type { Constraint, Session } from '../../db'
import { addDays, isoDate, isoWeekNumber, parseIso, startOfWeek, toMinutes, fromMinutes, weekday } from '../../lib/dates'

// ───────────── Activités ─────────────
export const ACTIVITIES: { label: string; emoji: string }[] = [
  { label: 'Marche', emoji: '🚶' },
  { label: 'Vélo', emoji: '🚴' },
  { label: 'Natation', emoji: '🏊' },
  { label: 'Renforcement', emoji: '💪' },
  { label: 'Pilates', emoji: '🧘' },
  { label: 'Stretching', emoji: '🤸' },
  { label: 'Cardio', emoji: '❤️' },
  { label: 'Danse', emoji: '💃' },
  { label: 'Jardinage', emoji: '🌱' },
  { label: 'Aquagym', emoji: '💧' },
]

export const DURATIONS = [15, 20, 30, 45, 60, 90]

function norm(s: string): string {
  return s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function activityEmoji(activity: string): string {
  const a = ACTIVITIES.find((x) => norm(x.label) === norm(activity))
  return a?.emoji ?? '🏃'
}

// « de marche », « de vélo », « d'aquagym »…
export function deActivity(activity: string): string {
  const a = activity.trim().toLowerCase()
  return /^[aeiouyhéèêàâîïôû]/.test(a) ? `d'${a}` : `de ${a}`
}

// ───────────── Temps ─────────────
// Instant de début / fin d'une séance (gère le passage de minuit).
export function sessionStart(s: Pick<Session, 'date' | 'start'>): Date {
  const d = parseIso(s.date)
  d.setMinutes(toMinutes(s.start))
  return d
}

export function sessionEnd(s: Pick<Session, 'date' | 'start' | 'durationMin'>): Date {
  const d = sessionStart(s)
  d.setMinutes(d.getMinutes() + s.durationMin)
  return d
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':')
  return `${Number(h)} h ${m === '00' ? '' : m}`.trim()
}

export function endTime(s: Pick<Session, 'start' | 'durationMin'>): { time: string; nextDay: boolean } {
  const end = toMinutes(s.start) + s.durationMin
  return { time: fromMinutes(end % 1440), nextDay: end >= 1440 }
}

export function timeRange(s: Pick<Session, 'start' | 'durationMin'>): string {
  const e = endTime(s)
  return `${formatTime(s.start)} – ${formatTime(e.time)}${e.nextDay ? ' (le lendemain)' : ''}`
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
}

// « lundi 16 novembre »
export function longDay(iso: string): string {
  return parseIso(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function shortDate(iso: string): string {
  return parseIso(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// « du 16 au 22 novembre », « du 30 novembre au 6 décembre »
export function weekLabel(monday: string): string {
  const a = parseIso(monday)
  const b = parseIso(addDays(monday, 6))
  const sameMonth = a.getMonth() === b.getMonth()
  const fa = a.toLocaleDateString('fr-FR', sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'long' })
  const fb = b.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  const year = a.getFullYear() !== new Date().getFullYear() || b.getFullYear() !== a.getFullYear() ? ` ${b.getFullYear()}` : ''
  return `du ${fa} au ${fb}${year}`
}

// « aujourd'hui », « demain », « hier » ou le jour en toutes lettres.
export function relativeDay(iso: string, today: string = isoDate()): string {
  if (iso === today) return "aujourd'hui"
  if (iso === addDays(today, 1)) return 'demain'
  if (iso === addDays(today, -1)) return 'hier'
  return longDay(iso)
}

// Valide un paramètre ?semaine= et le ramène au lundi.
export function parseWeekParam(v: string | null): string | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  const d = parseIso(v)
  if (Number.isNaN(d.getTime())) return null
  return startOfWeek(isoDate(d))
}

// Heure courante, rafraîchie régulièrement (pour basculer « à compléter », minuit…).
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = window.setInterval(tick, intervalMs)
    const onVis = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [intervalMs])
  return now
}

// ───────────── État d'une séance ─────────────
export type Display = 'prevue' | 'aujourdhui' | 'a-completer' | 'faite' | 'manquee'

export function displayState(s: Session, now: Date): Display {
  if (s.status === 'faite') return 'faite'
  if (s.status === 'manquee') return 'manquee'
  if (sessionEnd(s) <= now) return 'a-completer'
  if (s.date === isoDate(now) || sessionStart(s) <= now) return 'aujourdhui'
  return 'prevue'
}

export const DISPLAY_LABEL: Record<Display, { icon: string; text: string }> = {
  prevue: { icon: '🗓️', text: 'Prévue' },
  aujourdhui: { icon: '⏰', text: "Aujourd'hui" },
  'a-completer': { icon: '✏️', text: 'À compléter' },
  faite: { icon: '✅', text: 'Faite' },
  manquee: { icon: '🌧️', text: 'Pas faite cette fois' },
}

// ───────────── Semaine A / B ─────────────
export function weekKind(iso: string): 'A' | 'B' {
  return isoWeekNumber(iso) % 2 === 0 ? 'A' : 'B'
}

function appliesTo(c: Constraint, iso: string): boolean {
  return c.weekType === 'toutes' || c.weekType === weekKind(iso)
}

// ───────────── Créneaux occupés ─────────────
export interface Busy {
  from: number // minutes depuis minuit
  to: number
  label: string
  kind: 'contrainte' | 'seance'
}

// Plages d'une contrainte qui tombent sur la date donnée (gère les contraintes de nuit, ex. 22:00 → 06:00).
export function constraintsOn(iso: string, constraints: Constraint[]): (Busy & { c: Constraint })[] {
  const out: (Busy & { c: Constraint })[] = []
  const day = weekday(iso)
  const prev = addDays(iso, -1)
  const prevDay = weekday(prev)
  for (const c of constraints) {
    const s = toMinutes(c.start)
    const e = toMinutes(c.end)
    const wraps = e <= s
    if (c.day === day && appliesTo(c, iso)) out.push({ from: s, to: wraps ? 1440 : e, label: c.label, kind: 'contrainte', c })
    if (wraps && e > 0 && c.day === prevDay && appliesTo(c, prev)) out.push({ from: 0, to: e, label: c.label, kind: 'contrainte', c })
  }
  return out.sort((a, b) => a.from - b.from)
}

// Plages occupées par des séances (y compris le débordement d'une séance de la veille après minuit).
export function sessionsBusyOn(iso: string, sessions: Pick<Session, 'date' | 'start' | 'durationMin' | 'activity'>[]): Busy[] {
  const out: Busy[] = []
  const prev = addDays(iso, -1)
  for (const s of sessions) {
    const st = toMinutes(s.start)
    const en = st + s.durationMin
    if (s.date === iso) out.push({ from: st, to: Math.min(en, 1440), label: s.activity, kind: 'seance' })
    if (s.date === prev && en > 1440) out.push({ from: 0, to: en - 1440, label: s.activity, kind: 'seance' })
  }
  return out
}

export const DAY_FROM = 6 * 60
export const DAY_TO = 22 * 60

// Plages libres de la journée (6 h – 22 h), éventuellement à partir d'une heure minimale.
export function freeRanges(busy: Busy[], minFrom = DAY_FROM): [number, number][] {
  const sorted = [...busy].sort((a, b) => a.from - b.from)
  const ranges: [number, number][] = []
  let cursor = Math.max(DAY_FROM, minFrom)
  for (const b of sorted) {
    if (b.to <= cursor) continue
    if (b.from > cursor) ranges.push([cursor, Math.min(b.from, DAY_TO)])
    cursor = Math.max(cursor, b.to)
    if (cursor >= DAY_TO) break
  }
  if (cursor < DAY_TO) ranges.push([cursor, DAY_TO])
  return ranges.filter(([a, b]) => b > a)
}

// Heures de début proposées : début de chaque plage libre, puis toutes les heures, sans dépasser max.
export function proposeStarts(busy: Busy[], durationMin: number, minFrom = DAY_FROM, max = 8): string[] {
  const starts: number[] = []
  for (const [a, b] of freeRanges(busy, minFrom)) {
    let t = Math.ceil(a / 15) * 15
    while (t + durationMin <= b) {
      starts.push(t)
      // Après le premier départ, on avance à l'heure pleine suivante.
      t = Math.floor(t / 60) * 60 + 60
    }
  }
  if (starts.length <= max) return starts.map(fromMinutes)
  // Trop de choix : on en garde un échantillon réparti sur la journée.
  const step = starts.length / max
  return Array.from({ length: max }, (_, i) => fromMinutes(starts[Math.floor(i * step)]))
}

// Contraintes chevauchées par une séance (sur sa date et, après minuit, sur le lendemain).
export function overlaps(s: Pick<Session, 'date' | 'start' | 'durationMin'>, constraints: Constraint[]): Busy[] {
  const st = toMinutes(s.start)
  const en = st + s.durationMin
  const hits = constraintsOn(s.date, constraints).filter((b) => b.from < Math.min(en, 1440) && b.to > st)
  if (en > 1440) {
    hits.push(...constraintsOn(addDays(s.date, 1), constraints).filter((b) => b.from < en - 1440))
  }
  return hits
}

export function busyRangeLabel(b: Busy): string {
  return `${formatTime(fromMinutes(b.from))} – ${b.to >= 1440 ? 'minuit' : formatTime(fromMinutes(b.to))}`
}

// Minutes minimales pour proposer un créneau aujourd'hui (pas dans le passé, petite marge).
export function minStartFor(iso: string, now: Date): number {
  if (iso !== isoDate(now)) return DAY_FROM
  return now.getHours() * 60 + now.getMinutes() + 15
}

// ───────────── Fichier .ics ─────────────
function icsDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`
}

function icsUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function icsText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')
}

function vevent(s: Session, beforeMin: number): string[] {
  // Heure « flottante » (sans fuseau) : l'agenda du téléphone la lit en heure locale.
  return [
    'BEGIN:VEVENT',
    `UID:seance-${s.id ?? s.createdAt}-${s.date}@mon-compagnon`,
    `DTSTAMP:${icsUtc(new Date())}`,
    `DTSTART:${icsDate(sessionStart(s))}`,
    `DTEND:${icsDate(sessionEnd(s))}`,
    `SUMMARY:${icsText(`${activityEmoji(s.activity)} Séance ${deActivity(s.activity)}`)}`,
    `DESCRIPTION:${icsText('Ma séance d’activité physique, prévue avec Mon Compagnon. Après la séance, pense à noter ton ressenti dans l’appli.')}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(`Séance ${deActivity(s.activity)} bientôt`)}`,
    `TRIGGER:-PT${Math.max(0, beforeMin)}M`,
    'END:VALARM',
    'END:VEVENT',
  ]
}

export function downloadIcs(sessions: Session[], beforeMin: number, filename: string): void {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mon Compagnon//Agenda AP//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...sessions.flatMap((s) => vevent(s, beforeMin)),
    'END:VCALENDAR',
  ]
  const blob = new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// ───────────── Paroles du compagnon ─────────────
export function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

export function encouragementAfter(s: Session, tu: boolean): string {
  const t = (a: string, b: string) => (tu ? a : b)
  const p = s.plaisir ?? 5
  const base = [
    t('Bravo, tu l’as fait ! Chaque séance compte.', 'Bravo, vous l’avez fait ! Chaque séance compte.'),
    t('Belle séance ! Prends un moment pour savourer ça.', 'Belle séance ! Prenez un moment pour savourer ça.'),
    t('Tu peux être fier·e de toi aujourd’hui.', 'Vous pouvez être fier·e de vous aujourd’hui.'),
  ]
  if (p >= 7) return t('Quel plaisir de te lire ! Tu as trouvé une activité qui te fait du bien. 🌟', 'Quel plaisir de vous lire ! Vous avez trouvé une activité qui vous fait du bien. 🌟')
  if (p <= 3)
    return t(
      'Merci pour ton honnêteté. Même sans grand plaisir, tu y es allé·e : c’est précieux. On pourra chercher une activité qui te plaît davantage.',
      'Merci pour votre honnêteté. Même sans grand plaisir, vous y êtes allé·e : c’est précieux. On pourra chercher une activité qui vous plaît davantage.',
    )
  return pick(base)
}
