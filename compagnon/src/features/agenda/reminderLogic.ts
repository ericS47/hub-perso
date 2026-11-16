import type { ReminderSettings, Session } from '../../db'
import { addDays, isoDate, parseIso, startOfWeek, toMinutes } from '../../lib/dates'
import { deActivity, formatTime, sessionStart } from './lib'

// ───────────── Planificateur de rappels (sans serveur) ─────────────
// Les rappels ne peuvent partir que lorsque l'appli est ouverte ou en arrière-plan récent :
// minuterie pour les rappels du jour + bandeau dans l'appli pour ce qui a été manqué.

export interface Reminder {
  key: string
  kind: 'seance' | 'planning' | 'encouragement'
  dueAt: Date
  // Fin de validité (après quoi le rappel n'a plus de sens).
  until: Date
  title: string
  body: string
  link: string
}

type Say = (a: string, b: string) => string

// Dernier rendez-vous de planification passé (ou à venir si `next`).
export function planningMoment(now: Date, r: ReminderSettings, next = false): Date {
  const d = parseIso(addDays(startOfWeek(isoDate(now)), r.planningDay))
  d.setMinutes(toMinutes(r.planningTime || '18:00'))
  if (next) {
    while (d <= now) d.setDate(d.getDate() + 7)
  } else {
    while (d > now) d.setDate(d.getDate() - 7)
  }
  return d
}

// Semaine à préparer lors d'un rendez-vous : celle qui suit si le rendez-vous est en fin de semaine.
export function planningTarget(moment: Date, r: ReminderSettings): string {
  const monday = startOfWeek(isoDate(moment))
  return r.planningDay >= 4 ? addDays(monday, 7) : monday
}

function minutesLabel(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
}

// Tous les rappels pertinents autour de maintenant (passés récents et à venir dans les 24 h).
export function computeReminders(now: Date, r: ReminderSettings, sessions: Session[], planCount: (monday: string) => number, t: Say): Reminder[] {
  const out: Reminder[] = []
  const today = isoDate(now)
  const horizon = new Date(now.getTime() + 24 * 3600_000)

  // Séances prévues : rappel X minutes avant.
  for (const s of sessions) {
    if (s.status !== 'prevue') continue
    const start = sessionStart(s)
    if (start <= now || start > horizon) continue
    const dueAt = new Date(start.getTime() - r.beforeSessionMin * 60_000)
    const left = Math.max(1, Math.round((start.getTime() - now.getTime()) / 60_000))
    out.push({
      key: `seance-${s.id}-${s.date}-${s.start}`,
      kind: 'seance',
      dueAt,
      until: start,
      title: `Ta séance ${deActivity(s.activity)} ${now >= dueAt ? `est dans ${minutesLabel(left)}` : `à ${formatTime(s.start)}`}`,
      body: t('Prépare tes affaires et un peu d’eau. Tu vas te faire du bien !', 'Préparez vos affaires et un peu d’eau. Vous allez vous faire du bien !'),
      link: `/agenda?semaine=${startOfWeek(s.date)}`,
    })
  }

  // Encouragement du matin les jours de séance.
  if (r.encouragements) {
    const first = sessions.find((s) => s.status === 'prevue' && s.date === today && sessionStart(s) > now)
    if (first) {
      const dueAt = parseIso(today)
      dueAt.setHours(8)
      out.push({
        key: `encouragement-${today}`,
        kind: 'encouragement',
        dueAt,
        until: new Date(sessionStart(first).getTime() - r.beforeSessionMin * 60_000),
        title: t('Belle journée pour bouger 🌞', 'Belle journée pour bouger 🌞'),
        body: t(
          `Aujourd'hui, ${first.activity.toLowerCase()} à ${formatTime(first.start)}. Je crois en toi !`,
          `Aujourd'hui, ${first.activity.toLowerCase()} à ${formatTime(first.start)}. Je crois en vous !`,
        ),
        link: '/agenda',
      })
    }
  }

  // Rendez-vous hebdomadaire de planification (le dernier passé, et le prochain s'il tombe dans les 24 h).
  for (const moment of [planningMoment(now, r), planningMoment(now, r, true)]) {
    if (moment > horizon) continue
    const target = planningTarget(moment, r)
    if (addDays(target, 6) < today || planCount(target) > 0) continue
    out.push({
      key: `planning-${isoDate(moment)}`,
      kind: 'planning',
      dueAt: moment,
      until: new Date(moment.getTime() + 3 * 24 * 3600_000),
      title: t('C’est le moment de préparer ta semaine', 'C’est le moment de préparer votre semaine'),
      body: t('Quelques minutes pour placer tes séances, je te propose des moments libres.', 'Quelques minutes pour placer vos séances, je vous propose des moments libres.'),
      link: `/agenda/planifier?semaine=${target}`,
    })
  }
  return out
}

// ───────────── Mémoire locale (rappels déjà montrés / écartés) ─────────────
export function readSet(name: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(name) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function addToSet(name: string, key: string) {
  try {
    const list = readSet(name).filter((k) => k !== key)
    list.push(key)
    localStorage.setItem(name, JSON.stringify(list.slice(-60)))
  } catch {
    // Stockage indisponible (navigation privée) : tant pis, le rappel pourra se répéter.
  }
}

export const DISMISSED = 'agenda.reminders.dismissed'
export const NOTIFIED = 'agenda.reminders.notified'

// ───────────── Notification système ─────────────
export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function notify(title: string, body: string, tag: string, link: string): Promise<boolean> {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false
  const icon = `${import.meta.env.BASE_URL}pwa-192.png`
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg?.active) {
      await reg.showNotification(title, { body, tag, icon, badge: icon, data: { url: `#${link}` } })
      return true
    }
  } catch {
    // On tente la notification classique ci-dessous.
  }
  try {
    const n = new Notification(title, { body, tag, icon })
    n.onclick = () => {
      window.focus()
      window.location.hash = link
      n.close()
    }
    return true
  } catch {
    return false
  }
}
