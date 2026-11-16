import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Session } from '../../db'
import { addDays, isoDate, startOfWeek, weekday } from '../../lib/dates'
import { sortSessions } from './hooks'
import { activityEmoji, displayState, formatDuration, formatTime, relativeDay, timeRange, useNow } from './lib'
import { DoneButtons, IcsButton, SessionFlow, type FlowMode } from './Sheets'
import './agenda.css'

// Carte de l'accueil : séance du jour, prochaine séance, séances à compléter ou invitation à planifier.
export default function HomeCard() {
  const now = useNow()
  const today = isoDate(now)
  const monday = startOfWeek(today)
  const [flow, setFlow] = useState<{ session: Session; mode: FlowMode } | null>(null)

  // Prévues des 4 dernières semaines (à compléter) et à venir.
  const prevues = useLiveQuery(async () => sortSessions(await db.sessions.where('status').equals('prevue').filter((s) => s.date >= addDays(today, -28)).toArray()), [today])
  if (!prevues) return null

  const toFill = prevues.filter((s) => displayState(s, now) === 'a-completer')
  const current = prevues.filter((s) => displayState(s, now) === 'aujourdhui')
  const upcoming = prevues.filter((s) => displayState(s, now) === 'prevue')
  const next = current[0] ?? upcoming[0]
  const nextMonday = addDays(monday, 7)
  const planWeek = weekday(today) >= 5 ? nextMonday : monday
  const weekHasPlan = prevues.some((s) => s.date >= planWeek && s.date <= addDays(planWeek, 6))

  const open = (session: Session) => (mode: FlowMode | null) => setFlow(mode ? { session, mode } : null)

  return (
    <section className="card agenda-home" aria-labelledby="agenda-home-h">
      <div className="row-between">
        <h2 id="agenda-home-h">
          <span aria-hidden="true">📅 </span>Mes séances
        </h2>
        <Link to="/agenda" className="agenda-home-link">
          Mon agenda ›
        </Link>
      </div>

      {next ? (
        <div className="agenda-home-next">
          <p className="agenda-home-label">{next.date === today ? "Aujourd'hui" : 'Prochaine séance'}</p>
          <div className="row">
            <span className="agenda-session-emoji" aria-hidden="true">{activityEmoji(next.activity)}</span>
            <div className="agenda-session-main">
              <strong>{next.activity}</strong>
              <span className="agenda-session-time">
                {next.date === today ? '' : `${relativeDay(next.date, today).replace(/^./, (c) => c.toUpperCase())}, `}
                {timeRange(next)} · {formatDuration(next.durationMin)}
              </span>
            </div>
          </div>
          {displayState(next, now) === 'aujourdhui' ? <DoneButtons onPick={open(next)} /> : <div className="btn-row"><IcsButton session={next} /></div>}
        </div>
      ) : (
        !weekHasPlan && (
          <div className="agenda-home-invite">
            <p>{planWeek === monday ? 'Rien de prévu pour le moment cette semaine.' : 'La semaine prochaine approche.'} Et si on plaçait quelques moments pour toi ?</p>
            <Link to={`/agenda/planifier?semaine=${planWeek}`} className="btn btn-block">
              🗓️ Je prépare ma semaine
            </Link>
          </div>
        )
      )}
      {!next && weekHasPlan && <p className="muted">Pas d'autre séance prévue pour l'instant.</p>}
      {next && !weekHasPlan && planWeek !== monday && (
        <Link to={`/agenda/planifier?semaine=${planWeek}`} className="btn btn-ghost btn-block">
          🗓️ Préparer la semaine prochaine
        </Link>
      )}

      {toFill.length > 0 && (
        <div className="agenda-home-fill">
          <h3>À compléter</h3>
          <p className="muted agenda-small">Comment se sont passées ces séances ? Les deux réponses sont bonnes à dire.</p>
          <ul className="agenda-plain-list">
            {toFill.slice(-3).reverse().map((s) => (
              <li key={s.id} className="agenda-home-fill-item">
                <p>
                  <span aria-hidden="true">{activityEmoji(s.activity)} </span>
                  <strong>{s.activity}</strong> · {relativeDay(s.date, today)} à {formatTime(s.start)}
                </p>
                <DoneButtons onPick={open(s)} compact />
              </li>
            ))}
          </ul>
          {toFill.length > 3 && (
            <Link to="/agenda" className="agenda-home-link">
              Et {toFill.length - 3} autre{toFill.length - 3 > 1 ? 's' : ''} dans l'agenda ›
            </Link>
          )}
        </div>
      )}

      {flow && <SessionFlow session={flow.session} mode={flow.mode} onMode={open(flow.session)} />}
    </section>
  )
}
