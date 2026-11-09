import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Note } from '../db'
import { labelPath } from '../notes/labels'

const shortDate = (ms: number) => new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

function noteHeading(n: Note) {
  return n.title.trim() || n.body.trim().split('\n')[0] || 'Note vide'
}

function noteExcerpt(n: Note) {
  const lines = n.body.trim().split('\n')
  return (n.title.trim() ? lines[0] : lines[1]) ?? ''
}

// Liste des étiquettes et des notes d'un niveau : la racine, ou l'intérieur d'une étiquette.
export default function Notes() {
  const { labelId } = useParams()
  const currentId = labelId ? Number(labelId) : 0
  const navigate = useNavigate()
  const [name, setName] = useState('')
  // Message lié à l'étiquette qui l'a produit : il disparaît quand on change d'étiquette.
  const [message, setMessage] = useState<{ labelId: number; text: string } | null>(null)

  const labels = useLiveQuery(() => db.labels.toArray(), [])
  const notes = useLiveQuery(
    () => db.notes.where('labelId').equals(currentId).reverse().sortBy('updatedAt'),
    [currentId],
  )
  const noteCounts = useLiveQuery(
    async () => {
      const all = await db.notes.toArray()
      return all.reduce<Record<number, number>>((acc, n) => {
        acc[n.labelId] = (acc[n.labelId] ?? 0) + 1
        return acc
      }, {})
    },
    [],
    {} as Record<number, number>,
  )

  // Les notes créées puis laissées vides sont supprimées en revenant à la liste.
  useEffect(() => {
    db.notes.filter((n) => !n.title.trim() && !n.body.trim()).delete()
  }, [])

  if (!labels || !notes) return null

  const current = labels.find((l) => l.id === currentId)
  if (currentId && !current) {
    return (
      <section className="card">
        <h1>Étiquette introuvable</h1>
        <Link to="/notes" className="back-link">← Toutes les notes</Link>
      </section>
    )
  }

  const path = currentId ? labelPath(labels, currentId) : []
  const parentTo = current?.parentId ? `/notes/etiquette/${current.parentId}` : current ? '/notes' : '/'
  const children = labels
    .filter((l) => l.parentId === currentId)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  const subCount = (id: number) => labels.filter((l) => l.parentId === id).length

  async function addLabel(e: React.FormEvent) {
    e.preventDefault()
    const clean = name.trim()
    if (!clean) return
    setName('')
    await db.labels.add({ name: clean, parentId: currentId, createdAt: Date.now() })
  }

  async function newNote() {
    const now = Date.now()
    const id = await db.notes.add({ labelId: currentId, title: '', body: '', createdAt: now, updatedAt: now })
    navigate(`/notes/note/${id}`)
  }

  async function rename() {
    if (!current?.id) return
    const next = window.prompt("Nouveau nom de l'étiquette", current.name)?.trim()
    if (next) await db.labels.update(current.id, { name: next })
  }

  async function removeLabel() {
    if (!current?.id || !notes) return
    if (children.length > 0 || notes.length > 0) {
      setMessage({ labelId: currentId, text: 'Vide d’abord cette étiquette : déplace ou supprime ses notes et ses sous-étiquettes.' })
      return
    }
    if (!window.confirm(`Supprimer l'étiquette « ${current.name} » ?`)) return
    await db.labels.delete(current.id)
    navigate(parentTo)
  }

  return (
    <div>
      <Link to={parentTo} className="back-link">← Retour</Link>
      <header className="page-head">
        <h1>{current ? current.name : 'Notes'}</h1>
        {path.length > 0 ? (
          <nav className="breadcrumb" aria-label="Chemin">
            <Link to="/notes">Notes</Link>
            {path.map((l) => (
              <span key={l.id}>
                {' › '}
                {l.id === currentId ? <span>{l.name}</span> : <Link to={`/notes/etiquette/${l.id}`}>{l.name}</Link>}
              </span>
            ))}
          </nav>
        ) : (
          <p className="muted">Tes notes, rangées par étiquettes</p>
        )}
      </header>

      <button type="button" className="btn btn-block" onClick={newNote}>+ Nouvelle note</button>

      <section className="card">
        <h2>{current ? 'Sous-étiquettes' : 'Étiquettes'}</h2>
        {children.length > 0 && (
          <ul className="plain-list">
            {children.map((l) => {
              const subs = subCount(l.id as number)
              const count = noteCounts[l.id as number] ?? 0
              return (
                <li key={l.id}>
                  <Link to={`/notes/etiquette/${l.id}`} className="label-row">
                    <span className="label-dot" aria-hidden="true" />
                    <span className="label-name">{l.name}</span>
                    <span className="muted small-text">
                      {count} note{count > 1 ? 's' : ''}
                      {subs > 0 && ` · ${subs} sous-étiquette${subs > 1 ? 's' : ''}`}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        <form className="task-form" onSubmit={addLabel}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={current ? `Nouvelle sous-étiquette dans ${current.name}` : 'Nouvelle étiquette'}
            aria-label={current ? 'Nouvelle sous-étiquette' : 'Nouvelle étiquette'}
          />
          <button type="submit" className="btn">Créer</button>
        </form>
      </section>

      <section className="card">
        <h2>{current ? `Notes · ${current.name}` : 'Notes sans étiquette'}</h2>
        {notes.length === 0 ? (
          <p className="muted">Aucune note ici pour l'instant.</p>
        ) : (
          <ul className="plain-list">
            {notes.map((n) => (
              <li key={n.id}>
                <Link to={`/notes/note/${n.id}`} className="note-row">
                  <span className="note-row-head">
                    <strong>{noteHeading(n)}</strong>
                    <span className="muted small-text">{shortDate(n.updatedAt)}</span>
                  </span>
                  {noteExcerpt(n) && <span className="muted small-text note-excerpt">{noteExcerpt(n)}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {current && (
        <section className="card label-actions">
          <button type="button" className="link-btn" onClick={rename}>Renommer l'étiquette</button>
          <button type="button" className="link-btn danger" onClick={removeLabel}>Supprimer l'étiquette</button>
          {message?.labelId === currentId && <p className="muted small-text">{message.text}</p>}
        </section>
      )}
    </div>
  )
}
