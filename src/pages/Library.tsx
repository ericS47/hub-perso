import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type CultureItem, type CultureList, type CultureTheme, type Ownership } from '../db'
import { categoryOf, doneLabel } from '../culture/categories'
import { importBabelio } from '../culture/babelio'
import { importWatchList } from '../culture/watchlist'
import { importMyludo } from '../culture/myludo'
import { fillMissingCovers, type FillProgress } from '../culture/fillCovers'
import Coverflow from '../components/Coverflow'
import CoverImage from '../components/CoverImage'
import ItemForm from '../components/ItemForm'
import ThemeRows, { NO_THEME } from '../components/ThemeRows'
import ThemeManager from '../components/ThemeManager'

type Filter = 'all' | 'priority' | 'owned' | 'wish' | 'done' | 'todo'
type View = 'carousel' | 'grid' | 'themes'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'priority', label: '★ Conseillés' },
  { id: 'owned', label: "Je l'ai" },
  { id: 'wish', label: 'Envie' },
  { id: 'done', label: 'Vu / lu / joué' },
  { id: 'todo', label: 'À découvrir' },
]

const VIEWS: { id: View; label: string }[] = [
  { id: 'carousel', label: '◫ Carrousel' },
  { id: 'grid', label: '▦ Grille' },
  { id: 'themes', label: '🗂 Par thème' },
]

const VIEW_KEY = 'culture-view'

function readView(): View {
  try {
    const v = localStorage.getItem(VIEW_KEY)
    return v === 'grid' || v === 'themes' ? v : 'carousel'
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

// Une catégorie (/culture/films) ou une liste perso (/culture/liste/3), en carrousel.
export default function Library() {
  const { category, listId: listParam } = useParams()
  const cat = categoryOf(category)
  const isList = listParam !== undefined
  const listId = Number(listParam)

  const all = useLiveQuery(() => db.items.toArray(), [], [] as CultureItem[])
  const lists = useLiveQuery(() => db.lists.orderBy('createdAt').toArray(), [], [] as CultureList[])

  const [filter, setFilter] = useState<Filter>('all')
  const [genre, setGenre] = useState<string>()
  const [query, setQuery] = useState('')
  const [view, setView] = useState<View>(readView)
  const [centeredId, setCenteredId] = useState<number>()
  const [focusId, setFocusId] = useState<number>()
  const [editing, setEditing] = useState<CultureItem | 'new'>()
  const [managing, setManaging] = useState(false)
  const [filling, setFilling] = useState<FillProgress | 'checking'>()
  const fillAbort = useRef<AbortController | null>(null)
  useEffect(() => () => fillAbort.current?.abort(), [])
  const themeList = useLiveQuery(
    () => (category ? db.themes.where('category').equals(category).toArray() : []),
    [category],
    [] as CultureTheme[],
  )

  const navigate = useNavigate()
  const onCenterChange = useCallback((item: CultureItem) => setCenteredId(item.id), [])

  const activeList = lists.find((l) => l.id === listId)

  if (!isList && !cat) {
    return (
      <section className="card">
        <h1>Catégorie inconnue</h1>
        <Link to="/culture">Retour à la culture</Link>
      </section>
    )
  }

  const inTab = all.filter((i) => (isList ? i.listIds.includes(listId) : i.category === cat?.id))
  const tabGenres = [...new Set(inTab.flatMap((i) => i.genres))].sort((a, b) => a.localeCompare(b, 'fr'))
  const activeGenre = genre === NO_THEME || (genre && tabGenres.includes(genre)) ? genre : undefined
  const q = query.trim().toLowerCase()

  // Les œuvres conseillées passent devant, puis les plus récentes.
  const visible = inTab
    .filter((i) => matches(i, filter))
    .filter((i) => !activeGenre || (activeGenre === NO_THEME ? i.genres.length === 0 : i.genres.includes(activeGenre)))
    .filter((i) => !q || i.title.toLowerCase().includes(q))
    .sort((a, b) => Number(b.priority) - Number(a.priority) || b.createdAt - a.createdAt)

  // Rangées par thème : les thèmes les plus fournis d'abord.
  const rowThemes = [...new Set([...themeList.map((t) => t.name), ...tabGenres])]
    .map((name) => ({ name, n: visible.filter((i) => i.genres.includes(name)).length }))
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, 'fr'))
    .map((t) => t.name)

  function openFromTheme(theme: string, item?: CultureItem) {
    setGenre(theme)
    setFocusId(item?.id)
    setCenteredId(item?.id)
    changeView('carousel')
    window.scrollTo({ top: 0 })
  }

  const centered = visible.find((i) => i.id === centeredId) ?? visible[0]

  function changeView(v: View) {
    setView(v)
    // La vue par thème montre tous les thèmes : le filtre de thème n'y a pas de sens.
    if (v === 'themes') setGenre(undefined)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {
      // Stockage indisponible (navigation privée) : le choix vaut pour la session.
    }
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
    navigate('/culture')
  }

  async function fillCovers() {
    if (filling) {
      fillAbort.current?.abort()
      return
    }
    const ctrl = new AbortController()
    fillAbort.current = ctrl
    setFilling('checking')
    const r = await fillMissingCovers(inTab, ctrl.signal, setFilling)
    setFilling(undefined)
    if (ctrl.signal.aborted) return
    window.alert(
      r.total === 0
        ? 'Toutes les œuvres ont déjà une image.'
        : `${r.found} image(s) trouvée(s) sur ${r.total} manquante(s).` +
            (r.found < r.total ? ' Pour les autres : Modifier → Couverture.' : ''),
    )
  }

  async function onImportMyludo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const r = await importMyludo(file)
      const parts = [`${r.added} jeu(x) importé(s)${r.added ? (r.wishlist ? ' en « Envie »' : " en « Je l'ai »") : ''}`]
      if (r.updated) parts.push(`${r.updated} complété(s)`)
      if (r.skipped) parts.push(`${r.skipped} déjà à jour`)
      window.alert(parts.join(', ') + '.' + (r.added ? ' Touche « Trouver les affiches manquantes » pour les boîtes.' : ''))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Import impossible.')
    }
  }

  async function onImportWatchList(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const r = await importWatchList(file)
      const parts = [`${r.films} film(s) et ${r.series} série(s) importé(s)`]
      if (r.updated) parts.push(`${r.updated} complété(s)`)
      if (r.skipped) parts.push(`${r.skipped} déjà à jour`)
      window.alert(parts.join(', ') + '.')
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Import impossible.')
    }
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const r = await importBabelio(file)
      const parts = [`${r.added} livre(s) importé(s)`]
      if (r.updated) parts.push(`${r.updated} rangé(s) dans leurs thèmes`)
      if (r.skipped) parts.push(`${r.skipped} déjà à jour`)
      window.alert(parts.join(', ') + '.')
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Import impossible.')
    }
  }

  async function update(item: CultureItem, changes: Partial<CultureItem>) {
    if (item.id !== undefined) await db.items.update(item.id, changes)
  }

  function toggleOwnership(item: CultureItem, o: Ownership) {
    return update(item, { ownership: item.ownership === o ? 'none' : o })
  }

  return (
    <div>
      <Link to="/culture" className="back-link">← Culture</Link>
      <header className="page-head culture-head">
        <div>
          <h1>
            <span aria-hidden="true">{isList ? '📝' : cat?.icon} </span>
            {isList ? activeList?.name ?? 'Liste' : cat?.label}
          </h1>
          <p className="muted">
            {visible.length === inTab.length ? `${inTab.length} œuvre(s)` : `${visible.length} sur ${inTab.length} œuvre(s)`}
          </p>
        </div>
        <div className="head-actions">
          <button type="button" className="btn" onClick={() => setEditing('new')}>
            + Ajouter
          </button>
        </div>
      </header>

      <div className="library-tools">
        <input
          className="search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un titre"
          aria-label="Rechercher un titre"
        />
        <div className="segmented view-switch" role="group" aria-label="Affichage">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={view === v.id ? 'chip small active' : 'chip small'}
              aria-pressed={view === v.id}
              onClick={() => changeView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
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
        {tabGenres.length > 0 && view !== 'themes' && (
          <div className="filters scroll-row" role="group" aria-label="Filtrer par thème">
            <button
              type="button"
              className={!activeGenre ? 'chip small active' : 'chip small'}
              onClick={() => setGenre(undefined)}
            >
              Tous thèmes
            </button>
            {activeGenre === NO_THEME && (
              <button type="button" className="chip small active" aria-pressed onClick={() => setGenre(undefined)}>
                Sans thème
              </button>
            )}
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
        {view === 'themes' && cat && (
          <button type="button" className="link-btn small-link import-link" onClick={() => setManaging(true)}>
            ⚙️ Gérer les thèmes
          </button>
        )}
        {inTab.length > 0 && (
          <button type="button" className="link-btn small-link import-link" onClick={fillCovers}>
            {filling === undefined
              ? '🖼️ Trouver les affiches manquantes'
              : filling === 'checking'
                ? 'Vérification des images… (toucher pour arrêter)'
                : `Recherche des affiches ${filling.done}/${filling.total}… (toucher pour arrêter)`}
          </button>
        )}
        {cat?.id === 'jeux-societe' && (
          <label className="link-btn small-link import-link">
            📥 Importer depuis Myludo (fichier .json)
            {/* Pas de filtre accept : sur iPhone, « .json » rend le fichier grisé. */}
            <input type="file" data-import="myludo" hidden onChange={onImportMyludo} />
          </label>
        )}
        {(cat?.id === 'films' || cat?.id === 'series') && (
          <label className="link-btn small-link import-link">
            📥 Importer depuis Watch List (fichier .json)
            {/* Pas de filtre accept : sur iPhone, « .json » rend le fichier grisé dans le sélecteur.
                Le contenu est vérifié à l'import. */}
            <input type="file" data-import="watchlist" hidden onChange={onImportWatchList} />
          </label>
        )}
        {cat?.id === 'livres' && (
          <label className="link-btn small-link import-link">
            📥 Importer depuis Babelio (fichier CSV)
            <input type="file" accept=".csv,text/csv,text/plain" hidden onChange={onImport} />
          </label>
        )}
        {activeList && (
          <button type="button" className="link-btn small-link danger" onClick={() => deleteList(activeList)}>
            Supprimer la liste
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <section className="card empty">
          <p className="muted">
            {inTab.length === 0
              ? isList
                ? 'Liste vide : ajoute des œuvres depuis leur fiche (Modifier → Listes).'
                : 'Rien ici pour l’instant.'
              : 'Rien à afficher pour ces filtres.'}
          </p>
          {inTab.length === 0 && !isList && (
            <button type="button" className="btn" onClick={() => setEditing('new')}>
              Ajouter une œuvre
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
                {centered.creator && ` · ${centered.creator}`}
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
      ) : view === 'themes' ? (
        <ThemeRows items={visible} themes={rowThemes} onOpen={openFromTheme} />
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

      {managing && cat && <ThemeManager category={cat.id} items={inTab} onClose={() => setManaging(false)} />}

      {editing && (
        <ItemForm
          key={editing === 'new' ? 'new' : editing.id}
          item={editing === 'new' ? undefined : editing}
          defaultCategory={cat?.id ?? 'films'}
          lists={lists}
          onClose={() => setEditing(undefined)}
          onSaved={setFocusId}
        />
      )}
    </div>
  )
}
