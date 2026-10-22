import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Task } from '../db'
import { useWeather } from '../hooks/useWeather'
import { DEFAULT_CITY, weatherIcon } from '../weather'

// Données de démonstration, remplacées par Google Agenda une fois branché.
const agendaPreview = [
  { time: '09:00', label: 'Réunion équipe' },
  { time: '14:30', label: 'Séance APA' },
]

// Pastilles autour de la météo : position sur le cercle (cf. maquette F).
const modules = [
  { to: '/culture', label: 'Culture', color: '#a78bfa', pos: 1 },
  { to: '/finance', label: 'Finance', color: '#34d399', pos: 2 },
  { to: '/info', label: 'Info', color: '#f87171', pos: 3 },
  { to: '/emploi', label: 'Emploi', color: '#60a5fa', pos: 4 },
  { to: '/promo', label: 'Promo', color: '#fb923c', pos: 5 },
]

function Ring() {
  const { place, forecast, error, locating, locate } = useWeather()
  const today = forecast?.[0]
  const tomorrow = forecast?.[1]

  return (
    <div className="ring">
      <div className="ring-outline" aria-hidden="true" />

      <div className="ring-center">
        <span className="ring-place">{place?.name ?? DEFAULT_CITY}</span>
        {error ? (
          <span className="muted small-text">{error}</span>
        ) : (
          <>
            <span className="ring-temp">
              {today ? `${today.tempMax}°` : '…'}
              {today && <span className="ring-icon" aria-hidden="true">{weatherIcon(today.code)}</span>}
            </span>
            {tomorrow && <span className="ring-tomorrow">Demain {tomorrow.tempMax}°</span>}
          </>
        )}
        <button type="button" className="ring-locate" onClick={locate} disabled={locating}>
          {locating ? '…' : 'Me localiser'}
        </button>
      </div>

      {modules.map((m) => (
        <Link
          key={m.to}
          to={m.to}
          className={`ring-item ring-pos-${m.pos}`}
          style={{ '--c': m.color } as React.CSSProperties}
        >
          {m.label}
        </Link>
      ))}
    </div>
  )
}

function Agenda() {
  return (
    <section className="card">
      <h2>Agenda du jour</h2>
      <ul className="plain-list">
        {agendaPreview.map((e) => (
          <li key={e.time}>
            <span className="muted">{e.time}</span> {e.label}
          </li>
        ))}
      </ul>
    </section>
  )
}

function Tasks() {
  const [title, setTitle] = useState('')
  const tasks = useLiveQuery(() => db.tasks.orderBy('createdAt').toArray(), [], [] as Task[])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    const clean = title.trim()
    if (!clean) return
    await db.tasks.add({ title: clean, done: false, createdAt: Date.now() })
    setTitle('')
  }

  async function toggle(task: Task) {
    if (task.id === undefined) return
    await db.tasks.update(task.id, { done: !task.done })
  }

  async function remove(task: Task) {
    if (task.id === undefined) return
    await db.tasks.delete(task.id)
  }

  const open = tasks.filter((t) => !t.done)

  return (
    <section className="card">
      <h2>À faire ({open.length})</h2>
      <form className="task-form" onSubmit={add}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nouvelle tâche"
          aria-label="Nouvelle tâche"
        />
        <button type="submit" className="btn">Ajouter</button>
      </form>
      <ul className="plain-list">
        {tasks.map((t) => (
          <li key={t.id} className="task-item">
            <label>
              <input type="checkbox" checked={t.done} onChange={() => toggle(t)} />
              <span className={t.done ? 'done' : ''}>{t.title}</span>
            </label>
            <button className="link-btn" onClick={() => remove(t)} aria-label="Supprimer">
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function Home() {
  // Date figée à l'ouverture de la page : pas d'appel à Date pendant le rendu.
  const [now] = useState(() => new Date())

  return (
    <div className="home">
      <header className="home-header">
        <div className="home-date">
          {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <h1>Bonjour</h1>
      </header>

      <Ring />
      <Agenda />
      <Tasks />
    </div>
  )
}
