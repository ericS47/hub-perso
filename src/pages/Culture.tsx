import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type CultureList } from '../db'
import { CATEGORIES } from '../culture/categories'

export default function Culture() {
  const counts = useLiveQuery(
    async () => {
      const items = await db.items.toArray()
      return items.reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] ?? 0) + 1
        return acc
      }, {})
    },
    [],
    {} as Record<string, number>,
  )
  const lists = useLiveQuery(() => db.lists.orderBy('createdAt').toArray(), [], [] as CultureList[])
  const [name, setName] = useState('')

  async function createList(e: React.FormEvent) {
    e.preventDefault()
    const clean = name.trim()
    if (!clean) return
    await db.lists.add({ name: clean, createdAt: Date.now() })
    setName('')
  }

  return (
    <div>
      <header className="page-head">
        <h1>Culture</h1>
        <p className="muted">Ta bibliothèque par catégorie</p>
      </header>

      <div className="category-grid">
        {CATEGORIES.map((c) => (
          <Link key={c.id} to={`/culture/${c.id}`} className="card category-card">
            <span className="category-icon" aria-hidden="true">{c.icon}</span>
            <strong>{c.label}</strong>
            <span className="muted">{counts[c.id] ?? 0} élément(s)</span>
          </Link>
        ))}
      </div>

      <section className="card">
        <h2>Mes listes perso</h2>
        <form className="task-form" onSubmit={createList}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nouvelle liste (ex. Vacances)"
            aria-label="Nouvelle liste"
          />
          <button type="submit" className="btn">Créer</button>
        </form>
        {lists.length === 0 ? (
          <p className="muted">Aucune liste pour l'instant.</p>
        ) : (
          <ul className="plain-list">
            {lists.map((l) => (
              <li key={l.id}>
                <Link to={`/culture/liste/${l.id}`}>{l.name}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
