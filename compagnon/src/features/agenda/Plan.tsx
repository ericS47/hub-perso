import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Constraint, type Session } from '../../db'
import { addDays, isoDate, startOfWeek, weekday, weekDates } from '../../lib/dates'
import PageShell from '../../ui/PageShell'
import { ActivityPicker, DayPicker, DurationPicker } from './Pickers'
import SlotPicker from './SlotPicker'
import { createSeries } from './series'
import { sortSessions, useCompanion, useConstraints, useReminders } from './hooks'
import {
  activityEmoji,
  constraintsOn,
  downloadIcs,
  formatDuration,
  formatTime,
  longDay,
  minStartFor,
  overlaps,
  parseWeekParam,
  proposeStarts,
  sessionsBusyOn,
  timeRange,
  useNow,
  weekLabel,
} from './lib'

interface Draft {
  activity: string
  durationMin: number
  date: string
  start: string
}

type Step = { kind: 'count' } | { kind: 'session'; i: number } | { kind: 'recap' } | { kind: 'done'; saved: Session[] }

// Premier créneau libre d'un jour, en tenant compte des contraintes, des séances et des autres brouillons.
function firstFree(date: string, durationMin: number, constraints: Constraint[], taken: Pick<Session, 'date' | 'start' | 'durationMin' | 'activity'>[], now: Date): string {
  const busy = [...constraintsOn(date, constraints), ...sessionsBusyOn(date, taken)]
  // On préfère la fin d'après-midi ou le début de soirée si c'est libre, sinon le premier moment.
  const starts = proposeStarts(busy, durationMin, minStartFor(date, now), 100)
  return starts.find((s) => s >= '17:00' && s <= '19:00') ?? starts.find((s) => s >= '09:00') ?? starts[0] ?? ''
}

// Jours répartis sur la semaine pour n séances.
function spreadDays(days: string[], n: number): string[] {
  if (days.length === 0) return []
  return Array.from({ length: n }, (_, i) => days[Math.floor(((i + 0.5) * days.length) / n) % days.length])
}

export default function Plan() {
  const [params, setParams] = useSearchParams()
  const now = useNow()
  const today = isoDate(now)
  const thisMonday = startOfWeek(today)
  const nextMonday = addDays(thisMonday, 7)
  // Par défaut : le week-end, on prépare la semaine qui vient.
  const monday = parseWeekParam(params.get('semaine')) ?? (weekday(today) >= 5 ? nextMonday : thisMonday)
  const dates = weekDates(monday)
  const openDays = dates.filter((d) => d >= today)
  const constraints = useConstraints()
  const reminders = useReminders()
  const { t } = useCompanion()

  const existing = useLiveQuery(async () => sortSessions(await db.sessions.where('date').between(addDays(monday, -1), addDays(monday, 6), true, true).toArray()), [monday])
  const lastWeek = useLiveQuery(() => db.sessions.where('date').between(addDays(monday, -7), addDays(monday, -1), true, true).toArray(), [monday])

  const [step, setStep] = useState<Step>({ kind: 'count' })
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [copiedSkipped, setCopiedSkipped] = useState(0)
  // Ces séances : juste cette semaine, ou chaque semaine à partir de celle-ci.
  const [repeatWeekly, setRepeatWeekly] = useState(false)

  if (!constraints || !existing || !lastWeek) return <PageShell title="Je prépare ma semaine" backTo="/agenda">{null}</PageShell>

  const inWeek = existing.filter((s) => s.date >= monday)
  const activeExisting = existing.filter((s) => s.status !== 'manquee')

  function setWeek(m: string) {
    setParams({ semaine: m }, { replace: true })
    setStep({ kind: 'count' })
    setDrafts([])
  }

  const takenFor = (list: Draft[], except: number) => [...activeExisting, ...list.filter((_, k) => k !== except)]

  function start(n: number) {
    const days = spreadDays(openDays, n)
    const list: Draft[] = []
    for (let i = 0; i < n; i++) {
      const prev = list[i - 1]
      const d: Draft = { activity: prev?.activity ?? '', durationMin: prev?.durationMin ?? 30, date: days[i], start: '' }
      d.start = firstFree(d.date, d.durationMin, constraints!, takenFor(list, -1), now)
      list.push(d)
    }
    setDrafts(list)
    setStep({ kind: 'session', i: 0 })
  }

  function copyLastWeek() {
    const copies = sortSessions(lastWeek!).map((s) => ({ activity: s.activity, durationMin: s.durationMin, date: addDays(s.date, 7), start: s.start }))
    const kept = copies.filter((c) => c.date >= today)
    setCopiedSkipped(copies.length - kept.length)
    setDrafts(kept)
    setStep({ kind: 'recap' })
  }

  function update(i: number, patch: Partial<Draft>) {
    setDrafts((list) => {
      const next = list.map((d, k) => (k === i ? { ...d, ...patch } : d))
      // Changement de jour : on propose directement le premier moment libre de ce jour.
      if (patch.date && patch.date !== list[i].date) next[i].start = firstFree(patch.date, next[i].durationMin, constraints!, takenFor(next, i), now)
      return next
    })
  }

  async function saveAll() {
    const createdAt = Date.now()
    if (repeatWeekly) {
      const saved: Session[] = []
      for (const d of drafts) saved.push(await createSeries({ ...d, activity: d.activity.trim() }))
      setStep({ kind: 'done', saved })
      return
    }
    const rows: Session[] = drafts.map((d) => ({ ...d, activity: d.activity.trim(), status: 'prevue', createdAt }))
    const ids = await db.sessions.bulkAdd(rows, { allKeys: true })
    setStep({ kind: 'done', saved: rows.map((r, k) => ({ ...r, id: ids[k] })) })
  }

  const weekSwitch = (
    <div className="agenda-weekswitch" role="group" aria-label="Quelle semaine ?">
      {[thisMonday, nextMonday].map((m) => (
        <button key={m} type="button" aria-pressed={monday === m} className={monday === m ? 'chip on' : 'chip'} onClick={() => setWeek(m)}>
          {m === thisMonday ? 'Cette semaine' : 'La semaine prochaine'}
        </button>
      ))}
    </div>
  )

  const subtitle = `Semaine ${weekLabel(monday)}`

  // ── Semaine déjà passée ──
  if (openDays.length === 0) {
    return (
      <PageShell title="Je prépare ma semaine" subtitle={subtitle} backTo="/agenda">
        <div className="card agenda-empty">
          <p>Cette semaine est déjà derrière nous. On prépare plutôt la suivante ?</p>
          {weekSwitch}
        </div>
      </PageShell>
    )
  }

  // ── Étape 1 : combien ? ──
  if (step.kind === 'count') {
    return (
      <PageShell title="Je prépare ma semaine" subtitle={subtitle} backTo={`/agenda?semaine=${monday}`}>
        {weekSwitch}
        {inWeek.length > 0 && (
          <div className="card">
            <h2>Déjà dans ton agenda</h2>
            <ul className="agenda-plain-list">
              {inWeek.map((s) => (
                <li key={s.id}>
                  <span aria-hidden="true">{activityEmoji(s.activity)} </span>
                  {s.activity}, {longDay(s.date)} à {formatTime(s.start)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <section className="card">
          <h2>{inWeek.length ? 'Combien de séances veux-tu ajouter ?' : 'Combien de séances souhaites-tu faire cette semaine ?'}</h2>
          <p className="muted">Mieux vaut peu et régulier : une ou deux séances, c'est déjà très bien. Tu pourras toujours ajuster.</p>
          <div className="agenda-count" role="group" aria-label="Nombre de séances">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button key={n} type="button" className="agenda-count-btn" onClick={() => start(n)} aria-label={`${n} séance${n > 1 ? 's' : ''}`}>
                {n}
              </button>
            ))}
          </div>
        </section>
        {lastWeek.length > 0 && (
          <section className="card card-soft">
            <h2>Gagner du temps</h2>
            <p>
              La semaine précédente, tu avais prévu {lastWeek.length} séance{lastWeek.length > 1 ? 's' : ''}. Tu peux les reprendre puis les ajuster.
            </p>
            <button type="button" className="btn btn-secondary btn-block" onClick={copyLastWeek}>
              🔁 Reprendre la semaine dernière
            </button>
          </section>
        )}
        {constraints.length === 0 && (
          <p className="muted agenda-small agenda-center">
            Astuce : <Link to="/profil/travail">indique tes contraintes</Link> (travail, enfants…) pour que je te propose les bons moments.
          </p>
        )}
      </PageShell>
    )
  }

  // ── Étape 2 : chaque séance ──
  if (step.kind === 'session') {
    const i = step.i
    const d = drafts[i]
    const marks: Record<string, number> = {}
    for (const s of [...activeExisting.filter((s) => s.date >= monday), ...drafts.filter((_, k) => k !== i)]) marks[s.date] = (marks[s.date] ?? 0) + 1
    const valid = d.activity.trim() !== '' && d.start !== ''
    const last = i === drafts.length - 1
    return (
      <PageShell title={`Séance ${i + 1} sur ${drafts.length}`} subtitle={subtitle} backTo={`/agenda?semaine=${monday}`}>
        <div className="agenda-progress" aria-hidden="true">
          {drafts.map((_, k) => (
            <span key={k} className={k <= i ? 'on' : ''} />
          ))}
        </div>
        <div className="card" key={i}>
          <ActivityPicker value={d.activity} onChange={(v) => update(i, { activity: v })} />
          <DurationPicker value={d.durationMin} onChange={(v) => update(i, { durationMin: v })} />
          <DayPicker dates={dates} value={d.date} onChange={(v) => update(i, { date: v })} disabledBefore={today} marks={marks} />
          <SlotPicker
            date={d.date}
            start={d.start}
            durationMin={d.durationMin}
            constraints={constraints}
            sessionBusy={sessionsBusyOn(d.date, takenFor(drafts, i))}
            now={now}
            onChange={(v) => update(i, { start: v })}
          />
        </div>
        {!valid && <p className="muted agenda-small">{d.activity.trim() ? 'Choisis une heure pour continuer.' : 'Choisis une activité pour continuer.'}</p>}
        <div className="agenda-step-btns">
          <button type="button" className="btn btn-secondary" onClick={() => setStep(i === 0 ? { kind: 'count' } : { kind: 'session', i: i - 1 })}>
            Précédent
          </button>
          <button type="button" className="btn" disabled={!valid} onClick={() => setStep(last ? { kind: 'recap' } : { kind: 'session', i: i + 1 })}>
            {last ? 'Voir ma semaine' : 'Séance suivante'}
          </button>
        </div>
      </PageShell>
    )
  }

  // ── Étape 3 : récapitulatif ──
  if (step.kind === 'recap') {
    const sorted = drafts.map((d, i) => ({ d, i })).sort((a, b) => (a.d.date + a.d.start).localeCompare(b.d.date + b.d.start))
    return (
      <PageShell title="Ma semaine" subtitle={subtitle} backTo={`/agenda?semaine=${monday}`}>
        {copiedSkipped > 0 && (
          <p className="demo-note">
            {copiedSkipped} séance{copiedSkipped > 1 ? 's tombaient' : ' tombait'} sur des jours déjà passés : je ne les ai pas reprises.
          </p>
        )}
        {drafts.length === 0 ? (
          <div className="card agenda-empty">
            <p>Aucune séance pour l'instant.</p>
            <button type="button" className="btn" onClick={() => setStep({ kind: 'count' })}>
              Choisir mes séances
            </button>
          </div>
        ) : (
          <ul className="agenda-recap">
            {sorted.map(({ d, i }) => {
              const hits = overlaps(d, constraints)
              const valid = d.activity.trim() !== '' && d.start !== '' && d.date >= today
              return (
                <li key={i} className="card">
                  <div className="row">
                    <span className="agenda-session-emoji" aria-hidden="true">{activityEmoji(d.activity)}</span>
                    <div className="agenda-session-main">
                      <strong>{d.activity || 'Activité à choisir'}</strong>
                      <span className="agenda-session-time">
                        {longDay(d.date)}
                        <br />
                        {d.start ? timeRange(d) : 'Heure à choisir'} · {formatDuration(d.durationMin)}
                      </span>
                    </div>
                  </div>
                  {hits.length > 0 && <p className="agenda-gentle-warn">💡 Pendant « {hits[0].label} ». Tu peux la garder si ça te va.</p>}
                  {!valid && <p className="agenda-gentle-warn">✏️ Il manque une information.</p>}
                  <div className="btn-row">
                    <button type="button" className="btn btn-secondary" onClick={() => setStep({ kind: 'session', i })}>
                      Modifier
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => setDrafts((l) => l.filter((_, k) => k !== i))}>
                      Retirer
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {drafts.length > 0 && (
          <div className="stack">
            <section className="card">
              <h2>Et les semaines suivantes ?</h2>
              <div className="agenda-weekswitch" role="group" aria-label="Répéter ces séances ?">
                <button type="button" aria-pressed={!repeatWeekly} className={!repeatWeekly ? 'chip on' : 'chip'} onClick={() => setRepeatWeekly(false)}>
                  Juste cette semaine
                </button>
                <button type="button" aria-pressed={repeatWeekly} className={repeatWeekly ? 'chip on' : 'chip'} onClick={() => setRepeatWeekly(true)}>
                  🔁 Toutes les semaines à partir de celle-ci
                </button>
              </div>
              {repeatWeekly && (
                <p className="muted agenda-small">Ces séances seront prévues chaque semaine, au même jour et à la même heure. Tu pourras toujours en modifier ou en supprimer une.</p>
              )}
            </section>
            <button
              type="button"
              className="btn btn-block"
              disabled={drafts.some((d) => !d.activity.trim() || !d.start || d.date < today)}
              onClick={saveAll}
            >
              {repeatWeekly ? 'Enregistrer, chaque semaine' : 'Enregistrer ma semaine'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => {
                const last = drafts[drafts.length - 1]
                const date = openDays.find((x) => !drafts.some((d) => d.date === x)) ?? openDays[0]
                const nd: Draft = { activity: last?.activity ?? '', durationMin: last?.durationMin ?? 30, date, start: '' }
                nd.start = firstFree(date, nd.durationMin, constraints, takenFor(drafts, -1), now)
                setDrafts([...drafts, nd])
                setStep({ kind: 'session', i: drafts.length })
              }}
            >
              ＋ Ajouter une autre séance
            </button>
          </div>
        )}
      </PageShell>
    )
  }

  // ── Terminé ──
  return (
    <PageShell title="Ta semaine est prête" subtitle={subtitle}>
      <div className="card card-soft agenda-bravo" role="status">
        <div className="agenda-bravo-emoji" aria-hidden="true">🌟</div>
        <p>
          {t(
            `Bravo, tu t'es donné ${step.saved.length} rendez-vous avec toi-même. Le plus dur est fait : tu as fait de la place pour toi.`,
            `Bravo, vous vous êtes donné ${step.saved.length} rendez-vous avec vous-même. Le plus dur est fait : vous avez fait de la place pour vous.`,
          )}
        </p>
      </div>
      <div className="stack">
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={() => downloadIcs(step.saved, reminders.beforeSessionMin, `mes-seances-${monday}.ics`)}
        >
          📲 Ajouter mes séances à l'agenda du téléphone
        </button>
        <Link to={`/agenda?semaine=${monday}`} className="btn btn-block">
          Voir mon agenda
        </Link>
        <Link to="/agenda/rappels" className="btn btn-ghost btn-block">
          🔔 Régler mes rappels
        </Link>
      </div>
    </PageShell>
  )
}
