import { useState } from 'react'
import { db, type CultureCategory, type CultureItem, type CultureList, type Ownership } from '../db'
import { CATEGORIES, OWNERSHIP, doneLabel, parseGenres } from '../culture/categories'
import CoverPicker from './CoverPicker'
import Sheet from './Sheet'

interface Props {
  // Œuvre à modifier ; absente pour un ajout.
  item?: CultureItem
  defaultCategory: CultureCategory
  knownGenres: string[]
  lists: CultureList[]
  onClose: () => void
  onSaved: (id: number) => void
}

export default function ItemForm({ item, defaultCategory, knownGenres, lists, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(item?.title ?? '')
  const [category, setCategory] = useState<CultureCategory>(item?.category ?? defaultCategory)
  const [cover, setCover] = useState(item?.cover)
  const [ownership, setOwnership] = useState<Ownership>(item?.ownership ?? 'owned')
  const [seen, setSeen] = useState(item?.seen ?? false)
  const [priority, setPriority] = useState(item?.priority ?? false)
  const [recommendedBy, setRecommendedBy] = useState(item?.recommendedBy ?? '')
  const [genres, setGenres] = useState((item?.genres ?? []).join(', '))
  const [listIds, setListIds] = useState(item?.listIds ?? [])

  const current = parseGenres(genres)
  const suggestions = knownGenres.filter((g) => !current.some((c) => c.toLowerCase() === g.toLowerCase()))

  function addGenre(g: string) {
    setGenres([...current, g].join(', '))
  }

  function toggleList(id: number) {
    setListIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const clean = title.trim()
    if (!clean) return
    const data = {
      title: clean,
      category,
      cover,
      ownership,
      seen,
      priority,
      recommendedBy: priority ? recommendedBy.trim() || undefined : undefined,
      genres: current,
      listIds,
    }
    const id =
      item?.id !== undefined
        ? (await db.items.update(item.id, data), item.id)
        : await db.items.add({ ...data, createdAt: Date.now() })
    onSaved(id)
    onClose()
  }

  async function remove() {
    if (item?.id === undefined) return
    if (!window.confirm(`Supprimer « ${item.title} » ?`)) return
    await db.items.delete(item.id)
    onClose()
  }

  return (
    <Sheet title={item ? 'Modifier' : 'Ajouter une œuvre'} onClose={onClose}>
      <form className="item-form" onSubmit={save}>
        <label className="field-label">
          Type
          <select className="field" value={category} onChange={(e) => setCategory(e.target.value as CultureCategory)}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label">
          Titre
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus={!item} />
        </label>

        <div className="field-label">
          Couverture
          <CoverPicker title={title} category={category} value={cover} onChange={setCover} />
        </div>

        <div className="field-label">
          Statut
          <div className="segmented" role="radiogroup" aria-label="Statut">
            {OWNERSHIP.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={ownership === o.id}
                className={ownership === o.id ? 'chip active' : 'chip'}
                onClick={() => setOwnership(o.id)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <label className="check">
          <input type="checkbox" checked={seen} onChange={(e) => setSeen(e.target.checked)} />
          {doneLabel(category)}
        </label>

        <label className="check">
          <input type="checkbox" checked={priority} onChange={(e) => setPriority(e.target.checked)} />
          ★ Conseillé (mis en avant)
        </label>
        {priority && (
          <input
            className="field"
            value={recommendedBy}
            onChange={(e) => setRecommendedBy(e.target.value)}
            placeholder="Conseillé par… (facultatif)"
            aria-label="Conseillé par"
          />
        )}

        <label className="field-label">
          Genres (séparés par des virgules)
          <input
            className="field"
            value={genres}
            onChange={(e) => setGenres(e.target.value)}
            placeholder="ex. Thriller, SF, Coopératif"
          />
        </label>
        {suggestions.length > 0 && (
          <div className="filters">
            {suggestions.map((g) => (
              <button key={g} type="button" className="chip" onClick={() => addGenre(g)}>
                + {g}
              </button>
            ))}
          </div>
        )}

        {lists.length > 0 && (
          <div className="field-label">
            Listes
            <div className="filters">
              {lists.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={listIds.includes(l.id!) ? 'chip active' : 'chip'}
                  aria-pressed={listIds.includes(l.id!)}
                  onClick={() => toggleList(l.id!)}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn">
            {item ? 'Enregistrer' : 'Ajouter'}
          </button>
          {item && (
            <button type="button" className="link-btn danger" onClick={remove}>
              Supprimer
            </button>
          )}
        </div>
      </form>
    </Sheet>
  )
}
