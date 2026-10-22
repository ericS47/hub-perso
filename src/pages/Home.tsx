import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Task } from '../db'
import {
  DEFAULT_CITY,
  fetchForecast,
  geocodeCity,
  getPosition,
  weatherIcon,
  type Coords,
  type DayForecast,
} from '../weather'

// Données de démonstration, remplacées par Google Agenda en phase 1 (étape suivante).
const agendaPreview = [
  { time: '09:00', label: 'Réunion équipe' },
  { time: '14:30', label: 'Séance APA' },
]

const dayLabels = ["Aujourd'hui", 'Demain', 'Après-demain']

function Weather() {
  const [place, setPlace] = useState<Coords | null>(null)
  const [forecast, setForecast] = useState<DayForecast[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const coords = await geocodeCity(DEFAULT_CITY)
        if (!coords) throw new Error('Ville introuvable')
        if (cancelled) return
        setPlace(coords)
        setForecast(await fetchForecast(coords.lat, coords.lon))
      } catch {
        if (!cancelled) setError('Météo indisponible')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function locate() {
    setLocating(true)
    setError(null)
    try {
      const pos = await getPosition()
      const { latitude: lat, longitude: lon } = pos.coords
      setPlace({ lat, lon, name: 'Ma position' })
      setForecast(await fetchForecast(lat, lon))
    } catch {
      setError('Localisation refusée ou indisponible')
    } finally {
      setLocating(false)
    }
  }

  return (
    <section className="card weather">
      <div className="weather-head">
        <h2>Météo · {place?.name ?? DEFAULT_CITY}</h2>
        <button className="link-btn-primary small" onClick={locate} disabled={locating}>
          {locating ? '…' : 'Me localiser'}
        </button>
      </div>
      {error && <p className="muted">{error}</p>}
      {!error && !forecast && <p className="muted">Chargement…</p>}
      {forecast && (
        <div className="weather-row">
          {forecast.map((d, i) => (
            <div key={d.date} className="weather-day">
              <span className="muted">{dayLabels[i]}</span>
              <span className="weather-icon" aria-hidden="true">{weatherIcon(d.code)}</span>
              <strong>{d.tempMax}° / {d.tempMin}°</strong>
            </div>
          ))}
        </div>
      )}
    </section>
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
      <h2>Tâches ({open.length})</h2>
      <form className="task-form" onSubmit={add}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nouvelle tâche"
          aria-label="Nouvelle tâche"
        />
        <button type="submit">Ajouter</button>
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
  return (
    <div className="home">
      <header className="home-header">
        <h1>Bonjour</h1>
        <p className="muted">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </header>
      <Agenda />
      <Tasks />
      <Weather />
    </div>
  )
}
