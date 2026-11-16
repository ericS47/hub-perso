import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db, type JournalEntry } from '../../../db'
import { addDays, formatDay, isoDate } from '../../../lib/dates'
import { useSetting } from '../../../lib/settings'
import PageShell from '../../../ui/PageShell'
import Sheet from '../../../ui/Sheet'
import { MIN_ENTREES, observe, rdvSummary } from '../insights'
import { entryInfo } from '../labels'
import { cap, companionT, type T } from '../voice'

type Tab = 'entrees' | 'remarques'

export default function Journal() {
  const companion = useSetting('companion')
  const t = companionT(companion)
  const [tab, setTab] = useState<Tab>('entrees')
  const [toDelete, setToDelete] = useState<JournalEntry>()
  const [rdv, setRdv] = useState(false)
  const entries = useLiveQuery(() => db.journal.orderBy('createdAt').reverse().toArray(), [])

  if (!companion || !entries) return null

  async function remove(e: JournalEntry) {
    if (e.id === undefined) return
    await db.journal.delete(e.id)
    if (e.sessionId) {
      const s = await db.sessions.get(e.sessionId)
      if (s?.journalId === e.id) await db.sessions.update(e.sessionId, { journalId: undefined })
    }
    setToDelete(undefined)
  }

  return (
    <PageShell title="Mon journal" subtitle={t('Ce que tu as confié, gardé sur ton téléphone.', 'Ce que vous avez confié, gardé sur votre téléphone.')} backTo="/compagnon">
      <div className="compagnon-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'entrees'} className={tab === 'entrees' ? 'chip on' : 'chip'} onClick={() => setTab('entrees')}>
          📖 Mes entrées
        </button>
        <button type="button" role="tab" aria-selected={tab === 'remarques'} className={tab === 'remarques' ? 'chip on' : 'chip'} onClick={() => setTab('remarques')}>
          🔎 Ce que je remarque
        </button>
      </div>

      <button type="button" className="btn btn-secondary btn-block compagnon-rdv-btn" onClick={() => setRdv(true)}>
        🗒️ Préparer mon prochain rendez-vous
      </button>

      {tab === 'entrees' ? <EntryList entries={entries} t={t} onDelete={setToDelete} /> : <Remarks entries={entries} t={t} name={companion.name} />}

      {toDelete && (
        <Sheet title="Supprimer cette entrée ?" onClose={() => setToDelete(undefined)}>
          <p>{t('Elle sera effacée de ton téléphone, sans retour possible.', 'Elle sera effacée de votre téléphone, sans retour possible.')}</p>
          <div className="btn-row">
            <button type="button" className="btn btn-danger" onClick={() => void remove(toDelete)}>
              Supprimer
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setToDelete(undefined)}>
              Annuler
            </button>
          </div>
        </Sheet>
      )}
      {rdv && <RdvSheet t={t} onClose={() => setRdv(false)} />}
    </PageShell>
  )
}

function EntryList({ entries, t, onDelete }: { entries: JournalEntry[]; t: T; onDelete: (e: JournalEntry) => void }) {
  if (!entries.length) {
    return (
      <div className="card card-soft">
        <p>{t('Ton journal est encore vide. Chaque conversation avec ton compagnon y sera gardée.', 'Votre journal est encore vide. Chaque conversation avec votre compagnon y sera gardée.')}</p>
        <Link to="/compagnon" className="btn">
          Parler maintenant
        </Link>
      </div>
    )
  }
  const groups = new Map<string, JournalEntry[]>()
  for (const e of entries) {
    const d = isoDate(new Date(e.createdAt))
    groups.set(d, [...(groups.get(d) ?? []), e])
  }
  const today = isoDate()
  const label = (d: string) => (d === today ? 'Aujourd’hui' : d === addDays(today, -1) ? 'Hier' : cap(formatDay(d)))

  return (
    <div>
      {[...groups.entries()].map(([d, list]) => (
        <section key={d} className="compagnon-day">
          <h2 className="compagnon-day-title">{label(d)}</h2>
          {list.map((e) => {
            const info = entryInfo(e)
            const heure = new Date(e.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            const apercu = e.answers.find((a) => a.answer.length > 0)?.answer
            return (
              <details key={e.id} className="card compagnon-entry">
                <summary>
                  <span className="compagnon-entry-emoji" aria-hidden="true">{info.emoji}</span>
                  <span className="compagnon-entry-main">
                    <strong>{info.label}</strong>
                    <span className="muted">
                      {heure}
                      {apercu ? ` · ${apercu}` : ''}
                    </span>
                  </span>
                </summary>
                <dl className="compagnon-qa">
                  {e.answers.map((a, i) => (
                    <div key={i}>
                      <dt>{a.question}</dt>
                      <dd>{a.answer}</dd>
                    </div>
                  ))}
                  {e.emotions.length > 0 && !e.answers.some((a) => a.question.startsWith('Émotions')) && (
                    <div>
                      <dt>Émotions</dt>
                      <dd>{e.emotions.join(', ')}</dd>
                    </div>
                  )}
                </dl>
                {!e.answers.length && <p className="muted">Aucune réponse notée.</p>}
                <button type="button" className="btn btn-ghost compagnon-delete" onClick={() => onDelete(e)}>
                  🗑️ Supprimer
                </button>
              </details>
            )
          })}
        </section>
      ))}
    </div>
  )
}

function Remarks({ entries, t, name }: { entries: JournalEntry[]; t: T; name: string }) {
  const since = Date.now() - 60 * 86400000
  const moods = useLiveQuery(() => db.moods.where('date').aboveOrEqual(addDays(isoDate(), -13)).toArray(), [])
  if (!moods) return null
  const recent = entries.filter((e) => e.createdAt >= since)
  const { observations, manque } = observe(recent, moods, t)

  return (
    <div>
      <p className="muted">
        {t(
          `Ce que ${name} remarque dans ton journal des deux derniers mois. Ce sont de simples calculs sur ce que tu as noté, pas un avis médical. Si quelque chose te parle, tu peux en discuter avec ton soignant.`,
          `Ce que ${name} remarque dans votre journal des deux derniers mois. Ce sont de simples calculs sur ce que vous avez noté, pas un avis médical. Si quelque chose vous parle, vous pouvez en discuter avec votre soignant.`,
        )}
      </p>
      {observations.length ? (
        observations.map((o, i) => (
          <div key={i} className="card compagnon-obs">
            <span aria-hidden="true">{o.emoji}</span>
            <p>{o.text}</p>
          </div>
        ))
      ) : (
        <div className="card card-soft">
          <p>
            {t(
              `Je ne remarque encore rien de net. Il me faut au moins ${MIN_ENTREES} entrées d’un même genre pour oser une observation.`,
              `Je ne remarque encore rien de net. Il me faut au moins ${MIN_ENTREES} entrées d’un même genre pour oser une observation.`,
            )}
          </p>
        </div>
      )}
      {manque.length > 0 && (
        <p className="muted">Pas encore assez d’entrées pour : {manque.join(' ; ')}.</p>
      )}
    </div>
  )
}

function RdvSheet({ t, onClose }: { t: T; onClose: () => void }) {
  const [weeks, setWeeks] = useState(4)
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState(false)
  const data = useLiveQuery(async () => {
    const [entries, sessions, moods] = await Promise.all([db.journal.toArray(), db.sessions.toArray(), db.moods.toArray()])
    return { entries, sessions, moods }
  }, [])
  const firstName = useSetting('firstName') ?? ''
  if (!data) return null
  const text = rdvSummary({ weeks, ...data, firstName, note })

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  async function share() {
    try {
      await navigator.share({ title: 'Mon résumé', text })
    } catch {
      /* partage annulé */
    }
  }

  return (
    <Sheet title="Préparer mon prochain rendez-vous" onClose={onClose}>
      <p className="muted">
        {t(
          'Un résumé de ce que tu as noté, à montrer à ton soignant si tu le souhaites. Rien n’est envoyé sans toi.',
          'Un résumé de ce que vous avez noté, à montrer à votre soignant si vous le souhaitez. Rien n’est envoyé sans vous.',
        )}
      </p>
      <fieldset>
        <legend>Période</legend>
        <div className="chips-row">
          {[2, 4, 8].map((w) => (
            <button key={w} type="button" className={w === weeks ? 'chip on' : 'chip'} aria-pressed={w === weeks} onClick={() => setWeeks(w)}>
              {w} semaines
            </button>
          ))}
        </div>
      </fieldset>
      <label className="field">
        <span>Ce dont j’aimerais parler (facultatif)</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Une question, une difficulté, une victoire…" />
      </label>
      <pre className="compagnon-summary">{text}</pre>
      <div className="btn-row">
        <button type="button" className="btn" onClick={() => void copy()}>
          {copied ? '✓ Copié' : 'Copier'}
        </button>
        {typeof navigator.share === 'function' && (
          <button type="button" className="btn btn-secondary" onClick={() => void share()}>
            Partager
          </button>
        )}
      </div>
    </Sheet>
  )
}
