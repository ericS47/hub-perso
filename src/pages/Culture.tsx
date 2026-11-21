import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type CultureList } from '../db'
import { CATEGORIES } from '../culture/categories'
import Sheet from '../components/Sheet'

export default function Culture() {
  const counts = useLiveQuery(
    async () => {
      const items = await db.items.toArray()
      return items.reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] ?? 0) + 1
        for (const id of item.listIds) acc[`liste-${id}`] = (acc[`liste-${id}`] ?? 0) + 1
        return acc
      }, {})
    },
    [],
    {} as Record<string, number>,
  )
  const lists = useLiveQuery(() => db.lists.orderBy('createdAt').toArray(), [], [] as CultureList[])
  const [name, setName] = useState('')
  const [showLists, setShowLists] = useState(false)

  async function createList(e: React.FormEvent) {
    e.preventDefault()
    const clean = name.trim()
    if (!clean) return
    await db.lists.add({ name: clean, createdAt: Date.now() })
    setName('')
  }

  return (
    <div>
      <header className="page-head culture-head">
        <div>
          <h1>Culture</h1>
          <p className="muted">Ta bibliothèque par catégorie</p>
        </div>
        {/* Listes perso : rangées derrière une icône pour alléger la page. */}
        <button
          type="button"
          className="icon-btn lists-btn"
          onClick={() => setShowLists(true)}
          aria-label="Mes listes perso"
          title="Mes listes perso"
        >
          📝
          {lists.length > 0 && <span className="icon-badge">{lists.length}</span>}
        </button>
      </header>

      <div className="category-grid">
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            // Jeux de société : page d'entrée (bibliothèque ou feuille de route).
            to={c.id === 'jeux-societe' ? '/culture/jeux' : `/culture/${c.id}`}
            className="card category-card"
          >
            <span className="category-icon" aria-hidden="true">{c.icon}</span>
            <strong>{c.label}</strong>
            <span className="muted">{counts[c.id] ?? 0} élément(s)</span>
          </Link>
        ))}
      </div>

      {showLists && (
        <Sheet title="📝 Mes listes perso" onClose={() => setShowLists(false)}>
          <form className="task-form" onSubmit={createList}>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nouvelle liste (ex. Vacances)"
              aria-label="Nouvelle liste"
            />
            <button type="submit" className="btn">
              Créer
            </button>
          </form>
          {lists.length === 0 ? (
            <p className="muted">Aucune liste pour l'instant.</p>
          ) : (
            <ul className="match-list">
              {lists.map((l) => (
                <li key={l.id}>
                  <Link to={`/culture/liste/${l.id}`} className="match-row">
                    <span className="match-icon" aria-hidden="true">📝</span>
                    <span className="match-text">
                      <strong>{l.name}</strong>
                      <span className="muted small-text">{counts[`liste-${l.id}`] ?? 0} œuvre(s)</span>
                    </span>
                    <span className="match-go">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      )}
    </div>
  )
}
