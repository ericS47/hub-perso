import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Session } from '../../db'
import { addDays, isoDate } from '../../lib/dates'
import Sheet from '../../ui/Sheet'
import Scale from '../../ui/Scale'
import { ActivityPicker, DurationPicker } from './Pickers'
import SlotPicker from './SlotPicker'
import { createSeries, stopSeriesFrom } from './series'
import { useCompanion, useConstraints, useReminders } from './hooks'
import {
  DISPLAY_LABEL,
  activityEmoji,
  deActivity,
  displayState,
  downloadIcs,
  encouragementAfter,
  formatDuration,
  longDay,
  sessionEnd,
  sessionsBusyOn,
  timeRange,
  useNow,
} from './lib'

export type FlowMode = 'detail' | 'edit' | 'review' | 'missed'

// Aiguillage entre les panneaux d'une séance.
export function SessionFlow({ session, mode, onMode }: { session: Session; mode: FlowMode | null; onMode: (m: FlowMode | null) => void }) {
  const close = () => onMode(null)
  if (mode === 'detail') return <DetailSheet session={session} onClose={close} onMode={onMode} />
  if (mode === 'edit') return <SessionSheet session={session} onClose={close} />
  if (mode === 'review') return <ReviewSheet session={session} onClose={close} />
  if (mode === 'missed') return <MissedSheet session={session} onClose={close} onReschedule={() => onMode('edit')} />
  return null
}

// Les deux choix après une séance : fait / pas fait (le panneau est géré par le parent).
export function DoneButtons({ onPick, compact }: { onPick: (m: FlowMode) => void; compact?: boolean }) {
  return (
    <div className="agenda-done-btns">
      <button type="button" className="btn" onClick={() => onPick('review')}>
        <span aria-hidden="true">✅</span> {compact ? "Je l'ai faite" : "J'ai fait ma séance"}
      </button>
      <button type="button" className="btn btn-secondary" onClick={() => onPick('missed')}>
        {compact ? 'Pas cette fois' : "Je n'ai pas pu la faire"}
      </button>
    </div>
  )
}

export function IcsButton({ session, block }: { session: Session; block?: boolean }) {
  const reminders = useReminders()
  return (
    <button
      type="button"
      className={`btn btn-secondary${block ? ' btn-block' : ''}`}
      onClick={() => downloadIcs([session], reminders.beforeSessionMin, `seance-${session.date}-${session.start.replace(':', 'h')}.ics`)}
    >
      <span aria-hidden="true">📲</span> Ajouter à mon agenda
    </button>
  )
}

// ───────────── Détail d'une séance ─────────────
function DetailSheet({ session, onClose, onMode }: { session: Session; onClose: () => void; onMode: (m: FlowMode | null) => void }) {
  const now = useNow()
  const state = displayState(session, now)
  const lab = DISPLAY_LABEL[state]
  const navigate = useNavigate()
  const { name } = useCompanion()
  return (
    <Sheet title={`${activityEmoji(session.activity)} ${session.activity}`} onClose={onClose}>
      <p className="agenda-detail-when">
        <strong>{longDay(session.date)}</strong>
        <br />
        {timeRange(session)} · {formatDuration(session.durationMin)}
        {session.seriesId !== undefined && (
          <>
            <br />
            <span className="muted">🔁 Chaque semaine</span>
          </>
        )}
      </p>
      <p>
        <span className={`agenda-status agenda-status-${state}`}>
          <span aria-hidden="true">{lab.icon}</span> {lab.text}
        </span>
      </p>

      {session.status === 'faite' && (
        <dl className="agenda-ratings">
          <div><dt>Envie</dt><dd>{session.envie ?? '–'}<small>/10</small></dd></div>
          <div><dt>Motivation</dt><dd>{session.motivation ?? '–'}<small>/10</small></dd></div>
          <div><dt>Plaisir</dt><dd>{session.plaisir ?? '–'}<small>/10</small></dd></div>
        </dl>
      )}
      {session.note && <p className="agenda-note">« {session.note} »</p>}

      {(state === 'aujourdhui' || state === 'a-completer') && (
        <>
          {state === 'a-completer' && <p className="muted">Comment ça s'est passé ? Les deux réponses sont bonnes à dire.</p>}
          <DoneButtons onPick={onMode} />
        </>
      )}

      <div className="stack agenda-detail-actions">
        {(state === 'prevue' || state === 'aujourdhui') && <IcsButton session={session} block />}
        {session.status === 'faite' && (
          <button type="button" className="btn btn-secondary btn-block" onClick={() => onMode('review')}>
            Modifier mon ressenti
          </button>
        )}
        {session.status === 'manquee' && (
          <>
            <button type="button" className="btn btn-secondary btn-block" onClick={() => onMode('review')}>
              Finalement, je l'ai faite
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block"
              onClick={() => navigate(`/compagnon/parler/seance-manquee?seance=${session.id}`)}
            >
              💬 En parler avec {name}
            </button>
          </>
        )}
        <button type="button" className="btn btn-ghost btn-block" onClick={() => onMode('edit')}>
          ✏️ Modifier ou supprimer
        </button>
      </div>
    </Sheet>
  )
}

// ───────────── Ajouter / modifier une séance ─────────────
export function SessionSheet({ session, defaultDate, onClose }: { session?: Session; defaultDate?: string; onClose: () => void }) {
  const now = useNow()
  const today = isoDate(now)
  const constraints = useConstraints() ?? []
  const [activity, setActivity] = useState(session?.activity ?? '')
  const [durationMin, setDuration] = useState(session?.durationMin ?? 30)
  const [date, setDate] = useState(session?.date ?? defaultDate ?? today)
  const [start, setStart] = useState(session?.start ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  // Nouvelle séance : une seule fois, ou chaque semaine à partir de ce jour.
  const [repeat, setRepeat] = useState(false)
  // Séance d'une répétition encore à venir : on touche seulement celle-ci, ou aussi les suivantes.
  const inSeries = session?.seriesId !== undefined && session.status === 'prevue'
  const [scope, setScope] = useState<'one' | 'next'>('one')
  const dateId = useId()

  // Autres séances autour de ce jour (la veille pour les séances qui passent minuit).
  const others =
    useLiveQuery(
      () =>
        db.sessions
          .where('date')
          .between(addDays(date, -1), date, true, true)
          .filter((s) => s.id !== session?.id && s.status !== 'manquee')
          .toArray(),
      [date, session?.id],
    ) ?? []

  const valid = activity.trim() !== '' && /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(start) && durationMin > 0

  async function save() {
    if (!valid) return
    const data = { activity: activity.trim(), durationMin, date, start }
    if (session?.seriesId !== undefined && inSeries && scope === 'next') {
      // La répétition s'arrête ici et repart avec les nouveaux réglages.
      await stopSeriesFrom(session.seriesId, session.date)
      await createSeries(data)
    } else if (session?.id !== undefined) {
      // Une séance « pas faite » déplacée dans le futur redevient prévue.
      const reopen = session.status === 'manquee' && sessionEnd(data) > new Date()
      await db.sessions.update(session.id, reopen ? { ...data, status: 'prevue' } : data)
    } else if (repeat) {
      await createSeries(data)
    } else {
      await db.sessions.add({ ...data, status: 'prevue', createdAt: Date.now() })
    }
    onClose()
  }

  async function remove(all = false) {
    if (all && session?.seriesId !== undefined) await stopSeriesFrom(session.seriesId, session.date)
    else if (session?.id !== undefined) await db.sessions.delete(session.id)
    onClose()
  }

  const choice = <V extends string | boolean>(label: string, value: V, options: { v: V; label: string }[], set: (v: V) => void) => (
    <div className="field">
      <span>{label}</span>
      <div className="agenda-weekswitch" role="group" aria-label={label}>
        {options.map((o) => (
          <button key={String(o.v)} type="button" aria-pressed={value === o.v} className={value === o.v ? 'chip on' : 'chip'} onClick={() => set(o.v)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <Sheet title={session ? 'Modifier la séance' : 'Ajouter une séance'} onClose={onClose}>
      <ActivityPicker value={activity} onChange={setActivity} />
      <DurationPicker value={durationMin} onChange={setDuration} />
      <label className="field" htmlFor={dateId}>
        <span>Quel jour ?</span>
        <input id={dateId} type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
      </label>
      <SlotPicker
        date={date}
        start={start}
        durationMin={durationMin}
        constraints={constraints}
        sessionBusy={sessionsBusyOn(date, others)}
        now={now}
        onChange={setStart}
      />
      {!session &&
        choice('Répéter cette séance ?', repeat, [
          { v: false, label: 'Juste cette fois' },
          { v: true, label: '🔁 Chaque semaine à partir de ce jour' },
        ], setRepeat)}
      {inSeries &&
        choice('Cette séance se répète chaque semaine. Modifier…', scope, [
          { v: 'one', label: 'Seulement celle-ci' },
          { v: 'next', label: 'Celle-ci et les suivantes' },
        ], setScope)}
      {!valid && <p className="muted agenda-small">Choisis une activité et une heure pour enregistrer.</p>}
      <button type="button" className="btn btn-block" disabled={!valid} onClick={save}>
        Enregistrer
      </button>

      {session && (
        <div className="agenda-delete">
          {confirmDelete ? (
            <div className="card card-warm">
              <p>{inSeries ? 'Cette séance se répète chaque semaine. Que veux-tu supprimer ?' : 'Supprimer cette séance de ton agenda ?'}</p>
              <div className="btn-row">
                <button type="button" className="btn btn-danger" onClick={() => void remove()}>
                  {inSeries ? 'Seulement celle-ci' : 'Oui, supprimer'}
                </button>
                {inSeries && (
                  <button type="button" className="btn btn-danger" onClick={() => void remove(true)}>
                    Celle-ci et les suivantes
                  </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>
                  Non, la garder
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost btn-block agenda-danger-text" onClick={() => setConfirmDelete(true)}>
              🗑️ Supprimer la séance
            </button>
          )}
        </div>
      )}
    </Sheet>
  )
}

// ───────────── Ressenti après la séance ─────────────
function ReviewSheet({ session, onClose }: { session: Session; onClose: () => void }) {
  const { t, tu } = useCompanion()
  const [envie, setEnvie] = useState(session.envie)
  const [motivation, setMotivation] = useState(session.motivation)
  const [plaisir, setPlaisir] = useState(session.plaisir)
  const [note, setNote] = useState(session.note ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const noteId = useId()

  async function save() {
    if (session.id === undefined) return
    const data: Partial<Session> = { status: 'faite', envie, motivation, plaisir, note: note.trim() || undefined }
    await db.sessions.update(session.id, data)
    setMessage(encouragementAfter({ ...session, ...data }, tu))
  }

  if (message) {
    return (
      <Sheet title="Séance enregistrée" onClose={onClose}>
        <div className="agenda-bravo" role="status">
          <div className="agenda-bravo-emoji" aria-hidden="true">🎉</div>
          <p>{message}</p>
        </div>
        <button type="button" className="btn btn-block" onClick={onClose}>
          Merci !
        </button>
      </Sheet>
    )
  }

  return (
    <Sheet title={`${activityEmoji(session.activity)} Ma séance ${deActivity(session.activity)}`} onClose={onClose}>
      <p className="muted">{t('Quelques secondes pour noter ton ressenti. Il n’y a pas de bonne ou de mauvaise réponse.', 'Quelques secondes pour noter votre ressenti. Il n’y a pas de bonne ou de mauvaise réponse.')}</p>
      <Scale label="Avant de commencer, j'avais envie…" value={envie} onChange={setEnvie} minLabel="Pas du tout" maxLabel="Très envie" />
      <Scale label="Ma motivation pendant la séance" value={motivation} onChange={setMotivation} minLabel="Aucune" maxLabel="À fond" />
      <Scale label="Le plaisir ressenti" value={plaisir} onChange={setPlaisir} minLabel="Aucun" maxLabel="Énorme" />
      <label className="field" htmlFor={noteId}>
        <span>Un mot sur la séance (facultatif)</span>
        <textarea id={noteId} value={note} maxLength={500} placeholder="Ce qui a aidé, ce que j'ai ressenti…" onChange={(e) => setNote(e.target.value)} />
      </label>
      <button type="button" className="btn btn-block" onClick={save}>
        Enregistrer mon ressenti
      </button>
    </Sheet>
  )
}

// ───────────── Séance pas faite ─────────────
function MissedSheet({ session, onClose, onReschedule }: { session: Session; onClose: () => void; onReschedule: () => void }) {
  const { name, t } = useCompanion()
  const navigate = useNavigate()

  async function mark() {
    if (session.id !== undefined) await db.sessions.update(session.id, { status: 'manquee' })
  }

  return (
    <Sheet title="Ça arrive" onClose={onClose}>
      <p>
        {t(
          `Ça arrive à tout le monde, et ce n'est pas un échec. ${name} aimerait comprendre avec toi ce qui s'est passé, sans jugement.`,
          `Ça arrive à tout le monde, et ce n'est pas un échec. ${name} aimerait comprendre avec vous ce qui s'est passé, sans jugement.`,
        )}
      </p>
      <div className="stack">
        <button
          type="button"
          className="btn btn-block"
          onClick={async () => {
            await mark()
            navigate(`/compagnon/parler/seance-manquee?seance=${session.id}`)
          }}
        >
          💬 En parler avec {name}
        </button>
        <button type="button" className="btn btn-secondary btn-block" onClick={onReschedule}>
          🔁 La déplacer à un autre moment
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-block"
          onClick={async () => {
            await mark()
            onClose()
          }}
        >
          Pas maintenant
        </button>
      </div>
    </Sheet>
  )
}
