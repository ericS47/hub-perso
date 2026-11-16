import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Session } from '../../db'
import { addDays, isoDate, startOfWeek } from '../../lib/dates'
import PageShell from '../../ui/PageShell'
import { sortSessions } from './hooks'
import { activityEmoji, shortDate } from './lib'

// Couleurs des trois séries (palette vérifiée daltonisme / contraste), doublées de formes et de traits.
const SERIES = [
  { key: 'envie', label: 'Envie', color: '#6a5bc2', dash: '', marker: 'circle' },
  { key: 'motivation', label: 'Motivation', color: '#d9693a', dash: '6 4', marker: 'square' },
  { key: 'plaisir', label: 'Plaisir', color: '#008f7a', dash: '2 3', marker: 'triangle' },
] as const

type SeriesKey = (typeof SERIES)[number]['key']

const fmt = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })

function avg(list: (number | undefined)[]): number | null {
  const v = list.filter((x): x is number => typeof x === 'number')
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}

function Marker({ kind, x, y, color }: { kind: string; x: number; y: number; color: string }) {
  if (kind === 'square') return <rect x={x - 4} y={y - 4} width={8} height={8} rx={1.5} fill={color} stroke="#fff" strokeWidth={1.5} />
  if (kind === 'triangle') return <path d={`M${x} ${y - 5.5} L${x + 5} ${y + 4} L${x - 5} ${y + 4} Z`} fill={color} stroke="#fff" strokeWidth={1.5} />
  return <circle cx={x} cy={y} r={4.5} fill={color} stroke="#fff" strokeWidth={1.5} />
}

// Courbes envie / motivation / plaisir au fil des séances.
function FeelingsChart({ sessions }: { sessions: Session[] }) {
  const titleId = useId()
  const descId = useId()
  const [hover, setHover] = useState<number | null>(null)
  const W = 340
  const H = 200
  const L = 28
  const R = 12
  const T = 12
  const B = 28
  const n = sessions.length
  const x = (i: number) => (n === 1 ? L + (W - L - R) / 2 : L + (i * (W - L - R)) / (n - 1))
  const y = (v: number) => T + ((10 - v) * (H - T - B)) / 10
  const hs = hover !== null ? sessions[hover] : null

  return (
    <figure className="agenda-chart">
      <div className="agenda-legend" aria-hidden="true">
        {SERIES.map((s) => (
          <span key={s.key}>
            <svg width="26" height="12" viewBox="0 0 26 12">
              <line x1="1" y1="6" x2="25" y2="6" stroke={s.color} strokeWidth="2" strokeDasharray={s.dash} />
              <Marker kind={s.marker} x={13} y={6} color={s.color} />
            </svg>
            {s.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${titleId} ${descId}`} className="agenda-svg" onMouseLeave={() => setHover(null)}>
        <title id={titleId}>Envie, motivation et plaisir sur les {n} dernières séances</title>
        <desc id={descId}>Le détail des valeurs est disponible dans le tableau sous le graphique.</desc>
        {[0, 5, 10].map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#e0d7c8" strokeWidth={1} />
            <text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#5f6f6d">{v}</text>
          </g>
        ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="#5f6f6d" strokeWidth={1} strokeDasharray="3 3" />}
        {SERIES.map((s) => {
          const pts = sessions.map((se, i) => ({ i, v: se[s.key as SeriesKey] })).filter((p): p is { i: number; v: number } => typeof p.v === 'number')
          return (
            <g key={s.key}>
              <polyline points={pts.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={s.dash} strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p) => (
                <Marker key={p.i} kind={s.marker} x={x(p.i)} y={y(p.v)} color={s.color} />
              ))}
            </g>
          )
        })}
        {sessions.map((se, i) =>
          i === 0 || i === n - 1 || (n > 6 && i === Math.floor((n - 1) / 2)) ? (
            <text key={i} x={x(i)} y={H - 8} fontSize="11" fill="#5f6f6d" textAnchor={n === 1 ? 'middle' : i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>
              {shortDate(se.date)}
            </text>
          ) : null,
        )}
        {/* Zones de survol / toucher plus larges que les points */}
        {sessions.map((_, i) => (
          <rect
            key={i}
            x={x(i) - (W - L - R) / Math.max(n - 1, 1) / 2}
            y={T}
            width={(W - L - R) / Math.max(n - 1, 1)}
            height={H - T - B}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onClick={() => setHover(i)}
          />
        ))}
      </svg>
      <p className="agenda-chart-tip" aria-live="polite">
        {hs ? (
          <>
            <strong>
              {activityEmoji(hs.activity)} {hs.activity}, {shortDate(hs.date)}
            </strong>{' '}
            · envie {hs.envie ?? '–'} · motivation {hs.motivation ?? '–'} · plaisir {hs.plaisir ?? '–'}
          </>
        ) : (
          <span className="muted">Touche le graphique pour voir le détail d'une séance.</span>
        )}
      </p>
    </figure>
  )
}

// Nombre de séances faites par semaine (8 dernières semaines).
function WeeksChart({ weeks }: { weeks: { monday: string; done: number }[] }) {
  const titleId = useId()
  const W = 340
  const H = 160
  const T = 18
  const B = 26
  const max = Math.max(3, ...weeks.map((w) => w.done))
  const slot = W / weeks.length
  const bw = Math.min(26, slot - 10)
  const total = weeks.reduce((a, w) => a + w.done, 0)
  return (
    <figure className="agenda-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={titleId} className="agenda-svg">
        <title id={titleId}>
          Séances faites par semaine : {weeks.map((w) => `semaine du ${shortDate(w.monday)}, ${w.done}`).join(' ; ')}
        </title>
        <line x1={0} x2={W} y1={H - B} y2={H - B} stroke="#e0d7c8" />
        {weeks.map((w, i) => {
          const h = (w.done / max) * (H - T - B)
          const cx = i * slot + slot / 2
          const isLast = i === weeks.length - 1
          return (
            <g key={w.monday}>
              {w.done > 0 && (
                <path
                  d={`M${cx - bw / 2} ${H - B} V${H - B - h + 4} q0 -4 4 -4 H${cx + bw / 2 - 4} q4 0 4 4 V${H - B} Z`}
                  fill={isLast ? '#1f6f6b' : '#7fb6b0'}
                />
              )}
              <text x={cx} y={H - B - h - 5} textAnchor="middle" fontSize="12" fontWeight="600" fill="#22302f">
                {w.done}
              </text>
              <text x={cx} y={H - 8} textAnchor="middle" fontSize="10" fill="#5f6f6d">
                {isLast ? 'cette sem.' : shortDate(w.monday).replace('.', '')}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="muted">
        {total} séance{total > 1 ? 's' : ''} faite{total > 1 ? 's' : ''} en 8 semaines. Chaque barre commence le lundi indiqué.
      </figcaption>
    </figure>
  )
}

export default function Suivi() {
  const all = useLiveQuery(async () => sortSessions(await db.sessions.toArray()), [])
  const today = isoDate()

  if (!all) return <PageShell title="Mon évolution" backTo="/agenda">{null}</PageShell>

  const done = all.filter((s) => s.status === 'faite')
  const rated = done.filter((s) => s.envie !== undefined || s.motivation !== undefined || s.plaisir !== undefined)
  const recent = rated.slice(-20)

  const thisMonday = startOfWeek(today)
  const weeks = Array.from({ length: 8 }, (_, k) => {
    const monday = addDays(thisMonday, (k - 7) * 7)
    const sunday = addDays(monday, 6)
    return { monday, done: done.filter((s) => s.date >= monday && s.date <= sunday).length }
  })

  const byActivity = new Map<string, Session[]>()
  for (const s of rated) {
    if (s.plaisir === undefined) continue
    const k = s.activity.trim()
    byActivity.set(k, [...(byActivity.get(k) ?? []), s])
  }
  const activities = [...byActivity.entries()]
    .map(([activity, list]) => ({ activity, count: list.length, plaisir: avg(list.map((s) => s.plaisir))! }))
    .sort((a, b) => b.plaisir - a.plaisir || b.count - a.count)

  if (done.length === 0) {
    return (
      <PageShell title="Mon évolution" backTo="/agenda">
        <div className="card agenda-empty">
          <div className="agenda-empty-emoji" aria-hidden="true">📈</div>
          <h2>Ton évolution s'écrira ici</h2>
          <p className="muted">
            Après chaque séance, tu notes ton envie, ta motivation et ton plaisir. Au fil des semaines, tu verras ce qui te fait du bien.
          </p>
          <Link to="/agenda" className="btn btn-block">
            Aller à mon agenda
          </Link>
        </div>
      </PageShell>
    )
  }

  const last5 = recent.slice(-5)
  return (
    <PageShell title="Mon évolution" subtitle="Ce que tu ressens au fil des séances" backTo="/agenda">
      <section className="card" aria-labelledby="agenda-feel-h">
        <h2 id="agenda-feel-h">Envie, motivation, plaisir</h2>
        {recent.length === 0 ? (
          <p className="muted">Tes séances faites n'ont pas encore de ressenti noté. La prochaine fois, prends quelques secondes pour le noter.</p>
        ) : (
          <>
            <dl className="agenda-ratings">
              {SERIES.map((s) => {
                const a = avg(last5.map((se) => se[s.key as SeriesKey]))
                return (
                  <div key={s.key}>
                    <dt>{s.label}</dt>
                    <dd>
                      {a === null ? '–' : fmt(a)}
                      <small>/10</small>
                    </dd>
                  </div>
                )
              })}
            </dl>
            <p className="muted agenda-small">Moyennes de tes {last5.length > 1 ? `${last5.length} dernières séances` : 'dernière séance'}.</p>
            <FeelingsChart sessions={recent} />
            <details className="agenda-details">
              <summary>Voir les valeurs en tableau</summary>
              <table className="agenda-table">
                <thead>
                  <tr>
                    <th scope="col">Séance</th>
                    <th scope="col">Envie</th>
                    <th scope="col">Motiv.</th>
                    <th scope="col">Plaisir</th>
                  </tr>
                </thead>
                <tbody>
                  {[...recent].reverse().map((s) => (
                    <tr key={s.id}>
                      <th scope="row">
                        {shortDate(s.date)} · {s.activity}
                      </th>
                      <td>{s.envie ?? '–'}</td>
                      <td>{s.motivation ?? '–'}</td>
                      <td>{s.plaisir ?? '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </section>

      <section className="card" aria-labelledby="agenda-weeks-h">
        <h2 id="agenda-weeks-h">Séances faites par semaine</h2>
        <WeeksChart weeks={weeks} />
      </section>

      {activities.length > 0 && (
        <section className="card" aria-labelledby="agenda-act-h">
          <h2 id="agenda-act-h">Les activités qui te font le plus plaisir</h2>
          <ul className="agenda-act-list">
            {activities.slice(0, 6).map((a) => (
              <li key={a.activity}>
                <div className="row-between">
                  <span>
                    <span aria-hidden="true">{activityEmoji(a.activity)} </span>
                    <strong>{a.activity}</strong>{' '}
                    <span className="muted">
                      ({a.count} séance{a.count > 1 ? 's' : ''})
                    </span>
                  </span>
                  <span className="agenda-act-val">{fmt(a.plaisir)}/10</span>
                </div>
                <div className="agenda-act-bar" aria-hidden="true">
                  <span style={{ width: `${(a.plaisir / 10) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          {activities.length > 1 && (
            <p className="muted agenda-small">
              Une piste : garder une place pour {activities[0].activity.toLowerCase()} dans ta semaine.
            </p>
          )}
        </section>
      )}
    </PageShell>
  )
}
