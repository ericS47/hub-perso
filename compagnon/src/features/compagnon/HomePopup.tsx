import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db, type CompanionSettings, type Session } from '../../db'
import { addDays, isoDate } from '../../lib/dates'
import Sheet from '../../ui/Sheet'
import { sortSessions } from '../agenda/hooks'
import { activityEmoji, displayState, relativeDay, timeRange } from '../agenda/lib'
import { DoneButtons, SessionFlow, type FlowMode } from '../agenda/Sheets'
import Avatar from './Avatar'
import { alreadySeen, markSeen, SUJETS } from './sujets'
import { companionT, dayMoment } from './voice'

type View = 'menu' | 'aborder' | 'noter' | 'redefinir'

const CASES: { view: Exclude<View, 'menu'>; icon: string; title: string; text: string }[] = [
  { view: 'aborder', icon: '💬', title: 'Aborder', text: 'Me faire part de quelque chose' },
  { view: 'noter', icon: '✅', title: 'Noter', text: 'Mon moral du jour, une séance faite' },
  { view: 'redefinir', icon: '🧭', title: 'Redéfinir', text: 'Ajuster une séance, mes objectifs…' },
]

interface Props {
  companion: CompanionSettings
  firstName: string
  hasMood: boolean
}

// Fenêtre d'ouverture (une fois par ouverture de l'appli) : le compagnon salue et propose son aide,
// l'accueil reste visible derrière.
export default function HomePopup({ companion, firstName, hasMood }: Props) {
  const [open, setOpen] = useState(() => !alreadySeen())
  const [view, setView] = useState<View>('menu')
  const [flow, setFlow] = useState<{ session: Session; mode: FlowMode } | null>(null)
  const today = isoDate()
  // Séances du jour ou passées à compléter (4 dernières semaines).
  const toValidate = useLiveQuery(
    async () =>
      sortSessions(await db.sessions.where('status').equals('prevue').filter((s) => s.date >= addDays(today, -28) && s.date <= today).toArray()).filter(
        (s) => displayState(s, new Date()) !== 'prevue',
      ),
    [today],
  )
  if (!open) return null

  const t = companionT(companion)
  const close = () => {
    markSeen()
    setOpen(false)
  }
  const moment = dayMoment()
  const salut = moment === 'soir' || moment === 'nuit' ? 'Bonsoir' : 'Bonjour'
  const prenom = firstName.trim() ? ` ${firstName.trim()}` : ''
  const caseInfo = CASES.find((c) => c.view === view)

  const item = (key: string, to: string, icon: string, label: string) => (
    <Link key={key} to={to} className="compagnon-topic" onClick={markSeen}>
      <span className="compagnon-topic-emoji" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </Link>
  )

  return (
    <Sheet title={`${salut}${prenom}, ${t('content de te revoir', 'content de vous revoir')} !`} onClose={close}>
      <div className="compagnon-open-head">
        <Avatar companion={companion} size={84} mood="content" />
        <p className="compagnon-open-question">{caseInfo ? `${caseInfo.icon} ${caseInfo.title}` : t('Que puis-je faire pour toi ?', 'Que puis-je faire pour vous ?')}</p>
      </div>

      {view === 'menu' && (
        <div className="compagnon-open-cases">
          {CASES.map((c) => (
            <button key={c.view} type="button" className="compagnon-open-case" onClick={() => setView(c.view)}>
              <span className="compagnon-open-icon" aria-hidden="true">{c.icon}</span>
              <span>
                <strong>{c.title}</strong>
                <span className="muted">{c.text}</span>
              </span>
              <span aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      )}

      {view === 'aborder' && <nav className="compagnon-topics" aria-label="De quoi parler">{SUJETS.map((s) => item(s.to, `/compagnon/parler/${s.to}`, s.emoji, s.label))}</nav>}

      {view === 'noter' && (
        <div className="compagnon-topics">
          {hasMood ? (
            <p className="compagnon-open-done">🌤️ Ta météo du jour est déjà notée. Merci !</p>
          ) : (
            item('meteo', '/compagnon/meteo', '🌤️', 'Mon moral du jour')
          )}
          {(toValidate ?? []).map((s) => (
            <div key={s.id} className="card compagnon-open-session">
              <p>
                <span aria-hidden="true">{activityEmoji(s.activity)} </span>
                <strong>{s.activity}</strong>
                <br />
                <span className="muted">
                  {relativeDay(s.date, today).replace(/^./, (c) => c.toUpperCase())}, {timeRange(s)}
                </span>
              </p>
              <DoneButtons compact onPick={(mode) => setFlow({ session: s, mode })} />
            </div>
          ))}
          {toValidate && toValidate.length === 0 && item('seance', '/agenda', '🏃', 'Noter une séance faite (dans mon agenda)')}
        </div>
      )}

      {view === 'redefinir' && (
        <nav className="compagnon-topics" aria-label="Redéfinir">
          {item('agenda', '/agenda', '📅', 'Déplacer ou modifier une séance')}
          {item('semaine', '/agenda/planifier', '🗓️', 'Préparer ma semaine')}
          {item('objectifs', '/profil/attentes', '🎯', 'Revoir mes objectifs')}
          {item('profil', '/profil', '🙂', 'Mettre à jour mon profil')}
        </nav>
      )}

      {view === 'menu' ? (
        <button type="button" className="btn btn-ghost btn-block" onClick={close}>
          Passer
        </button>
      ) : (
        <button type="button" className="btn btn-ghost btn-block" onClick={() => setView('menu')}>
          ← Retour
        </button>
      )}

      {/* Séance validée depuis la fenêtre : son panneau s'ouvre par-dessus, puis tout se referme. */}
      {flow && (
        <SessionFlow
          session={flow.session}
          mode={flow.mode}
          onMode={(mode) => {
            if (mode) setFlow({ ...flow, mode })
            else {
              setFlow(null)
              close()
            }
          }}
        />
      )}
    </Sheet>
  )
}
