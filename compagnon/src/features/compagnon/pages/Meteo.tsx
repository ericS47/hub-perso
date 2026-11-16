import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db, type CompanionSettings, type MoodCheck } from '../../../db'
import { addDays, DAY_SHORT, isoDate, weekday } from '../../../lib/dates'
import { useSetting } from '../../../lib/settings'
import PageShell from '../../../ui/PageShell'
import Scale from '../../../ui/Scale'
import Avatar from '../Avatar'
import SafetyCard from '../SafetyCard'
import { moralInquietant } from '../safety'
import { companionT, pick, type T } from '../voice'

function weatherIcon(moral: number): string {
  if (moral >= 8) return '☀️'
  if (moral >= 6) return '🌤️'
  if (moral >= 4) return '⛅'
  if (moral >= 2) return '🌧️'
  return '⛈️'
}

function reaction(m: Pick<MoodCheck, 'moral' | 'fatigue' | 'stress'>, t: T): string {
  if (m.moral <= 4)
    return pick([
      t('Merci de l’avoir noté. Le ciel est un peu gris aujourd’hui : si tu veux en parler, je suis là.', 'Merci de l’avoir noté. Le ciel est un peu gris aujourd’hui : si vous voulez en parler, je suis là.'),
      t('C’est une journée plus difficile. Prends soin de toi aujourd’hui, en douceur.', 'C’est une journée plus difficile. Prenez soin de vous aujourd’hui, en douceur.'),
    ])
  if (m.stress >= 7)
    return t('Beaucoup de stress aujourd’hui. Quelques respirations lentes peuvent aider à relâcher un peu la pression.', 'Beaucoup de stress aujourd’hui. Quelques respirations lentes peuvent aider à relâcher un peu la pression.')
  if (m.fatigue >= 7)
    return t('La fatigue est bien là. Écouter son corps, c’est aussi savoir lever le pied.', 'La fatigue est bien là. Écouter son corps, c’est aussi savoir lever le pied.')
  if (m.moral >= 7)
    return pick([
      t('Belle météo aujourd’hui ! Profite de ce rayon de soleil.', 'Belle météo aujourd’hui ! Profitez de ce rayon de soleil.'),
      t('Ça fait plaisir à voir. Qu’est-ce qui t’aide aujourd’hui ? Garde-le en tête.', 'Ça fait plaisir à voir. Qu’est-ce qui vous aide aujourd’hui ? Gardez-le en tête.'),
    ])
  return t('Merci pour ta météo du jour. Noter comment on va, c’est déjà prendre soin de soi.', 'Merci pour votre météo du jour. Noter comment on va, c’est déjà prendre soin de soi.')
}

// Météo intérieure : un check-in par jour (modifiable), et la courbe des 14 derniers jours.
export default function Meteo() {
  const companion = useSetting('companion')
  const t = companionT(companion)
  const today = isoDate()
  const existing = useLiveQuery(() => db.moods.where('date').equals(today).first().then((m) => m ?? null), [today])
  const history = useLiveQuery(() => db.moods.where('date').aboveOrEqual(addDays(today, -13)).toArray(), [today])

  if (!companion || existing === undefined || !history) return null
  return <CheckIn companion={companion} existing={existing} history={history} today={today} t={t} />
}

const now = () => Date.now()

function CheckIn({ companion, existing, history, today, t }: { companion: CompanionSettings; existing: MoodCheck | null; history: MoodCheck[]; today: string; t: T }) {
  // Pré-rempli avec la météo du jour si elle existe déjà.
  const [moral, setMoral] = useState<number | undefined>(existing?.moral)
  const [fatigue, setFatigue] = useState<number | undefined>(existing?.fatigue)
  const [stress, setStress] = useState<number | undefined>(existing?.stress)
  const [saved, setSaved] = useState<string>()
  const complete = moral !== undefined && fatigue !== undefined && stress !== undefined

  async function save() {
    if (moral === undefined || fatigue === undefined || stress === undefined) return
    const row: MoodCheck = { date: today, moral, fatigue, stress, createdAt: existing?.createdAt ?? now() }
    if (existing?.id !== undefined) await db.moods.put({ ...row, id: existing.id })
    else await db.moods.add(row)
    setSaved(reaction({ moral, fatigue, stress }, t))
  }

  return (
    <PageShell title="Ma météo intérieure" subtitle={t('Comment tu vas aujourd’hui ? Ça prend 20 secondes.', 'Comment allez-vous aujourd’hui ? Ça prend 20 secondes.')} backTo="/compagnon">
      <div className="card">
        {existing && !saved && <p className="badge">{t('Déjà notée aujourd’hui : tu peux la modifier', 'Déjà notée aujourd’hui : vous pouvez la modifier')}</p>}
        <Scale label={`${moral !== undefined ? weatherIcon(moral) + ' ' : ''}Mon moral`} value={moral} onChange={(v) => { setMoral(v); setSaved(undefined) }} minLabel="Au plus bas" maxLabel="Au top" />
        <Scale label="Ma fatigue" value={fatigue} onChange={(v) => { setFatigue(v); setSaved(undefined) }} minLabel="Aucune" maxLabel="Épuisement" />
        <Scale label="Mon stress" value={stress} onChange={(v) => { setStress(v); setSaved(undefined) }} minLabel="Serein" maxLabel="Au maximum" />
        <button type="button" className="btn btn-block" disabled={!complete} onClick={() => void save()}>
          {existing ? 'Mettre à jour' : 'Enregistrer'}
        </button>
      </div>

      {saved && moral !== undefined && (
        <div className="compagnon-react" aria-live="polite">
          <div className="row">
            <Avatar companion={companion} size={56} mood={moral <= 4 ? 'attentif' : 'content'} />
            <p className="compagnon-bubble them">{saved}</p>
          </div>
          {moralInquietant(moral) ? (
            <div className="card card-warm">
              <p>
                {t(
                  'Ton moral est vraiment au plus bas aujourd’hui. Je ne suis qu’une application, mais des personnes peuvent t’écouter tout de suite, gratuitement, jour et nuit. N’hésite pas, même juste pour parler. Tu peux aussi prévenir ton soignant ou un proche.',
                  'Votre moral est vraiment au plus bas aujourd’hui. Je ne suis qu’une application, mais des personnes peuvent vous écouter tout de suite, gratuitement, jour et nuit. N’hésitez pas, même juste pour parler. Vous pouvez aussi prévenir votre soignant ou un proche.',
                )}
              </p>
              <SafetyCard t={t} />
            </div>
          ) : null}
          {moral <= 4 && (
            <Link to="/compagnon/parler/coup-de-mou" className="btn btn-secondary btn-block">
              En parler à {companion.name}
            </Link>
          )}
        </div>
      )}

      <MoodChart history={history} today={today} />
    </PageShell>
  )
}

const SERIES = [
  { key: 'moral', label: 'Moral', hint: 'plus haut = mieux' },
  { key: 'fatigue', label: 'Fatigue', hint: 'plus haut = plus de fatigue' },
  { key: 'stress', label: 'Stress', hint: 'plus haut = plus de stress' },
] as const

// Trois petites courbes (une par mesure) sur les 14 derniers jours ; les jours sans saisie restent vides.
function MoodChart({ history, today }: { history: MoodCheck[]; today: string }) {
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13))
  const byDate = new Map(history.map((m) => [m.date, m]))
  const W = 320
  const H = 70
  const padL = 18
  const padR = 8
  const x = (i: number) => padL + (i * (W - padL - padR)) / 13
  const y = (v: number) => 6 + ((10 - v) * (H - 12)) / 10

  if (!history.length) {
    return <p className="muted compagnon-chart-empty">Ta courbe des 14 derniers jours apparaîtra ici dès ta première météo.</p>
  }

  return (
    <section className="card compagnon-chart">
      <h2>Mes 14 derniers jours</h2>
      {SERIES.map((s) => {
        // Segments continus entre jours renseignés consécutifs.
        const segs: string[] = []
        let cur = ''
        days.forEach((d, i) => {
          const m = byDate.get(d)
          if (m) cur += `${cur ? 'L' : 'M'}${x(i).toFixed(1)} ${y(m[s.key]).toFixed(1)}`
          else if (cur) {
            segs.push(cur)
            cur = ''
          }
        })
        if (cur) segs.push(cur)
        const values = days.map((d) => byDate.get(d)?.[s.key])
        const desc = values.filter((v) => v !== undefined).join(', ')
        return (
          <figure key={s.key} className="compagnon-mini">
            <figcaption>
              <strong>{s.label}</strong> <span className="muted">({s.hint})</span>
            </figcaption>
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${s.label} sur 14 jours : ${desc}`}>
              {[0, 5, 10].map((g) => (
                <g key={g}>
                  <line x1={padL} x2={W - padR} y1={y(g)} y2={y(g)} className="compagnon-grid" />
                  <text x={0} y={y(g) + 3.5} className="compagnon-axis">{g}</text>
                </g>
              ))}
              {segs.map((d, i) => (
                <path key={i} d={d} className="compagnon-line" />
              ))}
              {days.map((d, i) => {
                const v = byDate.get(d)?.[s.key]
                return v === undefined ? null : (
                  <circle key={d} cx={x(i)} cy={y(v)} r={d === today ? 5 : 4} className={d === today ? 'compagnon-dot today' : 'compagnon-dot'}>
                    <title>{`${DAY_SHORT[weekday(d)]} ${d.slice(8)} : ${v}/10`}</title>
                  </circle>
                )
              })}
            </svg>
          </figure>
        )
      })}
      <div className="compagnon-chart-days" aria-hidden="true">
        {days.map((d, i) => (
          <span key={d} style={{ left: `${(x(i) / W) * 100}%` }}>
            {DAY_SHORT[weekday(d)].charAt(0)}
          </span>
        ))}
      </div>
    </section>
  )
}
