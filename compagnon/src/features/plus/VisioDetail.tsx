import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageShell from '../../ui/PageShell'
import Sheet from '../../ui/Sheet'
import ProAvatar from './ProAvatar'
import { db } from '../../db'
import { DAY_NAMES, addDays, formatDay, isoDate, parseIso, weekday } from '../../lib/dates'
import { findPro, proName } from './pros'
import { findSeance, type Seance } from './seances'

// Les 14 prochains jours, à partir d'aujourd'hui.
function nextDays(): string[] {
  const today = isoDate()
  return Array.from({ length: 14 }, (_, i) => addDays(today, i))
}

function dayLabel(iso: string, i: number): string {
  if (i === 0) return 'Aujourd’hui'
  if (i === 1) return 'Demain'
  return parseIso(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function AddSheet({ seance, onClose }: { seance: Seance; onClose: () => void }) {
  const days = nextDays()
  // Par défaut : le prochain jour du planning d'exemple, à son heure.
  const firstMatch = days.find((d) => seance.exemple.some((e) => e.jour === weekday(d))) ?? days[0]
  const [date, setDate] = useState(firstMatch)
  const [start, setStart] = useState(seance.exemple.find((e) => e.jour === weekday(firstMatch))?.heure ?? '10:00')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  async function add() {
    setBusy(true)
    await db.sessions.add({
      date,
      start,
      durationMin: seance.duree,
      activity: seance.activite,
      status: 'prevue',
      createdAt: Date.now(),
    })
    setBusy(false)
    setSaved(true)
  }

  if (saved) {
    return (
      <Sheet title="C’est dans ton agenda" onClose={onClose}>
        <p className="plus-noted" role="status">
          ✓ {seance.activite} ajouté le {formatDay(date)} à {start.replace(':', ' h ')}.
        </p>
        <p className="muted">Pense à évaluer ta séance une fois faite : envie, motivation, plaisir.</p>
        <div className="stack">
          <Link to="/agenda" className="btn btn-block">Ouvrir mon agenda</Link>
          <button type="button" className="btn btn-secondary btn-block" onClick={onClose}>Rester ici</button>
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet title="Ajouter à mon agenda" onClose={onClose}>
      <p className="muted">{seance.activite} · {seance.duree} min environ</p>
      <fieldset>
        <legend>Quel jour ?</legend>
        <div className="plus-days" role="radiogroup" aria-label="Jour de la séance">
          {days.map((d, i) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={d === date}
              className={d === date ? 'chip on' : 'chip'}
              onClick={() => setDate(d)}
            >
              {dayLabel(d, i)}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="field">
        <span>À quelle heure ?</span>
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
      </label>
      <button type="button" className="btn btn-block" disabled={busy || !start} onClick={() => void add()}>
        Ajouter le {formatDay(date)}
      </button>
    </Sheet>
  )
}

export default function VisioDetail() {
  const { id } = useParams()
  const seance = findSeance(id)
  const [open, setOpen] = useState(false)

  if (!seance) {
    return (
      <PageShell title="Séance introuvable" backTo="/plus/visio">
        <p>Cette séance n’existe pas ou plus.</p>
      </PageShell>
    )
  }

  const pro = findPro(seance.proId)
  const planning = [...seance.exemple].sort((a, b) => a.jour - b.jour || a.heure.localeCompare(b.heure))

  return (
    <PageShell title={seance.activite} subtitle={seance.description} backTo="/plus/visio">
      <div className="plus-facts">
        <span className="badge">⏱ {seance.duree} min environ</span>
        <span className="badge">📶 {seance.niveau}</span>
      </div>

      <section className="card">
        <h2>Pour qui ?</h2>
        <p>{seance.pourQui}</p>
        <h3>Précautions</h3>
        <ul className="plus-list">
          {seance.precautions.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Matériel</h2>
        <ul className="plus-checks">
          {seance.materiel.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <div className="row-between">
          <h2>Planning de la semaine</h2>
          <span className="badge badge-warm">Exemple</span>
        </div>
        <p className="muted">Horaires donnés à titre d’exemple : le vrai planning sera communiqué plus tard.</p>
        <ul className="plus-planning">
          {planning.map((e) => (
            <li key={`${e.jour}-${e.heure}`}>
              <span>{DAY_NAMES[e.jour]}</span>
              <strong>{e.heure.replace(':', ' h ')}</strong>
            </li>
          ))}
        </ul>
      </section>

      {pro && (
        <Link to={`/plus/pros/${pro.id}`} className="card plus-entry">
          <ProAvatar pro={pro} size={40} />
          <span className="plus-entry-text">
            <strong>Avec {proName(pro)}</strong>
            <span className="muted">Voir la présentation</span>
          </span>
          <span className="plus-chevron" aria-hidden="true">›</span>
        </Link>
      )}

      <p className="demo-note" role="note">
        <strong>Aperçu :</strong> cette fonction n’est pas encore active. La visio ouvrira ici quand elle sera prête.
      </p>
      <div className="stack">
        <button type="button" className="btn btn-block" disabled aria-describedby="plus-visio-off">
          📺 Rejoindre la visio
        </button>
        <p id="plus-visio-off" className="muted plus-center">Pas encore disponible</p>
        <button type="button" className="btn btn-secondary btn-block" onClick={() => setOpen(true)}>
          📅 Ajouter à mon agenda
        </button>
      </div>

      {open && <AddSheet seance={seance} onClose={() => setOpen(false)} />}
    </PageShell>
  )
}
