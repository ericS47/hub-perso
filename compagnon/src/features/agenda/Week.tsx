import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Session } from '../../db'
import { addDays, DAY_NAMES, isoDate, parseIso, startOfWeek, weekDates } from '../../lib/dates'
import PageShell from '../../ui/PageShell'
import { useConstraints, useWeekSessions } from './hooks'
import {
  DISPLAY_LABEL,
  activityEmoji,
  busyRangeLabel,
  constraintsOn,
  displayState,
  formatDuration,
  parseWeekParam,
  timeRange,
  useNow,
  weekKind,
  weekLabel,
  type Display,
} from './lib'
import { DoneButtons, SessionFlow, SessionSheet, type FlowMode } from './Sheets'

// Résumé encourageant de la semaine (jamais « 0 sur 3 »).
function summary(sessions: Session[], now: Date, monday: string, current: boolean): { title: string; detail?: string } {
  const states = sessions.map((s) => displayState(s, now))
  const total = sessions.length
  const done = states.filter((s) => s === 'faite').length
  const toFill = states.filter((s) => s === 'a-completer').length
  const upcoming = states.filter((s) => s === 'prevue' || s === 'aujourdhui').length
  const minutes = sessions.filter((s) => s.status === 'faite').reduce((a, s) => a + s.durationMin, 0)
  const past = addDays(monday, 6) < isoDate(now)
  const detail = minutes ? `${formatDuration(minutes)} d'activité au compteur.` : undefined
  const pl = (n: number, w: string) => `${n} ${w}${n > 1 ? 's' : ''}`

  if (done === total) return { title: `Bravo, ${done === 1 ? 'ta séance est faite' : `tes ${done} séances sont faites`} ! 🎉`, detail }
  if (done > 0) {
    const tail = upcoming ? ` Encore ${pl(upcoming, 'séance')} à venir, à ton rythme.` : past ? ' Chaque séance compte.' : ''
    return { title: `${done} séance${done > 1 ? 's' : ''} sur ${total} ${done > 1 ? 'faites' : 'faite'} 💪`, detail: [detail, tail.trim()].filter(Boolean).join(' ') }
  }
  if (upcoming === total) return { title: `${pl(total, 'séance')} ${total > 1 ? 'prévues' : 'prévue'}${current ? ' cette semaine' : ''}`, detail: 'Belle organisation, tu as fait le plus dur : te donner rendez-vous.' }
  if (upcoming > 0) return { title: `${pl(upcoming, 'séance')} encore à venir`, detail: 'Chaque nouvelle séance est une nouvelle occasion.' }
  if (toFill > 0) return { title: `${pl(toFill, 'séance')} à compléter`, detail: 'Dis-moi comment ça s’est passé, quelle que soit la réponse.' }
  return { title: 'Cette semaine n’a pas été simple, et c’est OK', detail: 'La suivante est une page blanche.' }
}

function SessionRow({ session, now }: { session: Session; now: Date }) {
  const [mode, setMode] = useState<FlowMode | null>(null)
  const state: Display = displayState(session, now)
  const lab = DISPLAY_LABEL[state]
  return (
    <li>
      <button type="button" className={`agenda-session agenda-session-${state}`} onClick={() => setMode('detail')}>
        <span className="agenda-session-emoji" aria-hidden="true">{activityEmoji(session.activity)}</span>
        <span className="agenda-session-main">
          <strong>{session.activity}</strong>
          <span className="agenda-session-time">
            {timeRange(session)} · {formatDuration(session.durationMin)}
          </span>
        </span>
        <span className={`agenda-status agenda-status-${state}`}>
          <span aria-hidden="true">{lab.icon}</span> {lab.text}
        </span>
      </button>
      {state === 'a-completer' && (
        <DoneButtons onPick={setMode} compact />
      )}
      <SessionFlow session={session} mode={mode} onMode={setMode} />
    </li>
  )
}

export default function Week() {
  const [params, setParams] = useSearchParams()
  const now = useNow()
  const today = isoDate(now)
  const thisMonday = startOfWeek(today)
  const monday = parseWeekParam(params.get('semaine')) ?? thisMonday
  const sessions = useWeekSessions(monday)
  const constraints = useConstraints()
  const [adding, setAdding] = useState<string | null>(null)

  const goto = (m: string) => setParams(m === thisMonday ? {} : { semaine: m }, { replace: true })
  const hasAB = constraints?.some((c) => c.weekType !== 'toutes')
  const isCurrent = monday === thisMonday
  const isPast = addDays(monday, 6) < today
  const weekName = isCurrent ? 'Cette semaine' : monday === addDays(thisMonday, 7) ? 'La semaine prochaine' : monday === addDays(thisMonday, -7) ? 'La semaine dernière' : 'Semaine'

  if (!sessions || !constraints) return <PageShell title="Mon agenda">{null}</PageShell>

  const sum = sessions.length ? summary(sessions, now, monday, isCurrent) : null

  return (
    <PageShell title="Mon agenda" subtitle="Mes séances d'activité physique">
      <nav className="agenda-weeknav" aria-label="Changer de semaine">
        <button type="button" className="icon-btn agenda-navbtn" onClick={() => goto(addDays(monday, -7))} aria-label="Semaine précédente">
          ‹
        </button>
        <div className="agenda-weeknav-title" aria-live="polite">
          <strong>{weekName}</strong>
          <span className="muted">
            {weekLabel(monday)}
            {hasAB && ` · semaine ${weekKind(monday)}`}
          </span>
        </div>
        <button type="button" className="icon-btn agenda-navbtn" onClick={() => goto(addDays(monday, 7))} aria-label="Semaine suivante">
          ›
        </button>
      </nav>
      {!isCurrent && (
        <p className="agenda-center">
          <button type="button" className="btn btn-ghost" onClick={() => goto(thisMonday)}>
            ↩ Revenir à cette semaine
          </button>
        </p>
      )}

      {sum ? (
        <section className="card card-soft agenda-summary" aria-label="Résumé de la semaine">
          <h2>{sum.title}</h2>
          {sum.detail && <p>{sum.detail}</p>}
          {!isPast && (
            <Link to={`/agenda/planifier?semaine=${monday}`} className="btn btn-secondary">
              Ajuster ma semaine
            </Link>
          )}
        </section>
      ) : (
        <section className="card agenda-empty">
          <div className="agenda-empty-emoji" aria-hidden="true">🌱</div>
          <h2>{isPast ? 'Rien de noté cette semaine-là' : 'Ta semaine est encore toute blanche'}</h2>
          {isPast ? (
            <p className="muted">Pas de souci : on regarde devant.</p>
          ) : (
            <>
              <p className="muted">Prenons quelques minutes pour placer les moments qui te font du bien. Je te propose des créneaux libres.</p>
              <Link to={`/agenda/planifier?semaine=${monday}`} className="btn btn-block">
                Je prépare ma semaine
              </Link>
            </>
          )}
        </section>
      )}

      <ol className="agenda-week" aria-label="Jours de la semaine">
        {weekDates(monday).map((d, i) => {
          const daySessions = sessions.filter((s) => s.date === d)
          const busy = constraintsOn(d, constraints)
          const isToday = d === today
          return (
            <li key={d} className={`agenda-day${isToday ? ' agenda-today' : ''}${d < today ? ' agenda-day-past' : ''}`} aria-current={isToday ? 'date' : undefined}>
              <div className="agenda-day-head">
                <h3>
                  {DAY_NAMES[i]} <span className="agenda-day-num">{parseIso(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
                </h3>
                {isToday && <span className="badge">Aujourd'hui</span>}
                {d >= today && (
                  <button type="button" className="icon-btn agenda-add" onClick={() => setAdding(d)} aria-label={`Ajouter une séance ${DAY_NAMES[i].toLowerCase()}`}>
                    ＋
                  </button>
                )}
              </div>
              {busy.length > 0 && (
                <p className="agenda-busy">
                  <span className="agenda-sr">Occupé : </span>
                  {busy.map((b, k) => (
                    <span key={k} className="agenda-busy-item">
                      <span aria-hidden="true">⏳ </span>
                      {busyRangeLabel(b)} · {b.label}
                    </span>
                  ))}
                </p>
              )}
              {daySessions.length > 0 ? (
                <ul className="agenda-sessions">
                  {daySessions.map((s) => (
                    <SessionRow key={s.id} session={s} now={now} />
                  ))}
                </ul>
              ) : (
                busy.length === 0 && <p className="agenda-nothing">Journée libre</p>
              )}
            </li>
          )
        })}
      </ol>

      <div className="stack agenda-bottom">
        <button type="button" className="btn btn-secondary btn-block" onClick={() => setAdding(monday > today ? monday : today > addDays(monday, 6) ? monday : today)}>
          ＋ Ajouter une séance
        </button>
        <Link to="/agenda/suivi" className="card agenda-link-card">
          <span aria-hidden="true">📈</span>
          <span>
            <strong>Mon évolution</strong>
            <span className="muted"> Envie, motivation, plaisir au fil des séances</span>
          </span>
        </Link>
        <Link to="/agenda/rappels" className="card agenda-link-card">
          <span aria-hidden="true">🔔</span>
          <span>
            <strong>Mes rappels</strong>
            <span className="muted"> Être prévenu·e avant une séance</span>
          </span>
        </Link>
        {constraints.length === 0 && (
          <p className="muted agenda-small agenda-center">
            Tes contraintes (travail, enfants…) ne sont pas encore renseignées.{' '}
            <Link to="/profil/travail">Les indiquer</Link>
          </p>
        )}
      </div>

      {adding && <SessionSheet defaultDate={adding} onClose={() => setAdding(null)} />}
    </PageShell>
  )
}
