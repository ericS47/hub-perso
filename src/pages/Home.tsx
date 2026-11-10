import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Task } from '../db'
import { useWeather } from '../hooks/useWeather'
import { DEFAULT_CITY, weatherIcon, weatherLabel } from '../weather'

// Données de démonstration, remplacées par Google Agenda une fois branché.
const agendaPreview = [
  { time: '09:00', label: 'Réunion équipe' },
  { time: '14:30', label: 'Séance APA' },
]

// Bulles autour de la météo, dans le sens des aiguilles d'une montre en partant du haut.
const modules = [
  { to: '/culture', label: 'Culture', icon: '🎭', color: '#b98cff' },
  { to: '/finance', label: 'Finance', icon: '📈', color: '#4fd18b' },
  { to: '/emploi', label: 'Emploi', icon: '💼', color: '#5aa9ff' },
  { to: '/promo', label: 'Promo', icon: '🏷️', color: '#ffa94d' },
  { to: '/info', label: 'Info', icon: '🌍', color: '#ff6b6b' },
  { to: '/notes', label: 'Notes', icon: '📝', color: '#e8b04a' },
]

function dayName(iso: string, index: number) {
  if (index === 1) return 'Demain'
  return new Date(`${iso}T12:00`)
    .toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
    .replace('.', '')
}

function Ring() {
  const { place, current, forecast, error } = useWeather()
  const today = forecast?.[0]
  const next = forecast?.slice(1) ?? []

  return (
    <section className="orbit" aria-label="Météo et rubriques">
      <div className="orbit-ring" aria-hidden="true" />

      <div className="orbit-center" aria-live="polite">
        <span className="oc-place">📍 {place?.name ?? DEFAULT_CITY}</span>
        {error ? (
          <span className="oc-desc">{error}</span>
        ) : !current || !today ? (
          <span className="oc-desc">Météo…</span>
        ) : (
          <>
            <span className="oc-now">
              <span className="oc-icon" aria-hidden="true">{weatherIcon(current.code)}</span>
              <span className="oc-temp">{current.temp}°</span>
            </span>
            <span className="oc-desc">{weatherLabel(current.code)}</span>
            <span className="oc-minmax">
              <b>{today.tempMax}°</b> / {today.tempMin}°
              {today.rain !== null && ` · 💧${today.rain}%`}
            </span>
            <span className="oc-days">
              {next.map((d, i) => (
                <span className="oc-day" key={d.date} title={weatherLabel(d.code)}>
                  <span className="oc-day-name">{dayName(d.date, i + 1)}</span>
                  <span className="oc-day-icon" aria-hidden="true">{weatherIcon(d.code)}</span>
                  <span>
                    <b>{d.tempMax}°</b> {d.tempMin}°
                  </span>
                </span>
              ))}
            </span>
          </>
        )}
      </div>

      <nav className="orbit-items" aria-label="Rubriques">
        {modules.map((m, i) => (
          <Link
            key={m.to}
            to={m.to}
            className="bubble"
            style={
              {
                '--c': m.color,
                '--angle': `${(360 / modules.length) * i - 90}deg`,
              } as React.CSSProperties
            }
          >
            <span className="bubble-icon" aria-hidden="true">{m.icon}</span>
            <span className="bubble-label">{m.label}</span>
          </Link>
        ))}
      </nav>
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
    setTitle('')
    await db.tasks.add({ title: clean, done: false, createdAt: Date.now() })
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

function greeting(d: Date) {
  const h = d.getHours()
  if (h < 5) return 'Bonne nuit'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export default function Home() {
  // Date figée à l'ouverture de la page : pas d'appel à Date pendant le rendu.
  const [now] = useState(() => new Date())

  return (
    <div className="home">
      <div className="brand">
        <img src={`${import.meta.env.BASE_URL}logo-m.png`} alt="" width="34" height="34" />
        <span>MAESTRO</span>
      </div>
      <header className="home-header">
        <div className="home-date">
          {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <h1>{greeting(now)} 👋</h1>
        <p className="home-tagline">Le chef d’orchestre de ton quotidien</p>
      </header>

      <Ring />
      <Agenda />
      <Tasks />
    </div>
  )
}
