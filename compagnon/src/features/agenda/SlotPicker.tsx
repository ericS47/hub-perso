import { useId } from 'react'
import type { Constraint } from '../../db'
import { Link } from 'react-router-dom'
import { toMinutes } from '../../lib/dates'
import { type Busy, busyRangeLabel, constraintsOn, formatTime, minStartFor, overlaps, proposeStarts, timeRange } from './lib'

interface Props {
  date: string
  start: string
  durationMin: number
  // Contraintes du profil et plages déjà prises par d'autres séances ce jour-là.
  constraints: Constraint[]
  sessionBusy: Busy[]
  now: Date
  onChange: (start: string) => void
}

// Choix de l'heure : créneaux libres proposés + heure libre, avec avertissement doux en cas de chevauchement.
export default function SlotPicker({ date, start, durationMin, constraints, sessionBusy, now, onChange }: Props) {
  const timeId = useId()
  const busy: Busy[] = [...sessionBusy, ...constraintsOn(date, constraints)]
  const proposals = proposeStarts(busy, durationMin, minStartFor(date, now))
  const hits = start ? overlaps({ date, start, durationMin }, constraints) : []
  const sessionHits = start ? sessionBusy.filter((b) => b.from < toMinutes(start) + durationMin && b.to > toMinutes(start)) : []

  return (
    <div className="agenda-slots">
      <fieldset className="chips">
        <legend>Les moments libres ce jour-là</legend>
        {proposals.length > 0 ? (
          <div className="chips-row">
            {proposals.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={p === start}
                className={p === start ? 'chip on' : 'chip'}
                onClick={() => onChange(p)}
              >
                {formatTime(p)}
              </button>
            ))}
          </div>
        ) : (
          <p className="muted">Pas de grand moment libre entre 6 h et 22 h ce jour-là. Tu peux choisir une heure toi-même ou essayer un autre jour.</p>
        )}
      </fieldset>

      <label className="field agenda-time-field" htmlFor={timeId}>
        <span>Ou une autre heure</span>
        <input id={timeId} type="time" value={start} step={300} onChange={(e) => e.target.value && onChange(e.target.value)} />
      </label>

      {start && (
        <p className="muted agenda-slot-range">
          De {timeRange({ start, durationMin })}
        </p>
      )}

      {hits.length > 0 && (
        <p className="agenda-gentle-warn" role="status">
          <span aria-hidden="true">💡 </span>
          Ce moment tombe pendant {hits.map((h) => `« ${h.label} » (${busyRangeLabel(h)})`).join(' et ')}. Si ça te convient, tu peux le garder.
        </p>
      )}
      {sessionHits.length > 0 && (
        <p className="agenda-gentle-warn" role="status">
          <span aria-hidden="true">💡 </span>
          Tu as déjà prévu {sessionHits.map((h) => h.label.toLowerCase()).join(' et ')} à ce moment-là.
        </p>
      )}
      {constraints.length === 0 && (
        <p className="muted agenda-small">
          Pour que je te propose des moments qui collent à ton emploi du temps,{' '}
          <Link to="/profil/travail">indique tes contraintes dans ton profil</Link>.
        </p>
      )}
    </div>
  )
}
