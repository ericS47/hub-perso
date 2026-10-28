import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type CultureItem, type CultureList } from '../db'
import { CATEGORIES, categoryOf } from '../culture/categories'
import ItemCard from '../components/ItemCard'

type Filter = 'all' | 'priority' | 'unseen' | 'seen'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'priority', label: 'Priorité' },
  { id: 'unseen', label: 'Pas vus' },
  { id: 'seen', label: 'Vus' },
]

export default function Library() {
  const { category, listId } = useParams()
  const isList = listId !== undefined
  const cat = categoryOf(category)
  const numericListId = Number(listId)

  const list = useLiveQuery(
    () => (isList ? db.lists.get(numericListId) : undefined),
    [listId],
  ) as CultureList | undefined

  const lists = useLiveQuery(() => db.lists.orderBy('createdAt').toArray(), [], [] as CultureList[])

  const items = useLiveQuery(
    () =>
      isList
        ? db.items.where('listIds').equals(numericListId).toArray()
        : db.items.where('category').equals(category ?? '').toArray(),
    [category, listId],
    [] as CultureItem[],
  )

  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [title, setTitle] = useState('')
  const [cover, setCover] = useState('')

  const visible = items
    .filter((i) => {
      if (filter === 'priority') return i.priority
      if (filter === 'unseen') return !i.seen
      if (filter === 'seen') return i.seen
      return true
    })
    .filter((i) => i.title.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => Number(b.priority) - Number(a.priority) || b.createdAt - a.createdAt)

  async function add(e: React.FormEvent) {
    e.preventDefault()
    const clean = title.trim()
    if (!clean || !cat) return
    const coverUrl = cover.trim() || undefined
    // Formulaire vidé avant l'écriture : une saisie rapide suivante n'est pas effacée.
    setTitle('')
    setCover('')
    await db.items.add({
      title: clean,
      category: cat.id,
      cover: coverUrl,
      seen: false,
      priority: false,
      listIds: [],
      createdAt: Date.now(),
    })
  }

  if (!isList && !cat) {
    return (
      <section className="card">
        <h1>Catégorie inconnue</h1>
        <Link to="/culture">Retour à la culture</Link>
      </section>
    )
  }

  const heading = isList ? list?.name ?? 'Liste' : cat?.label ?? ''
  const icon = isList ? '📝' : CATEGORIES.find((c) => c.id === category)?.icon

  return (
    <div>
      <Link to="/culture" className="back-link">← Culture</Link>
      <header className="page-head">
        <h1>
          <span aria-hidden="true">{icon} </span>
          {heading}
        </h1>
        <p className="muted">{items.length} élément(s)</p>
      </header>

      {!isList && (
        <section className="card">
          <form className="add-form" onSubmit={add}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre"
              aria-label="Titre"
              required
            />
            <input
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              placeholder="Lien de la couverture (facultatif)"
              aria-label="Lien de la couverture"
              type="url"
            />
            <button type="submit" className="btn">Ajouter</button>
          </form>
        </section>
      )}

      <div className="library-tools">
        <input
          className="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher"
          aria-label="Rechercher"
        />
        <div className="filters" role="group" aria-label="Filtrer">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={filter === f.id ? 'chip active' : 'chip'}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="muted">Rien à afficher pour ce filtre.</p>
      ) : (
        <div className="item-grid">
          {visible.map((i) => (
            <ItemCard key={i.id} item={i} lists={lists} />
          ))}
        </div>
      )}
    </div>
  )
}
