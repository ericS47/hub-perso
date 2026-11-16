import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import { addDays, isoDate, startOfWeek } from '../../lib/dates'
import { useSetting } from '../../lib/settings'
import { useCompanion, useReminders } from './hooks'
import { useNow } from './lib'
import { addToSet, computeReminders, DISMISSED, notify, NOTIFIED, readSet } from './reminderLogic'
import './agenda.css'

// Rappels sans serveur : minuterie pendant que l'appli est ouverte, notification système si elle
// est en arrière-plan, et bandeau dans l'appli pour ce qui est en cours ou a été manqué.
// ───────────── Composant monté par l'appli ─────────────
export function ReminderRunner() {
  // useNow et la minuterie ci-dessous ne servent qu'à provoquer un nouveau rendu : l'heure est relue ici.
  useNow(30_000)
  const [, force] = useState(0)
  const now = new Date()
  const settings = useReminders()
  const welcomeDone = useSetting('welcomeDone')
  const { t } = useCompanion()
  const location = useLocation()
  const today = isoDate(now)

  const sessions = useLiveQuery(() => db.sessions.where('date').between(addDays(today, -1), addDays(today, 1), true, true).toArray(), [today])
  // Nombre de séances par semaine, pour savoir si la semaine à préparer est déjà remplie.
  const counts = useLiveQuery(async () => {
    const monday = startOfWeek(today)
    const list = await db.sessions.where('date').between(addDays(monday, -7), addDays(monday, 13), true, true).toArray()
    const map: Record<string, number> = {}
    for (const s of list) map[startOfWeek(s.date)] = (map[startOfWeek(s.date)] ?? 0) + 1
    return map
  }, [today])

  const all = sessions && counts ? computeReminders(now, settings, sessions, (m) => counts[m] ?? 0, t) : []
  const active = all.filter((r) => r.dueAt <= now && now < r.until)

  // Notifications système pour les rappels qui viennent d'arriver (appli en arrière-plan).
  const activeKeys = active.map((r) => r.key).join('|')
  useEffect(() => {
    if (!settings.enabled) return
    const notified = readSet(NOTIFIED)
    for (const r of active) {
      if (notified.includes(r.key)) continue
      addToSet(NOTIFIED, r.key)
      const fresh = Date.now() - r.dueAt.getTime() < 15 * 60_000
      if (fresh && document.visibilityState !== 'visible') void notify(r.title, r.body, r.key, r.link)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKeys, settings.enabled])

  // Minuterie jusqu'au prochain rappel des 24 h à venir (plus précis que le passage régulier).
  const nextDue = all.map((r) => r.dueAt.getTime()).filter((d) => d > now.getTime()).sort((a, b) => a - b)[0]
  useEffect(() => {
    if (!nextDue) return
    const id = window.setTimeout(() => force((n) => n + 1), Math.min(nextDue - Date.now() + 500, 2_000_000_000))
    return () => window.clearTimeout(id)
  }, [nextDue])

  const [dismissed, setDismissed] = useState<string[]>(() => readSet(DISMISSED))

  // Pas de bandeau pendant l'accueil, une conversation ou une partie : il couvrirait la zone de réponse.
  const quiet = ['/compagnon/bienvenue', '/compagnon/parler', '/jeux/'].some((p) => location.pathname.startsWith(p))
  if (!welcomeDone || quiet) return null
  const order = { seance: 0, planning: 1, encouragement: 2 }
  const shown = active
    .filter((r) => !dismissed.includes(r.key))
    .filter((r) => !(r.kind === 'planning' && location.pathname.startsWith('/agenda/planifier')))
    .sort((a, b) => order[a.kind] - order[b.kind])[0]
  if (!shown) return null

  const dismiss = () => {
    addToSet(DISMISSED, shown.key)
    setDismissed(readSet(DISMISSED).concat(shown.key))
  }

  return (
    <aside className={`agenda-banner agenda-banner-${shown.kind}`} role="status" aria-live="polite">
      <span className="agenda-banner-icon" aria-hidden="true">
        {shown.kind === 'seance' ? '⏰' : shown.kind === 'planning' ? '🗓️' : '🌞'}
      </span>
      <Link to={shown.link} className="agenda-banner-text" onClick={dismiss}>
        <strong>{shown.title}</strong>
        <span>{shown.body}</span>
      </Link>
      <button type="button" className="icon-btn agenda-banner-close" onClick={dismiss} aria-label="Masquer ce rappel">
        ✕
      </button>
    </aside>
  )
}
