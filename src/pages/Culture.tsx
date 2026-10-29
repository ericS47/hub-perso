import { useCallback, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type CultureItem, type CultureList, type Ownership } from '../db'
import { CATEGORIES, categoryOf, doneLabel } from '../culture/categories'
import Coverflow from '../components/Coverflow'
import CoverImage from '../components/CoverImage'
import ItemForm from '../components/ItemForm'

type Filter = 'all' | 'priority' | 'owned' | 'wish' | 'done' | 'todo'
type View = 'carousel' | 'grid'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'priority', label: '★ Conseillés' },
  { id: 'owned', label: "Je l'ai" },
  { id: 'wish', label: 'Envie' },
  { id: 'done', label: 'Vu / lu / joué' },
  { id: 'todo', label: 'À découvrir' },
]

const VIEW_KEY = 'culture-view'

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'carousel'
  } catch {
    return 'carousel'
  }
}

function matches(item: CultureItem, filter: Filter) {
  switch (filter) {
    case 'priority':
      return item.priority
    case 'owned':
      return item.ownership === 'owned'
    case 'wish':
      return item.ownership === 'wish'
    case 'done':
      return item.seen
    case 'todo':
      return !item.seen
    default:
      return true
  }
}

// Ancienne adresse d'une liste : redirigée vers le filtre équivalent.
export function ListRedirect() {
  const { listId } = useParams()
  return <Navigate to={`/culture?liste=${listId}`} replace />
}

export default function Culture() {
  const { category } = useParams()
  const [params, setParams] = useSearchParams()
  const cat = categoryOf(category)
  const listId = params.get('liste') ? Number(params.get('liste')) : undefined

  const all = useLiveQuery(() => db.items.toArray(), [], [] as CultureItem[])
  const lists = useLiveQuery(() => db.lists.orderBy('createdAt').toArray(), [], [] as CultureList[])

  const [filter, setFilter] = useState<Filter>('all')
  const [genre, setGenre] = useState<string>()
  const [query, setQuery] = useState('')
  const [view, setView] = useState<View>(readView)
  const [centeredId, setCenteredId] = useState<number>()
  const [focusId, setFocusId] = useState<number>()
  const [editing, setEditing] = useState<CultureItem | 'new'>()

  const onCenterChange = useCallback((item: CultureItem) => setCenteredId(item.id), [])

  if (category && !cat) {
    return (
      <section className="card">
        <h1>Catégorie inconnue</h1>
        <Link to="/culture">Retour à la culture</Link>
      </section>
    )
  }

  const inTab = all.filter((i) => !cat || i.category === cat.id)
  const tabGenres = [...new Set(inTab.flatMap((i) => i.genres))].sort((a, b) => a.localeCompare(b, 'fr'))
  const allGenres = [...new Set(all.flatMap((i) => i.genres))].sort((a, b) => a.localeCompare(b, 'fr'))
  const activeGenre = genre && tabGenres.includes(genre) ? genre : undefined
  const activeList = lists.find((l) => l.id === listId)
  const q = query.trim().toLowerCase()

  // Les œuvres conseillées passent devant, puis les plus récentes.
  const visible = inTab
    .filter((i) => matches(i, filter))
    .filter((i) => !activeGenre || i.genres.includes(activeGenre))
    .filter((i) => !activeList || i.listIds.includes(activeList.id!))
    .filter((i) => !q || i.title.toLowerCase().includes(q))
    .sort((a, b) => Number(b.priority) - Number(a.priority) || b.createdAt - a.createdAt)

  const centered = visible.find((i) => i.id === centeredId) ?? visible[0]

  function changeView(v: View) {
    setView(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      // Stockage indisponible (navigation privée) : le choix vaut pour la session.
    }
  }

  function selectList(id: number | undefined) {
    const next = new URLSearchParams(params)
    if (id === undefined) next.delete('liste')
    else next.set('liste', String(id))
    setParams(next, { replace: true })
  }

  async function createList() {
    const name = window.prompt('Nom de la nouvelle liste (ex. Vacances)')?.trim()
    if (!name) return
    const id = await db.lists.add({ name, createdAt: Date.now() })
    selectList(id)
  }

  async function deleteList(list: CultureList) {
    if (!window.confirm(`Supprimer la liste « ${list.name} » ? Les œuvres sont conservées.`)) return
    await db.transaction('rw', db.items, db.lists, async () => {
      await db.items
        .where('listIds')
        .equals(list.id!)
        .modify((i) => {
          i.listIds = i.listIds.filter((x) => x !== list.id)
        })
      await db.lists.delete(list.id!)
    })
    selectList(undefined)
  }

  async function update(item: CultureItem, changes: Partial<CultureItem>) {
    if (item.id !== undefined) await db.items.update(item.id, changes)
  }

  function toggleOwnership(item: CultureItem, o: Ownership) {
    return update(item, { ownership: item.ownership === o ? 'none' : o })
  }

  const countFor = (id?: string) => (id ? all.filter((i) => i.category === id).length : all.length)
  const tabHref = (id?: string) => `/culture${id ? `/${id}` : ''}${listId ? `?liste=${listId}` : ''}`

  return (
    <div>
      <header className="page-head culture-head">
        <div>
          <h1>Culture</h1>
          <p className="muted">
            {visible.length} œuvre(s){activeList ? ` · liste « ${activeList.name} »` : ''}
          </p>
        </div>
        <div className="head-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => changeView(view === 'carousel' ? 'grid' : 'carousel')}
            aria-label={view === 'carousel' ? 'Afficher en grille' : 'Afficher en carrousel'}
            title={view === 'carousel' ? 'Afficher en grille' : 'Afficher en carrousel'}
          >
            {view === 'carousel' ? '▦' : '◫'}
          </button>
          <button type="button" className="btn" onClick={() => setEditing('new')}>
            + Ajouter
          </button>
        </div>
      </header>

      <nav className="tabs" aria-label="Types d'œuvres">
        <Link to={tabHref()} className={!cat ? 'tab active' : 'tab'} aria-current={!cat ? 'page' : undefined}>
          Tout <span className="tab-count">{countFor()}</span>
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            to={tabHref(c.id)}
            className={cat?.id === c.id ? 'tab active' : 'tab'}
            aria-current={cat?.id === c.id ? 'page' : undefined}
          >
            <span aria-hidden="true">{c.icon}</span> {c.label} <span className="tab-count">{countFor(c.id)}</span>
          </Link>
        ))}
      </nav>

      <div className="library-tools">
        <input
          className="search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un titre"
          aria-label="Rechercher un titre"
        />
        <div className="filters scroll-row" role="group" aria-label="Filtrer par statut">
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
        {tabGenres.length > 0 && (
          <div className="filters scroll-row" role="group" aria-label="Filtrer par genre">
            <button
              type="button"
              className={!activeGenre ? 'chip small active' : 'chip small'}
              onClick={() => setGenre(undefined)}
            >
              Tous genres
            </button>
            {tabGenres.map((g) => (
              <button
                key={g}
                type="button"
                className={activeGenre === g ? 'chip small active' : 'chip small'}
                aria-pressed={activeGenre === g}
                onClick={() => setGenre(activeGenre === g ? undefined : g)}
              >
                {g}
              </button>
            ))}
          </div>
        )}
        <div className="filters scroll-row" role="group" aria-label="Listes">
          {lists.map((l) => (
            <button
              key={l.id}
              type="button"
              className={activeList?.id === l.id ? 'chip small active' : 'chip small'}
              aria-pressed={activeList?.id === l.id}
              onClick={() => selectList(activeList?.id === l.id ? undefined : l.id)}
            >
              📝 {l.name}
            </button>
          ))}
          <button type="button" className="chip small" onClick={createList}>
            + Liste
          </button>
          {activeList && (
            <button type="button" className="link-btn small-link danger" onClick={() => deleteList(activeList)}>
              Supprimer la liste
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <section className="card empty">
          <p className="muted">
            {all.length === 0 ? 'Ta bibliothèque est vide pour l’instant.' : 'Rien à afficher pour ces filtres.'}
          </p>
          {all.length === 0 && (
            <button type="button" className="btn" onClick={() => setEditing('new')}>
              Ajouter une première œuvre
            </button>
          )}
        </section>
      ) : view === 'carousel' ? (
        <>
          <Coverflow items={visible} focusId={focusId} onCenterChange={onCenterChange} onOpen={setEditing} />
          {centered && (
            <section className={centered.priority ? 'card cf-info recommended' : 'card cf-info'} aria-live="polite">
              <h2 className="cf-title">{centered.title}</h2>
              <p className="muted small-text">
                {categoryOf(centered.category)?.icon} {categoryOf(centered.category)?.label}
                {centered.genres.length > 0 && ` · ${centered.genres.join(', ')}`}
              </p>
              {centered.priority && (
                <p className="recommended-by">★ Conseillé{centered.recommendedBy ? ` par ${centered.recommendedBy}` : ''}</p>
              )}
              <div className="badges">
                <button
                  type="button"
                  className={centered.ownership === 'owned' ? 'badge on' : 'badge'}
                  aria-pressed={centered.ownership === 'owned'}
                  onClick={() => toggleOwnership(centered, 'owned')}
                >
                  Je l'ai
                </button>
                <button
                  type="button"
                  className={centered.ownership === 'wish' ? 'badge on wish' : 'badge'}
                  aria-pressed={centered.ownership === 'wish'}
                  onClick={() => toggleOwnership(centered, 'wish')}
                >
                  Envie
                </button>
                <button
                  type="button"
                  className={centered.seen ? 'badge on' : 'badge'}
                  aria-pressed={centered.seen}
                  onClick={() => update(centered, { seen: !centered.seen })}
                >
                  ✓ {doneLabel(centered.category)}
                </button>
                <button
                  type="button"
                  className={centered.priority ? 'badge on priority' : 'badge'}
                  aria-pressed={centered.priority}
                  onClick={() => update(centered, { priority: !centered.priority })}
                >
                  ★ Conseillé
                </button>
              </div>
              <button type="button" className="link-btn small-link" onClick={() => setEditing(centered)}>
                Modifier, couverture, listes…
              </button>
            </section>
          )}
        </>
      ) : (
        <div className="item-grid">
          {visible.map((i) => (
            <button
              key={i.id}
              type="button"
              className={i.priority ? 'item-tile recommended' : 'item-tile'}
              onClick={() => setEditing(i)}
            >
              <CoverImage item={i} />
              {i.priority && <span className="cf-ribbon">★</span>}
              <span className="item-title">{i.title}</span>
              <span className="tile-marks muted">
                {[i.ownership === 'owned' && "Je l'ai", i.ownership === 'wish' && 'Envie', i.seen && doneLabel(i.category)]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <ItemForm
          key={editing === 'new' ? 'new' : editing.id}
          item={editing === 'new' ? undefined : editing}
          defaultCategory={cat?.id ?? 'films'}
          knownGenres={allGenres}
          lists={lists}
          onClose={() => setEditing(undefined)}
          onSaved={setFocusId}
        />
      )}
    </div>
  )
}
